begin;

create or replace function public.normalize_sk_official_position(p_position text)
returns text
language sql
immutable
set search_path = public
as $$
  select case trim(p_position)
    when 'SK Chairperson' then 'SK Chairperson'
    when 'SK Councilor' then 'SK Councilor'
    when 'SK Secretary' then 'SK Secretary'
    when 'SK Treasurer' then 'SK Treasurer'
    else null
  end;
$$;

revoke all on function public.normalize_sk_official_position(text)
from public, anon, authenticated;

alter table public.sk_officials
drop constraint if exists sk_officials_valid_position_check;

alter table public.sk_officials
add constraint sk_officials_valid_position_check
check (public.normalize_sk_official_position(position) is not null);

create index if not exists sk_officials_position_role_idx
on public.sk_officials(position, full_name, official_id);

create or replace function public.validate_sk_official_role_limit(
  p_official_id uuid,
  p_position text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_position text;
  v_existing_count integer;
begin
  v_position := public.normalize_sk_official_position(p_position);

  if v_position is null then
    raise exception 'Invalid SK official position.';
  end if;

  perform pg_advisory_xact_lock(hashtext('sk_official_role:' || v_position));

  select count(*)
  into v_existing_count
  from public.sk_officials
  where position = v_position
    and (p_official_id is null or official_id <> p_official_id);

  if v_position = 'SK Chairperson' and v_existing_count >= 1 then
    raise exception 'Only one SK Chairperson is allowed.';
  end if;

  if v_position = 'SK Councilor' and v_existing_count >= 7 then
    raise exception 'Only seven SK Councilors are allowed.';
  end if;

  if v_position = 'SK Secretary' and v_existing_count >= 1 then
    raise exception 'Only one SK Secretary is allowed.';
  end if;

  if v_position = 'SK Treasurer' and v_existing_count >= 1 then
    raise exception 'Only one SK Treasurer is allowed.';
  end if;
end;
$$;

revoke all on function public.validate_sk_official_role_limit(uuid, text)
from public, anon, authenticated;

create or replace function public.save_admin_sk_official(
  p_official_id uuid default null,
  p_full_name text default null,
  p_position text default null,
  p_biography text default null,
  p_photo_path text default null,
  p_term_start date default null,
  p_term_end date default null
)
returns public.sk_officials
language plpgsql
security definer
set search_path = public
as $$
declare
  v_position text;
  v_saved public.sk_officials;
begin
  if not public.is_active_admin() then
    raise exception 'Only active admins can save SK officials.';
  end if;

  if nullif(trim(coalesce(p_full_name, '')), '') is null then
    raise exception 'Full name is required.';
  end if;

  v_position := public.normalize_sk_official_position(coalesce(p_position, ''));

  if v_position is null then
    raise exception 'Select a valid SK official position.';
  end if;

  if p_term_start is not null and p_term_end is not null and p_term_end < p_term_start then
    raise exception 'Term end cannot be before term start.';
  end if;

  perform public.validate_sk_official_role_limit(p_official_id, v_position);

  if p_official_id is null then
    insert into public.sk_officials (
      full_name,
      position,
      biography,
      photo_path,
      term_start,
      term_end,
      created_by
    )
    values (
      trim(p_full_name),
      v_position,
      nullif(trim(coalesce(p_biography, '')), ''),
      nullif(trim(coalesce(p_photo_path, '')), ''),
      p_term_start,
      p_term_end,
      auth.uid()
    )
    returning * into v_saved;
  else
    update public.sk_officials
    set
      full_name = trim(p_full_name),
      position = v_position,
      biography = nullif(trim(coalesce(p_biography, '')), ''),
      photo_path = nullif(trim(coalesce(p_photo_path, '')), ''),
      term_start = p_term_start,
      term_end = p_term_end
    where official_id = p_official_id
    returning * into v_saved;

    if not found then
      raise exception 'SK official not found.';
    end if;
  end if;

  return v_saved;
end;
$$;

revoke all on function public.save_admin_sk_official(uuid, text, text, text, text, date, date)
from public, anon;

grant execute on function public.save_admin_sk_official(uuid, text, text, text, text, date, date)
to authenticated;

drop view if exists public.public_sk_officials;

create view public.public_sk_officials
with (security_invoker = true)
as
select
  official_id,
  full_name,
  position,
  biography,
  photo_path,
  term_start,
  term_end
from public.sk_officials
order by
  case position
    when 'SK Chairperson' then 1
    when 'SK Councilor' then 2
    when 'SK Secretary' then 3
    when 'SK Treasurer' then 4
    else 99
  end,
  full_name,
  official_id;

revoke all on public.public_sk_officials from public, anon, authenticated;
grant select on public.public_sk_officials to anon, authenticated;

drop policy if exists "Public can view active SK officials" on public.sk_officials;
drop policy if exists "Public can view SK officials" on public.sk_officials;
drop policy if exists "Active admins can read SK officials" on public.sk_officials;
drop policy if exists "Active admins can insert SK officials" on public.sk_officials;
drop policy if exists "Active admins can update SK officials" on public.sk_officials;

create policy "Active admins can read SK officials"
on public.sk_officials
for select
to authenticated
using (public.is_active_admin());

commit;
