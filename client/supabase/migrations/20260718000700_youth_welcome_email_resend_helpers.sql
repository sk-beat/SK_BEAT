create or replace function public.reserve_admin_youth_welcome_email_send(p_profile_id uuid)
returns table(profile_id uuid, fullname text, email text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile public.kabataan_profiles;
begin
  if not public.is_active_admin() then
    raise exception 'Active admin required';
  end if;

  select * into v_profile
  from public.kabataan_profiles kp
  where kp.profile_id = p_profile_id
  for update;

  if not found then
    raise exception 'Youth profile not found';
  end if;

  if coalesce(v_profile.must_change_password, false) = false
     or coalesce(v_profile.onboarding_status, 'completed') <> 'temporary_password_active' then
    raise exception 'Welcome email can only be resent while the temporary password is still active';
  end if;

  if v_profile.welcome_email_last_attempt_at is not null
     and v_profile.welcome_email_last_attempt_at > now() - interval '60 seconds' then
    raise exception 'Please wait before resending the welcome email';
  end if;

  update public.kabataan_profiles kp
  set welcome_email_attempt_count = coalesce(kp.welcome_email_attempt_count, 0) + 1,
      welcome_email_last_attempt_at = now(),
      welcome_email_last_error = null
  where kp.profile_id = p_profile_id;

  return query select v_profile.profile_id, v_profile.fullname::text, lower(trim(v_profile.email::text));
end;
$$;

create or replace function public.record_admin_youth_welcome_email_result(
  p_profile_id uuid,
  p_sent boolean,
  p_error text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_active_admin() then
    raise exception 'Active admin required';
  end if;

  update public.kabataan_profiles
  set welcome_email_sent_at = case when p_sent then now() else welcome_email_sent_at end,
      welcome_email_last_error = case when p_sent then null else left(coalesce(p_error, 'Email delivery failed'), 500) end
  where profile_id = p_profile_id;
end;
$$;

revoke all on function public.reserve_admin_youth_welcome_email_send(uuid) from public;
revoke all on function public.reserve_admin_youth_welcome_email_send(uuid) from anon;
revoke all on function public.reserve_admin_youth_welcome_email_send(uuid) from authenticated;
grant execute on function public.reserve_admin_youth_welcome_email_send(uuid) to authenticated;

revoke all on function public.record_admin_youth_welcome_email_result(uuid, boolean, text) from public;
revoke all on function public.record_admin_youth_welcome_email_result(uuid, boolean, text) from anon;
revoke all on function public.record_admin_youth_welcome_email_result(uuid, boolean, text) from authenticated;
grant execute on function public.record_admin_youth_welcome_email_result(uuid, boolean, text) to authenticated;
