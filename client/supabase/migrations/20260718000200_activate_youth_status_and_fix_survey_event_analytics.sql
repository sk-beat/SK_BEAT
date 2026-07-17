alter table public.kabataan_profiles alter column status drop default;

update public.kabataan_profiles
set status = case status::text
  when 'pending' then 'active'::public.kabataan_status_type
  when 'approved' then 'active'::public.kabataan_status_type
  when 'rejected' then 'inactive'::public.kabataan_status_type
  when 'active' then 'active'::public.kabataan_status_type
  when 'inactive' then 'inactive'::public.kabataan_status_type
  else 'inactive'::public.kabataan_status_type
end;

alter table public.kabataan_profiles
  alter column status set default 'active'::public.kabataan_status_type;

alter table public.kabataan_profiles
  drop constraint if exists kabataan_profiles_status_active_inactive_check;

alter table public.kabataan_profiles
  add constraint kabataan_profiles_status_active_inactive_check
  check (status::text in ('active', 'inactive'));

create or replace function public.cancel_youth_event_registration(p_event_id integer)
returns table(cancelled boolean, registration_id integer)
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_event public.events;
  v_registration_id integer;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if not exists (select 1 from public.kabataan_profiles where profile_id = auth.uid() and status = 'active') then
    raise exception 'Active Youth profile required';
  end if;

  select * into v_event from public.events where events.event_id = p_event_id;
  if not found then raise exception 'Event not found'; end if;
  if v_event.status in ('completed', 'cancelled') then raise exception 'Registration can no longer be cancelled'; end if;
  if v_event.event_date is not null and v_event.event_date < current_date then raise exception 'Past event registration cannot be cancelled'; end if;

  delete from public.event_registrations er
  where er.event_id = p_event_id and er.user_id = auth.uid()
  returning er.registration_id into v_registration_id;

  if v_registration_id is null then raise exception 'Registration not found'; end if;
  return query select true, v_registration_id;
end;
$function$;

create or replace function public.register_youth_for_event(p_event_id integer)
returns table(registration_id integer, event_id integer, user_id uuid, registration_date timestamp with time zone, attendance_status attendance_status_type)
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_event public.events;
  v_slot_count int;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if not exists (select 1 from public.kabataan_profiles where profile_id = auth.uid() and status = 'active') then
    raise exception 'Active Youth profile required';
  end if;

  select * into v_event from public.events where events.event_id = p_event_id for update;
  if not found then raise exception 'Event not found'; end if;
  if v_event.status <> 'scheduled' then raise exception 'Event is not open for registration'; end if;
  if v_event.event_date is null or v_event.event_date < current_date then raise exception 'Event registration is closed'; end if;

  select count(*) into v_slot_count
  from public.event_registrations er
  where er.event_id = p_event_id and er.attendance_status in ('registered', 'attended');

  if coalesce(v_event.expected_attendees, 0) > 0 and v_slot_count >= v_event.expected_attendees then
    raise exception 'Event is already full';
  end if;

  return query
  insert into public.event_registrations (event_id, user_id, attendance_status)
  values (p_event_id, auth.uid(), 'registered')
  returning event_registrations.registration_id, event_registrations.event_id, event_registrations.user_id, event_registrations.registration_date, event_registrations.attendance_status;
exception when unique_violation then
  raise exception 'Already registered for this event';
end;
$function$;

create or replace function public.get_youth_scheduled_events()
returns table(event_id integer, event_name text, category text, status event_status_type, event_date date, event_time text, location text, expected_attendees integer, cover_image text, description text, registration_count integer, occupied_slots integer, remaining_slots integer, is_registered boolean, attendance_status attendance_status_type)
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if not exists (select 1 from public.kabataan_profiles where profile_id = auth.uid() and status = 'active') then
    raise exception 'Active Youth profile required';
  end if;

  return query
  with counts as (
    select er.event_id,
      count(*)::integer as registration_count,
      count(*) filter (where er.attendance_status in ('registered','attended'))::integer as occupied_slots
    from public.event_registrations er
    group by er.event_id
  )
  select e.event_id, e.event_name::text, e.category::text, e.status, e.event_date,
    e.event_time::text, e.location::text, e.expected_attendees, e.cover_image,
    e.description, coalesce(c.registration_count, 0), coalesce(c.occupied_slots, 0),
    case when e.expected_attendees is null or e.expected_attendees <= 0 then null
      else greatest(e.expected_attendees - coalesce(c.occupied_slots, 0), 0)
    end,
    er.registration_id is not null,
    er.attendance_status
  from public.events e
  left join counts c on c.event_id = e.event_id
  left join public.event_registrations er on er.event_id = e.event_id and er.user_id = auth.uid()
  where e.status = 'scheduled'::public.event_status_type
    and e.event_date is not null
    and e.event_date >= current_date
  order by e.event_date asc, e.event_time asc nulls last, e.event_id asc;
