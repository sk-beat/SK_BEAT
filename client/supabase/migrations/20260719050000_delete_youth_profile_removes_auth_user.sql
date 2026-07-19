create or replace function public.delete_admin_youth_profile(p_profile_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_deleted_profile boolean := false;
  v_profile_email text;
begin
  if not public.is_active_admin() then
    raise exception 'Active admin required.';
  end if;

  select email
    into v_profile_email
  from public.kabataan_profiles
  where profile_id = p_profile_id;

  delete from public.kabataan_profiles
  where profile_id = p_profile_id;

  v_deleted_profile := found;

  if v_deleted_profile then
    delete from auth.users
    where id = p_profile_id
       or (
        v_profile_email is not null
        and lower(email) = lower(v_profile_email)
        and not exists (
          select 1
          from public.kabataan_profiles kp
          where kp.profile_id = auth.users.id
             or lower(kp.email) = lower(auth.users.email)
        )
      );
  end if;

  return v_deleted_profile;
end;
$$;

revoke all on function public.delete_admin_youth_profile(uuid) from public;
revoke all on function public.delete_admin_youth_profile(uuid) from anon;
grant execute on function public.delete_admin_youth_profile(uuid) to authenticated;
