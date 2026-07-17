-- Applied remotely as: guest_surveys_event_registrations_landing_settings
-- Adds guest-capable event-interest surveys, admin event registration viewer RPC,
-- Youth scheduled-events RPC, guest-aware event preference reporting, landing page
-- settings, and the landing-page-assets storage bucket/policies.

alter table public.surveys
add column if not exists allow_guest_responses boolean not null default false;

alter table public.survey_responses
add column if not exists respondent_type text not null default 'registered_user',
add column if not exists guest_session_id uuid null,
add column if not exists guest_name text null;

update public.survey_responses
set respondent_type = case when user_id is null then 'guest' else 'registered_user' end;

alter table public.survey_responses
alter column user_id drop not null;

alter table public.survey_responses
drop constraint if exists survey_responses_identity_check;

alter table public.survey_responses
add constraint survey_responses_identity_check check (
  (respondent_type = 'registered_user' and user_id is not null and guest_session_id is null)
  or
  (respondent_type = 'guest' and user_id is null and guest_session_id is not null)
);

alter table public.survey_responses
drop constraint if exists survey_responses_survey_id_user_id_key;

drop index if exists public.survey_responses_unique_registered_response;
create unique index survey_responses_unique_registered_response
on public.survey_responses(survey_id, user_id)
where respondent_type = 'registered_user' and user_id is not null;

drop index if exists public.survey_responses_unique_guest_session_response;
create unique index survey_responses_unique_guest_session_response
on public.survey_responses(survey_id, guest_session_id)
where respondent_type = 'guest' and guest_session_id is not null;

revoke insert on public.survey_responses from anon, authenticated;
revoke insert on public.survey_answers from anon, authenticated;
revoke insert on public.survey_answer_options from anon, authenticated;

-- Full function definitions are in the applied remote migration:
-- save_admin_survey(..., p_allow_guest_responses boolean)
-- get_public_event_interest_surveys()
-- get_public_event_interest_survey(integer)
-- submit_public_event_interest_survey(integer, jsonb, uuid)
-- get_admin_event_registrations(integer, text, attendance_status_type)
-- get_youth_scheduled_events()
-- get_admin_event_preference_recommendations()

create table if not exists public.landing_page_settings (
  settings_id integer primary key default 1 check (settings_id = 1),
  hero_background_path text null,
  updated_by uuid null references public.admins(admin_id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.landing_page_settings enable row level security;
revoke all on public.landing_page_settings from anon, authenticated;

drop policy if exists "Active admins can read landing settings" on public.landing_page_settings;
create policy "Active admins can read landing settings"
on public.landing_page_settings for select to authenticated
using (public.is_active_admin());

drop policy if exists "Active admins can manage landing settings" on public.landing_page_settings;
create policy "Active admins can manage landing settings"
on public.landing_page_settings for all to authenticated
using (public.is_active_admin())
with check (public.is_active_admin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'landing-page-assets',
  'landing-page-assets',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = true,
    file_size_limit = 5242880,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];