end;
$function$;

create or replace function public.submit_public_event_interest_survey(p_survey_id integer, p_answers jsonb, p_guest_session_id uuid default null::uuid)
returns table(response_id integer)
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_survey public.surveys;
  v_auth_uid uuid := auth.uid();
  v_is_youth boolean := false;
  v_is_admin boolean := false;
  v_response_id integer;
  v_question public.survey_questions;
  v_matching_answer jsonb;
  v_answer jsonb;
  v_answer_id integer;
  v_option_count integer;
  v_scored_option_count integer;
begin
  select * into v_survey from public.surveys where survey_id = p_survey_id;
  if not found then raise exception 'Survey not found'; end if;
  if v_survey.status <> 'published'::public.survey_status_type
     or (v_survey.start_date is not null and v_survey.start_date > now())
     or (v_survey.end_date is not null and v_survey.end_date <= now()) then
    raise exception 'Survey is not accepting responses';
  end if;
  if jsonb_typeof(coalesce(p_answers, '[]'::jsonb)) <> 'array' then raise exception 'Answers must be an array'; end if;

  if v_auth_uid is not null then
    select exists(select 1 from public.kabataan_profiles where profile_id = v_auth_uid and status = 'active') into v_is_youth;
    select public.is_active_admin() into v_is_admin;
    if not v_is_youth or v_is_admin then raise exception 'Only active Youth users or guests can submit this survey'; end if;
    if exists(select 1 from public.survey_responses where survey_id = p_survey_id and user_id = v_auth_uid and respondent_type = 'registered_user') then
      raise exception 'You have already submitted this survey';
    end if;
  else
    if not v_survey.allow_guest_responses then raise exception 'Guest responses are not allowed for this survey'; end if;
    if p_guest_session_id is null then raise exception 'Guest session is required'; end if;
    if exists(select 1 from public.survey_responses where survey_id = p_survey_id and guest_session_id = p_guest_session_id and respondent_type = 'guest') then
      raise exception 'This guest session already submitted this survey';
    end if;
  end if;

  if exists(select 1 from jsonb_array_elements(coalesce(p_answers, '[]'::jsonb)) a group by (a->>'question_id')::integer having count(*) > 1) then
    raise exception 'Duplicate question answers are not allowed';
  end if;

  if exists(
    select 1
    from jsonb_array_elements(coalesce(p_answers, '[]'::jsonb)) a
    left join public.survey_questions q on q.question_id = (a->>'question_id')::integer and q.survey_id = p_survey_id
    where q.question_id is null
       or q.question_type <> 'event_interest_likert'::public.survey_question_type
       or q.reporting_key <> 'suggested_event_rating'
  ) then
    raise exception 'Submitted question does not belong to this supported survey';
  end if;

  for v_question in
    select * from public.survey_questions
    where survey_id = p_survey_id
      and question_type = 'event_interest_likert'::public.survey_question_type
      and reporting_key = 'suggested_event_rating'
  loop
    select value into v_matching_answer
    from jsonb_array_elements(coalesce(p_answers, '[]'::jsonb)) value
    where (value->>'question_id')::integer = v_question.question_id
    limit 1;

    if v_question.is_required and v_matching_answer is null then raise exception 'Required question is missing'; end if;
    if v_matching_answer is not null then
      select count(*) into v_option_count from jsonb_array_elements_text(coalesce(v_matching_answer->'option_ids', '[]'::jsonb));
      if v_option_count <> 1 then raise exception 'Event-interest questions require exactly one option'; end if;
      select count(*) into v_scored_option_count
      from jsonb_array_elements_text(coalesce(v_matching_answer->'option_ids', '[]'::jsonb)) option_item(option_id)
      join public.survey_options o on o.option_id = option_item.option_id::integer
      where o.question_id = v_question.question_id and o.score_value between 1 and 5;
      if v_scored_option_count <> 1 then raise exception 'Submitted option is invalid'; end if;
    end if;
  end loop;

  insert into public.survey_responses(survey_id, user_id, respondent_type, guest_session_id)
  values (p_survey_id, case when v_auth_uid is null then null else v_auth_uid end, case when v_auth_uid is null then 'guest' else 'registered_user' end, case when v_auth_uid is null then p_guest_session_id else null end)
  returning survey_responses.response_id into v_response_id;

  for v_answer in select * from jsonb_array_elements(coalesce(p_answers, '[]'::jsonb)) loop
    insert into public.survey_answers(response_id, question_id, answer_text)
    values(v_response_id, (v_answer->>'question_id')::integer, null)
    returning answer_id into v_answer_id;
    insert into public.survey_answer_options(answer_id, option_id)
    select v_answer_id, option_item.option_id::integer
    from jsonb_array_elements_text(coalesce(v_answer->'option_ids', '[]'::jsonb)) option_item(option_id);
  end loop;

  return query select v_response_id;
