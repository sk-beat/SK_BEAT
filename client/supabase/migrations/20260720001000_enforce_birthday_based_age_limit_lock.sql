create or replace function public.validate_kabataan_birthdate(p_date_of_birth date)
returns void
language plpgsql
stable
set search_path = public
as $$
begin
  if p_date_of_birth is null then
    return;
  end if;

  if p_date_of_birth < date '1900-01-01' then
    raise exception 'Birthday must be on or after January 1, 1900.';
  end if;

  if p_date_of_birth > current_date then
    raise exception 'Birthday cannot be in the future.';
  end if;
end;
$$;

revoke all on function public.validate_kabataan_birthdate(date) from public, anon, authenticated;

create or replace function public.sync_kabataan_age_from_birthdate()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_age integer;
begin
  if new.date_of_birth is not null then
    perform public.validate_kabataan_birthdate(new.date_of_birth);
    v_age := public.calculate_age_from_birthdate(new.date_of_birth);
    new.age := v_age;

    if v_age >= 31 then
      new.status := 'inactive'::public.kabataan_status_type;
      new.account_lock_reason := 'age_limit';
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
$$;

revoke all on function public.sync_kabataan_age_from_birthdate() from public, anon, authenticated;

drop trigger if exists sync_kabataan_age_from_birthdate_trigger
on public.kabataan_profiles;

create trigger sync_kabataan_age_from_birthdate_trigger
before insert or update of date_of_birth, age
on public.kabataan_profiles
for each row
execute function public.sync_kabataan_age_from_birthdate();

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
      or age is distinct from public.calculate_age_from_birthdate(date_of_birth)
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

select public.refresh_kabataan_ages_and_lock_limit();
