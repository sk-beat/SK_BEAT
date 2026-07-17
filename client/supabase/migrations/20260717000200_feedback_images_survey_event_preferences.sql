-- Mirrors the remote migration applied through Supabase MCP:
-- feedback guest/auth RPCs, profile image storage/Admin image column,
-- event-interest survey fields/RPCs, secured event-preference reporting,
-- and public future scheduled-event lookup.

alter table public.post_event_feedback alter column user_id drop not null;

alter table public.post_event_feedback
  add column if not exists respondent_type text,
  add column if not exists guest_name text,
  add column if not exists was_registered boolean;

update public.post_event_feedback
set respondent_type = case when user_id is null then 'guest' else 'registered_user' end
where respondent_type is null;

update public.post_event_feedback f
set was_registered = coalesce((
  select exists (
    select 1 from public.event_registrations r
    where r.event_id = f.event_id and r.user_id = f.user_id
  )
), false)
where was_registered is null;

alter table public.post_event_feedback
  alter column respondent_type set default 'registered_user',
  alter column respondent_type set not null,
  alter column was_registered set default false,
  alter column was_registered set not null;

alter table public.post_event_feedback
  drop constraint if exists post_event_feedback_respondent_type_check,
  add constraint post_event_feedback_respondent_type_check
  check (respondent_type in ('registered_user', 'guest'));

alter table public.post_event_feedback
  drop constraint if exists post_event_feedback_identity_consistency_check,
  add constraint post_event_feedback_identity_consistency_check
  check (
    (respondent_type = 'registered_user' and user_id is not null and guest_name is null)
    or
    (respondent_type = 'guest' and user_id is null)
  );

do $$
begin
  if exists (
    select 1 from public.post_event_feedback
    where user_id is not null
    group by event_id, user_id
    having count(*) > 1
  ) then
    raise exception 'Duplicate authenticated feedback rows exist. Stop and inspect before adding unique index.';
  end if;
end $$;

create unique index if not exists post_event_feedback_one_user_per_event_idx
on public.post_event_feedback(event_id, user_id)
where user_id is not null;

drop policy if exists "Users can submit feedback" on public.post_event_feedback;
drop policy if exists "Users can view feedback" on public.post_event_feedback;
drop policy if exists "Active admins can read event feedback" on public.post_event_feedback;
drop policy if exists "Youth can read own event feedback" on public.post_event_feedback;

create policy "Active admins can read event feedback"
on public.post_event_feedback for select to authenticated
using (public.is_active_admin());

create policy "Youth can read own event feedback"
on public.post_event_feedback for select to authenticated
using (user_id = auth.uid());

alter table public.admins add column if not exists profile_image text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('profile-images', 'profile-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can read profile images" on storage.objects;
drop policy if exists "Admins can upload profile images" on storage.objects;
drop policy if exists "Admins can update profile images" on storage.objects;
drop policy if exists "Admins can delete profile images" on storage.objects;
drop policy if exists "Youth can upload own profile image" on storage.objects;
drop policy if exists "Youth can update own profile image" on storage.objects;
drop policy if exists "Youth can delete own profile image" on storage.objects;

create policy "Public can read profile images"
on storage.objects for select to anon, authenticated
using (bucket_id = 'profile-images');

create policy "Admins can upload profile images"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'profile-images'
  and public.is_active_admin()
  and (((storage.foldername(name))[1] = 'admins' and (storage.foldername(name))[2] = auth.uid()::text)
    or (storage.foldername(name))[1] = 'youth')
);

create policy "Admins can update profile images"
on storage.objects for update to authenticated
using (
  bucket_id = 'profile-images'
  and public.is_active_admin()
  and (((storage.foldername(name))[1] = 'admins' and (storage.foldername(name))[2] = auth.uid()::text)
    or (storage.foldername(name))[1] = 'youth')
)
with check (
  bucket_id = 'profile-images'
  and public.is_active_admin()
  and (((storage.foldername(name))[1] = 'admins' and (storage.foldername(name))[2] = auth.uid()::text)
    or (storage.foldername(name))[1] = 'youth')
);

create policy "Admins can delete profile images"
on storage.objects for delete to authenticated
using (
  bucket_id = 'profile-images'
  and public.is_active_admin()
  and (((storage.foldername(name))[1] = 'admins' and (storage.foldername(name))[2] = auth.uid()::text)
    or (storage.foldername(name))[1] = 'youth')
);

create policy "Youth can upload own profile image"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'profile-images'
  and (storage.foldername(name))[1] = 'youth'
  and (storage.foldername(name))[2] = auth.uid()::text
);

create policy "Youth can update own profile image"
on storage.objects for update to authenticated
using (
  bucket_id = 'profile-images'
  and (storage.foldername(name))[1] = 'youth'
  and (storage.foldername(name))[2] = auth.uid()::text
)
with check (
  bucket_id = 'profile-images'
  and (storage.foldername(name))[1] = 'youth'
  and (storage.foldername(name))[2] = auth.uid()::text
);

create policy "Youth can delete own profile image"
on storage.objects for delete to authenticated
using (
  bucket_id = 'profile-images'
  and (storage.foldername(name))[1] = 'youth'
  and (storage.foldername(name))[2] = auth.uid()::text
);

alter table public.survey_questions
  add column if not exists event_name text,
  add column if not exists event_category text,
  add column if not exists event_description text;

alter table public.survey_options
  add column if not exists score_value int check (score_value between 1 and 5);

alter table public.survey_questions drop constraint if exists survey_questions_reporting_key_check;
alter table public.survey_questions add constraint survey_questions_reporting_key_check
check (reporting_key is null or reporting_key in ('preferred_activity_type', 'suggested_event', 'suggested_event_rating'));

alter table public.survey_questions drop constraint if exists survey_questions_event_rating_fields_check;
alter table public.survey_questions add constraint survey_questions_event_rating_fields_check
check (
  reporting_key <> 'suggested_event_rating'
  or (
    nullif(trim(coalesce(event_name, '')), '') is not null
    and nullif(trim(coalesce(event_category, '')), '') is not null
  )
);

-- Function bodies are intentionally maintained in the applied remote migration.
-- They replace save_admin_survey, submit_youth_survey_response,
-- get_public_feedback_event, submit_event_feedback,
-- update_admin_profile_image, get_admin_event_preference_recommendations,
-- and get_public_scheduled_events.