exception when unique_violation then
  raise exception 'This survey has already been submitted';
end;
$function$;

create or replace function public.get_admin_dashboard_summary()
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_result jsonb;
begin
  if not public.is_active_admin() then raise exception 'Only active admins can view dashboard data'; end if;
  select jsonb_build_object(
    'totalYouth', (select count(*) from public.kabataan_profiles),
    'activeYouth', (select count(*) from public.kabataan_profiles where status = 'active'),
    'totalBudget', coalesce((select sum(total_allocation) from public.annual_budgets), 0),
    'allocatedBudget', coalesce((select sum(allocated_budget) from public.events), 0),
    'completedSpending', coalesce((select sum(amount) from public.financial_transactions where status = 'completed'), 0),
    'upcomingEventsCount', (select count(*) from public.events where status = 'scheduled' and event_date is not null and event_date >= current_date),
    'ongoingEventsCount', (select count(*) from public.events where status = 'ongoing'),
    'completedEventsCount', (select count(*) from public.events where status = 'completed'),
    'publishedSurveysCount', (select count(*) from public.surveys where status = 'published'),
    'surveyResponsesCount', (select count(*) from public.survey_responses),
    'publishedAnnouncementsCount', (select count(*) from public.announcements where is_published = true),
    'recentEvents', coalesce((
      select jsonb_agg(jsonb_build_object(
        'event_id', e.event_id,
        'event_name', e.event_name,
        'category', e.category,
        'event_date', e.event_date,
        'event_time', e.event_time,
        'location', e.location,
        'expected_attendees', e.expected_attendees,
        'registered_count', coalesce(r.registered_count, 0)
      ) order by e.event_date asc nulls last, e.created_at desc)
      from public.events e
      left join (
        select event_id, count(*)::int as registered_count
        from public.event_registrations
        where attendance_status in ('registered', 'attended')
        group by event_id
      ) r on r.event_id = e.event_id
      where e.status in ('scheduled', 'ongoing')
    ), '[]'::jsonb)
  ) into v_result;
  return v_result;
end;
$function$;

drop function if exists public.get_admin_preferred_activity_types();
drop function if exists public.get_admin_top_suggested_events();
drop function if exists public.get_admin_event_preference_recommendations();
drop view if exists public.survey_preferred_activity_types;
drop view if exists public.survey_top_suggested_events;
drop view if exists public.survey_top_event_preferences;

