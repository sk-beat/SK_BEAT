alter table public.kabataan_profiles
add column if not exists account_lock_reason text,
add column if not exists account_locked_at timestamp with time zone;

alter table public.kabataan_profiles
drop constraint if exists kabataan_profiles_account_lock_reason_check;

alter table public.kabataan_profiles
add constraint kabataan_profiles_account_lock_reason_check
check (account_lock_reason is null or account_lock_reason in ('age_limit', 'manual_admin'));

create or replace function public.apply_kabataan_account_lock(p_profile_id uuid)
returns public.kabataan_profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile public.kabataan_profiles;
  v_age integer;
begin
  select * into v_profile
  from public.kabataan_profiles
  where profile_id = p_profile_id;

  if not found then
    raise exception 'Youth profile not found.';
  end if;

  if v_profile.date_of_birth is null then
    return v_profile;
  end if;

  v_age := public.calculate_age_from_birthdate(v_profile.date_of_birth);

  if v_age >= 31 and (
    v_profile.status is distinct from 'inactive'::public.kabataan_status_type
    or v_profile.account_lock_reason is distinct from 'age_limit'
  ) then
    update public.kabataan_profiles
    set status = 'inactive'::public.kabataan_status_type,
        age = v_age,
        account_lock_reason = 'age_limit',
        account_locked_at = coalesce(account_locked_at, now())
    where profile_id = p_profile_id
    returning * into v_profile;
  elsif v_profile.age is distinct from v_age then
    update public.kabataan_profiles
    set age = v_age
    where profile_id = p_profile_id
    returning * into v_profile;
  end if;

  return v_profile;
end;
$$;

revoke all on function public.apply_kabataan_account_lock(uuid) from public, anon, authenticated;
grant execute on function public.apply_kabataan_account_lock(uuid) to authenticated;

create or replace function public.refresh_my_kabataan_account_lock()
returns public.kabataan_profiles
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Authentication required.';
  end if;

  return public.apply_kabataan_account_lock(auth.uid());
end;
$$;

revoke all on function public.refresh_my_kabataan_account_lock() from public, anon, authenticated;
grant execute on function public.refresh_my_kabataan_account_lock() to authenticated;

create or replace function public.lock_admin_youth_account(
  p_profile_id uuid,
  p_reason text default 'manual_admin'
)
returns public.kabataan_profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  v_saved public.kabataan_profiles;
begin
  if not public.is_active_admin() then
    raise exception 'Active admin required.';
  end if;

  if p_reason not in ('manual_admin', 'age_limit') then
    raise exception 'Invalid lock reason.';
  end if;

  update public.kabataan_profiles
  set status = 'inactive'::public.kabataan_status_type,
      account_lock_reason = p_reason,
      account_locked_at = now()
  where profile_id = p_profile_id
  returning * into v_saved;

  if not found then
    raise exception 'Youth profile not found.';
  end if;

  return v_saved;
end;
$$;

revoke all on function public.lock_admin_youth_account(uuid,text) from public, anon, authenticated;
grant execute on function public.lock_admin_youth_account(uuid,text) to authenticated;

create or replace function public.unlock_admin_youth_account(p_profile_id uuid)
returns public.kabataan_profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile public.kabataan_profiles;
  v_age integer;
begin
  if not public.is_active_admin() then
    raise exception 'Active admin required.';
  end if;

  select * into v_profile
  from public.kabataan_profiles
  where profile_id = p_profile_id;

  if not found then
    raise exception 'Youth profile not found.';
  end if;

  if v_profile.date_of_birth is not null then
    v_age := public.calculate_age_from_birthdate(v_profile.date_of_birth);
    if v_age >= 31 then
      raise exception 'Cannot unlock an age-locked account. Kabataan eligibility is up to age 30.';
    end if;
  end if;

  update public.kabataan_profiles
  set status = 'active'::public.kabataan_status_type,
      account_lock_reason = null,
      account_locked_at = null
  where profile_id = p_profile_id
  returning * into v_profile;

  return v_profile;
end;
$$;

revoke all on function public.unlock_admin_youth_account(uuid) from public, anon, authenticated;
grant execute on function public.unlock_admin_youth_account(uuid) to authenticated;

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
    if new.date_of_birth < date '1900-01-01' then
      raise exception 'Birthday must be on or after January 1, 1900.';
    end if;

    if new.date_of_birth > current_date then
      raise exception 'Birthday cannot be in the future.';
    end if;

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

update public.kabataan_profiles
set age = public.calculate_age_from_birthdate(date_of_birth)
where date_of_birth is not null;

update public.kabataan_profiles
set status = 'inactive'::public.kabataan_status_type,
    account_lock_reason = 'age_limit',
    account_locked_at = coalesce(account_locked_at, now())
where date_of_birth is not null
  and public.calculate_age_from_birthdate(date_of_birth) >= 31;
