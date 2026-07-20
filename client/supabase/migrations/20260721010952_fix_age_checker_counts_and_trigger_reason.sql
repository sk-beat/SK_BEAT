create or replace function public.sync_kabataan_age_from_birthdate()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_age integer;
begin
  if new.date_of_birth is not null then
    perform public.validate_kabataan_birthdate(new.date_of_birth);
    v_age := public.calculate_age_from_birthdate(new.date_of_birth);
    new.age := v_age;

    if public.is_kabataan_age_ineligible(new.date_of_birth) then
      new.status := 'inactive'::public.kabataan_status_type;
      new.account_lock_reason := coalesce(new.account_lock_reason, 'age_limit');
      new.account_locked_at := coalesce(new.account_locked_at, now());
    elsif new.account_lock_reason = 'age_limit' then
      new.status := 'active'::public.kabataan_status_type;
      new.account_lock_reason := null;
      new.account_locked_at := null;
    end if;
  else
    new.age := null;
  end if;

  return new;
end;
$function$;

revoke all on function public.sync_kabataan_age_from_birthdate() from public, anon, authenticated;

create or replace function public.refresh_kabataan_ages_and_lock_limit()
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_checked_count integer := 0;
  v_missing_birthday_count integer := 0;
  v_age_refreshed_count integer := 0;
  v_newly_locked_count integer := 0;
  v_already_locked_count integer := 0;
  v_run_date_manila date := public.current_manila_date();
  v_result jsonb;
begin
  select
    count(*)::integer,
    count(*) filter (where date_of_birth is null)::integer,
    count(*) filter (
      where date_of_birth is not null
        and public.is_kabataan_age_ineligible(date_of_birth, v_run_date_manila)
        and status = 'inactive'::public.kabataan_status_type
        and account_lock_reason = 'age_limit'
    )::integer
  into v_checked_count, v_missing_birthday_count, v_already_locked_count
  from public.kabataan_profiles;

  update public.kabataan_profiles
  set status = 'inactive'::public.kabataan_status_type,
      age = public.calculate_age_from_birthdate(date_of_birth),
      account_lock_reason = 'age_limit',
      account_locked_at = coalesce(account_locked_at, now())
  where date_of_birth is not null
    and public.is_kabataan_age_ineligible(date_of_birth, v_run_date_manila)
    and status = 'active'::public.kabataan_status_type
    and (account_lock_reason is null or account_lock_reason = 'age_limit');

  get diagnostics v_newly_locked_count = row_count;

  update public.kabataan_profiles
  set age = public.calculate_age_from_birthdate(date_of_birth)
  where date_of_birth is not null
    and age is distinct from public.calculate_age_from_birthdate(date_of_birth);

  get diagnostics v_age_refreshed_count = row_count;

  v_result := jsonb_build_object(
    'checked_count', v_checked_count,
    'newly_locked_count', v_newly_locked_count,
    'already_locked_count', v_already_locked_count,
    'missing_birthday_count', v_missing_birthday_count,
    'age_refreshed_count', v_age_refreshed_count,
    'run_date_manila', v_run_date_manila
  );

  raise log '[Age Checker] Completed checked_count: %, newly_locked_count: %, already_locked_count: %, missing_birthday_count: %, run_date_manila: %',
    v_checked_count,
    v_newly_locked_count,
    v_already_locked_count,
    v_missing_birthday_count,
    v_run_date_manila;

  return v_result;
end;
$function$;

revoke all on function public.refresh_kabataan_ages_and_lock_limit() from public, anon, authenticated;