create view public.survey_preferred_activity_types
with (security_invoker = true)
as
with raw_scores as (
  select r.response_id, r.user_id, r.guest_session_id, r.respondent_type,
    case
      when r.respondent_type = 'registered_user' and r.user_id is not null then 'user:' || r.user_id::text
      when r.respondent_type = 'guest' and r.guest_session_id is not null then 'guest:' || r.guest_session_id::text
      else null
    end as respondent_key,
    lower(trim(q.event_name)) as normalized_event_name,
    lower(trim(q.event_category)) as normalized_category,
    q.event_category,
    s.title as source_survey,
    o.score_value
  from public.survey_responses r
  join public.surveys s on s.survey_id = r.survey_id
  join public.survey_answers a on a.response_id = r.response_id
  join public.survey_questions q on q.question_id = a.question_id
  join public.survey_answer_options ao on ao.answer_id = a.answer_id
  join public.survey_options o on o.option_id = ao.option_id
  where q.question_type = 'event_interest_likert'::public.survey_question_type
    and q.reporting_key = 'suggested_event_rating'
    and nullif(trim(q.event_name), '') is not null
    and nullif(trim(q.event_category), '') is not null
    and o.score_value between 1 and 5
), respondent_event_scores as (
  select respondent_key, respondent_type, normalized_event_name, normalized_category,
    max(event_category) as activity_type,
    avg(score_value)::numeric as event_average_score,
    array_agg(distinct source_survey order by source_survey) as source_surveys
  from raw_scores
  where respondent_key is not null
  group by respondent_key, respondent_type, normalized_event_name, normalized_category
), respondent_category_scores as (
  select respondent_key, respondent_type, normalized_category,
    max(activity_type) as activity_type,
    avg(event_average_score)::numeric as category_average_score,
    array_agg(distinct source_survey order by source_survey) as source_surveys
  from respondent_event_scores
  cross join lateral unnest(source_surveys) as source_survey
  group by respondent_key, respondent_type, normalized_category
), aggregated as (
  select normalized_category, max(activity_type) as activity_type,
    count(*) filter (where respondent_type = 'registered_user')::integer as authenticated_respondent_count,
    count(*) filter (where respondent_type = 'guest')::integer as guest_respondent_count,
    count(*)::integer as total_respondent_count,
    round(avg(category_average_score), 2) as average_rating,
    round(sum(category_average_score), 2) as total_score,
    count(*) filter (where category_average_score >= 4)::integer as positive_count,
    round(count(*) filter (where category_average_score >= 4)::numeric / nullif(count(*), 0)::numeric * 100, 2) as positive_interest_percentage,
    array_agg(distinct source_survey order by source_survey) as source_surveys
  from respondent_category_scores
  cross join lateral unnest(source_surveys) as source_survey
  group by normalized_category
)
select row_number() over (order by average_rating desc, positive_interest_percentage desc, total_respondent_count desc, activity_type asc)::integer as rank,
  activity_type, authenticated_respondent_count, guest_respondent_count, total_respondent_count,
  average_rating, positive_count, positive_interest_percentage, total_score, source_surveys
from aggregated;

create view public.survey_top_event_preferences
with (security_invoker = true)
as
with raw_scores as (
  select r.response_id, r.user_id, r.guest_session_id, r.respondent_type,
    case
      when r.respondent_type = 'registered_user' and r.user_id is not null then 'user:' || r.user_id::text
      when r.respondent_type = 'guest' and r.guest_session_id is not null then 'guest:' || r.guest_session_id::text
      else null
    end as respondent_key,
    lower(trim(q.event_name)) as normalized_event_name,
    q.event_name, q.event_category, s.title as source_survey, o.score_value
  from public.survey_responses r
  join public.survey_answers a on a.response_id = r.response_id
  join public.survey_questions q on q.question_id = a.question_id
  join public.surveys s on s.survey_id = q.survey_id
  join public.survey_answer_options ao on ao.answer_id = a.answer_id
  join public.survey_options o on o.option_id = ao.option_id
  where q.question_type = 'event_interest_likert'::public.survey_question_type
    and q.reporting_key = 'suggested_event_rating'
    and nullif(trim(q.event_name), '') is not null
    and nullif(trim(q.event_category), '') is not null
    and o.score_value between 1 and 5
), respondent_scores as (
  select normalized_event_name, max(event_name) as event_name, max(event_category) as event_category,
    respondent_type, respondent_key,
    avg(score_value)::numeric as respondent_average_score,
    array_agg(distinct source_survey order by source_survey) as source_surveys
  from raw_scores
  where respondent_key is not null
  group by normalized_event_name, respondent_type, respondent_key
), aggregated as (
  select normalized_event_name, max(event_name) as event_name, max(event_category) as event_category,
    count(*) filter (where respondent_type = 'registered_user')::integer as authenticated_respondent_count,
    count(*) filter (where respondent_type = 'guest')::integer as guest_respondent_count,
    count(*)::integer as total_respondent_count,
    round(avg(respondent_average_score), 2) as average_rating,
    round(sum(respondent_average_score), 2) as total_score,
    count(*) filter (where respondent_average_score >= 4)::integer as positive_count,
    round(count(*) filter (where respondent_average_score >= 4)::numeric / nullif(count(*), 0)::numeric * 100, 2) as positive_interest_percentage,
    array_agg(distinct source_survey order by source_survey) as source_surveys
  from respondent_scores
  cross join lateral unnest(source_surveys) as source_survey
  group by normalized_event_name
), planned as (
  select lower(trim(event_name)) as normalized_event_name, min(event_id) as matching_event_id
  from public.events
  where status in ('scheduled'::public.event_status_type, 'ongoing'::public.event_status_type)
  group by lower(trim(event_name))
)
select row_number() over (order by a.average_rating desc, a.positive_interest_percentage desc, a.total_respondent_count desc, a.event_name asc)::integer as rank,
  a.event_name, a.event_category, a.total_respondent_count as response_count,
  a.authenticated_respondent_count, a.guest_respondent_count, a.total_respondent_count,
  a.average_rating, a.total_score, a.positive_count, a.positive_interest_percentage,
  a.source_surveys, p.matching_event_id is not null as is_already_planned, p.matching_event_id
