create or replace function public.refresh_kabataan_ages_and_lock_limit()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_age_refreshed integer := 0;
  v_locked_count integer := 0;
begin
  update public.kabataan_profiles
  set age = public.calculate_age_from_birthdate(date_of_birth)
  where date_of_birth is not null
    and age is distinct from public.calculate_age_from_birthdate(date_of_birth);

  get diagnostics v_age_refreshed = row_count;

  update public.kabataan_profiles
  set status = 'inactive'::public.kabataan_status_type,
      age = public.calculate_age_from_birthdate(date_of_birth),
      account_lock_reason = 'age_limit',
      account_locked_at = coalesce(account_locked_at, now())
  where date_of_birth is not null
    and public.calculate_age_from_birthdate(date_of_birth) >= 31
    and (
      status is distinct from 'inactive'::public.kabataan_status_type
      or account_lock_reason is distinct from 'age_limit'
    );

  get diagnostics v_locked_count = row_count;

  return jsonb_build_object(
    'age_refreshed', v_age_refreshed,
    'locked', v_locked_count
  );
end;
$$;

revoke all on function public.refresh_kabataan_ages_and_lock_limit() from public, anon, authenticated;

create or replace function public.lock_age_limit_kabataan_accounts()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_result jsonb;
begin
  v_result := public.refresh_kabataan_ages_and_lock_limit();
  return coalesce((v_result->>'locked')::integer, 0);
end;
$$;

revoke all on function public.lock_age_limit_kabataan_accounts() from public, anon, authenticated;

select cron.unschedule(jobid)
from cron.job
where jobname in (
  'lock-age-limit-kabataan-accounts-daily',
  'refresh-kabataan-ages-and-lock-limit-daily'
);

select cron.schedule(
  'refresh-kabataan-ages-and-lock-limit-daily',
  '0 16 * * *',
  $$select public.refresh_kabataan_ages_and_lock_limit();$$
);

select public.refresh_kabataan_ages_and_lock_limit();
