update public.kabataan_profiles
set educational_status = 'Active'
where educational_status is null
   or educational_status = 'Student';

do $$
declare
  v_unknown text[];
begin
  select array_agg(distinct educational_status)
  into v_unknown
  from public.kabataan_profiles
  where educational_status is not null
    and educational_status not in ('Active', 'Inactive');

  if v_unknown is not null then
    raise exception 'Unknown educational_status values: %', v_unknown;
  end if;
end $$;

alter table public.kabataan_profiles
alter column educational_status set default 'Active';

alter table public.kabataan_profiles
alter column educational_status set not null;

alter table public.kabataan_profiles
drop constraint if exists kabataan_profiles_educational_status_check;

alter table public.kabataan_profiles
add constraint kabataan_profiles_educational_status_check
check (educational_status in ('Active', 'Inactive'));

create or replace function public.calculate_age_from_birthdate(
  p_date_of_birth date
)
returns integer
language sql
stable
set search_path = public
as $$
  select case
    when p_date_of_birth is null then null
    else extract(
      year from age(current_date, p_date_of_birth)
    )::integer
  end;
$$;

revoke all on function public.calculate_age_from_birthdate(date) from public, anon, authenticated;

create or replace function public.validate_kabataan_birthdate(p_date_of_birth date)
returns void
language plpgsql
stable
set search_path = public
as $$
declare
  v_age integer;
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

  v_age := public.calculate_age_from_birthdate(p_date_of_birth);
  if v_age < 0 then
    raise exception 'Birthday cannot be in the future.';
  end if;

  if v_age > 31 then
    raise exception 'Youth must be 31 years old or younger.';
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
begin
  if new.date_of_birth is not null then
    perform public.validate_kabataan_birthdate(new.date_of_birth);
    new.age := public.calculate_age_from_birthdate(new.date_of_birth);
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

create or replace function public.save_admin_youth_profile(
  p_profile_id uuid,
  p_fullname text,
  p_contact_number text,
  p_gender text,
  p_purok text,
  p_address_line text,
  p_scholar_status text,
  p_educational_status text,
  p_profile_image text,
  p_date_of_birth date
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

  if not exists (
    select 1 from public.kabataan_profiles where profile_id = p_profile_id
  ) then
    raise exception 'Youth profile not found.';
  end if;

  if p_educational_status not in ('Active', 'Inactive') then
    raise exception 'Educational Status must be Active or Inactive.';
  end if;

  if p_date_of_birth is null then
    raise exception 'Birthday is required.';
  end if;

  perform public.validate_kabataan_birthdate(p_date_of_birth);

  update public.kabataan_profiles
  set fullname = nullif(btrim(p_fullname), ''),
      contact_number = coalesce(p_contact_number, ''),
      gender = nullif(btrim(p_gender), ''),
      purok = nullif(btrim(p_purok), ''),
      address_line = nullif(btrim(p_address_line), ''),
      scholar_status = nullif(btrim(p_scholar_status), ''),
      educational_status = p_educational_status,
      profile_image = nullif(btrim(coalesce(p_profile_image, '')), ''),
      date_of_birth = p_date_of_birth
  where profile_id = p_profile_id
  returning * into v_saved;

  return v_saved;
end;
$$;

revoke all on function public.save_admin_youth_profile(uuid,text,text,text,text,text,text,text,text,date) from public, anon, authenticated;
grant execute on function public.save_admin_youth_profile(uuid,text,text,text,text,text,text,text,text,date) to authenticated;

create or replace function public.update_my_youth_profile(
  p_fullname text,
  p_contact_number text,
  p_gender text,
  p_purok text,
  p_address_line text,
  p_scholar_status text,
  p_profile_image text,
  p_date_of_birth date
)
returns public.kabataan_profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  v_saved public.kabataan_profiles;
begin
  if auth.uid() is null then
    raise exception 'Authentication required.';
  end if;

  if not exists (
    select 1 from public.kabataan_profiles where profile_id = auth.uid()
  ) then
    raise exception 'Youth profile required.';
  end if;

  if p_date_of_birth is null then
    raise exception 'Birthday is required.';
  end if;

  perform public.validate_kabataan_birthdate(p_date_of_birth);

  update public.kabataan_profiles
  set fullname = nullif(btrim(p_fullname), ''),
      contact_number = coalesce(p_contact_number, ''),
      gender = nullif(btrim(p_gender), ''),
      purok = nullif(btrim(p_purok), ''),
      address_line = nullif(btrim(p_address_line), ''),
      scholar_status = nullif(btrim(p_scholar_status), ''),
      profile_image = nullif(btrim(coalesce(p_profile_image, '')), ''),
      date_of_birth = p_date_of_birth
  where profile_id = auth.uid()
  returning * into v_saved;

  return v_saved;
end;
$$;

revoke all on function public.update_my_youth_profile(text,text,text,text,text,text,text,date) from public, anon, authenticated;
grant execute on function public.update_my_youth_profile(text,text,text,text,text,text,text,date) to authenticated;

create or replace function public.delete_admin_youth_profile(p_profile_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_active_admin() then
    raise exception 'Active admin required.';
  end if;

  delete from public.kabataan_profiles
  where profile_id = p_profile_id;

  return found;
end;
$$;

revoke all on function public.delete_admin_youth_profile(uuid) from public, anon, authenticated;
grant execute on function public.delete_admin_youth_profile(uuid) to authenticated;

drop policy if exists "Allow delete kabataan profiles" on public.kabataan_profiles;
drop policy if exists "Allow update kabataan profiles" on public.kabataan_profiles;
drop policy if exists "Authenticated users can view profiles" on public.kabataan_profiles;
drop policy if exists "Users can update own profile" on public.kabataan_profiles;
drop policy if exists "authenticated admin can insert in kabataan_profiles" on public.kabataan_profiles;
drop policy if exists "Active admins can read youth profiles" on public.kabataan_profiles;
drop policy if exists "Youth can read own profile" on public.kabataan_profiles;
drop policy if exists "Users can create own profile" on public.kabataan_profiles;

create policy "Active admins can read youth profiles"
on public.kabataan_profiles
for select
to authenticated
using (public.is_active_admin());

create policy "Youth can read own profile"
on public.kabataan_profiles
for select
to authenticated
using (auth.uid() = profile_id);

create policy "Users can create own profile"
on public.kabataan_profiles
for insert
to authenticated
with check (auth.uid() = profile_id);