from aggregated a
left join planned p on p.normalized_event_name = a.normalized_event_name;

create view public.survey_top_suggested_events
with (security_invoker = true)
as
select rank, event_name as suggested_event_name, event_category as category,
  total_respondent_count as respondent_count, total_respondent_count,
  authenticated_respondent_count, guest_respondent_count, average_rating, total_score,
  positive_count, positive_interest_percentage,
  positive_interest_percentage as respondent_support_percentage,
  response_count as submission_count, source_surveys, is_already_planned, matching_event_id
from public.survey_top_event_preferences;

revoke all on public.survey_preferred_activity_types from public, anon, authenticated;
revoke all on public.survey_top_event_preferences from public, anon, authenticated;
revoke all on public.survey_top_suggested_events from public, anon, authenticated;

create or replace function public.get_admin_preferred_activity_types()
returns setof public.survey_preferred_activity_types
language plpgsql security definer set search_path to 'public'
as $function$
begin
  if not public.is_active_admin() then raise exception 'Only active admins can view survey analytics'; end if;
  return query select * from public.survey_preferred_activity_types order by rank;
end;
$function$;

create or replace function public.get_admin_top_suggested_events()
returns setof public.survey_top_suggested_events
language plpgsql security definer set search_path to 'public'
as $function$
begin
  if not public.is_active_admin() then raise exception 'Only active admins can view survey analytics'; end if;
  return query select * from public.survey_top_suggested_events order by rank;
end;
$function$;

create or replace function public.get_admin_event_preference_recommendations()
returns setof public.survey_top_event_preferences
language plpgsql security definer set search_path to 'public'
as $function$
begin
  if not public.is_active_admin() then raise exception 'Only active admins can view event preference recommendations'; end if;
  return query select * from public.survey_top_event_preferences order by rank;
end;
$function$;

revoke all on function public.get_admin_preferred_activity_types() from public, anon;
revoke all on function public.get_admin_top_suggested_events() from public, anon;
revoke all on function public.get_admin_event_preference_recommendations() from public, anon;
grant execute on function public.get_admin_preferred_activity_types() to authenticated;
grant execute on function public.get_admin_top_suggested_events() to authenticated;
grant execute on function public.get_admin_event_preference_recommendations() to authenticated;

create or replace function public.get_all_public_scheduled_events()
returns table(event_id integer, event_name text, category text, event_date date, event_time text, location text, description text, expected_attendees integer, cover_image text)
language sql security definer set search_path to 'public'
as $function$
  select event_id, event_name::text, category::text, event_date, event_time::text,
         location::text, description, expected_attendees, cover_image
  from public.events
  where status = 'scheduled'::public.event_status_type
    and event_date is not null
    and event_date >= current_date
  order by event_date asc, event_time asc nulls last, event_id asc;
$function$;

revoke all on function public.get_all_public_scheduled_events() from public;
grant execute on function public.get_all_public_scheduled_events() to anon, authenticated;
