alter table public.kabataan_profiles
add column if not exists must_change_password boolean;

alter table public.kabataan_profiles
add column if not exists onboarding_status text;

alter table public.kabataan_profiles
add column if not exists welcome_email_sent_at timestamptz;

alter table public.kabataan_profiles
add column if not exists welcome_email_last_error text;

alter table public.kabataan_profiles
add column if not exists welcome_email_attempt_count integer;

alter table public.kabataan_profiles
add column if not exists welcome_email_last_attempt_at timestamptz;

update public.kabataan_profiles
set must_change_password = false
where must_change_password is null;

update public.kabataan_profiles
set welcome_email_attempt_count = 0
where welcome_email_attempt_count is null;

update public.kabataan_profiles
set onboarding_status = 'completed'
where onboarding_status is null
  and must_change_password = false;

alter table public.kabataan_profiles
alter column must_change_password set default false;

alter table public.kabataan_profiles
alter column must_change_password set not null;

alter table public.kabataan_profiles
alter column welcome_email_attempt_count set default 0;

alter table public.kabataan_profiles
alter column welcome_email_attempt_count set not null;

alter table public.kabataan_profiles
drop constraint if exists kabataan_profiles_onboarding_status_check;

alter table public.kabataan_profiles
add constraint kabataan_profiles_onboarding_status_check
check (onboarding_status is null or onboarding_status in ('temporary_password_active', 'completed'));

alter table public.kabataan_profiles
drop constraint if exists kabataan_profiles_welcome_email_attempt_count_check;

alter table public.kabataan_profiles
add constraint kabataan_profiles_welcome_email_attempt_count_check
check (welcome_email_attempt_count >= 0);

create or replace function public.assert_youth_password_ready()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if not exists (
    select 1
    from public.kabataan_profiles kp
    where kp.profile_id = auth.uid()
      and kp.status = 'active'
      and coalesce(kp.must_change_password, false) = false
      and coalesce(kp.onboarding_status, 'completed') <> 'temporary_password_active'
  ) then
    raise exception 'Please change your temporary password before continuing';
  end if;
end;
$$;

revoke all on function public.assert_youth_password_ready() from public;
revoke all on function public.assert_youth_password_ready() from anon;
revoke all on function public.assert_youth_password_ready() from authenticated;
grant execute on function public.assert_youth_password_ready() to authenticated;

create or replace function public.register_youth_for_event(p_event_id integer)
returns table(registration_id integer, event_id integer, user_id uuid, registration_date timestamptz, attendance_status public.attendance_status_type)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event public.events;
  v_slot_count int;
begin
  perform public.assert_youth_password_ready();

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
exception
  when unique_violation then
    raise exception 'Already registered for this event';
end;
$$;

create or replace function public.cancel_youth_event_registration(p_event_id integer)
returns table(cancelled boolean, registration_id integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event public.events;
  v_registration_id integer;
begin
  perform public.assert_youth_password_ready();

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
$$;

create or replace function public.submit_event_feedback(p_event_id integer, p_rating integer, p_comments text, p_guest_name text default null)
returns public.post_event_feedback
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event public.events;
  v_user uuid := auth.uid();
  v_feedback public.post_event_feedback;
  v_was_registered boolean := false;
begin
  select * into v_event
  from public.events
  where event_id = p_event_id;

  if not found or v_event.status <> 'completed'::public.event_status_type then
    raise exception 'Event is not available for feedback';
  end if;

  if p_rating < 1 or p_rating > 5 then
    raise exception 'Rating must be from 1 to 5';
  end if;

  if length(coalesce(p_comments, '')) > 2000 then
    raise exception 'Comments are too long';
  end if;

  if length(coalesce(p_guest_name, '')) > 120 then
    raise exception 'Guest name is too long';
  end if;

  if v_user is not null then
    perform public.assert_youth_password_ready();

    select exists (
      select 1
      from public.event_registrations
      where event_id = p_event_id
        and user_id = v_user
    ) into v_was_registered;

    if exists (
      select 1
      from public.post_event_feedback
      where event_id = p_event_id
        and user_id = v_user
    ) then
      raise exception 'You already submitted feedback for this event';
    end if;

    insert into public.post_event_feedback (
      event_id, user_id, respondent_type, guest_name, was_registered, rating, comments
    ) values (
      p_event_id, v_user, 'registered_user', null, v_was_registered, p_rating,
      nullif(trim(coalesce(p_comments, '')), '')
    ) returning * into v_feedback;
  else
    insert into public.post_event_feedback (
      event_id, user_id, respondent_type, guest_name, was_registered, rating, comments
    ) values (
      p_event_id, null, 'guest', nullif(trim(coalesce(p_guest_name, '')), ''), false, p_rating,
      nullif(trim(coalesce(p_comments, '')), '')
    ) returning * into v_feedback;
  end if;

  return v_feedback;
end;
$$;

create or replace function public.submit_youth_survey_response(p_survey_id integer, p_answers jsonb)
returns public.survey_responses
language plpgsql
security definer
set search_path = public
as $$
declare
  v_survey public.surveys;
  v_response public.survey_responses;
  v_question public.survey_questions;
  v_answer jsonb;
  v_matching_answer jsonb;
  v_answer_id int;
  v_option_count int;
  v_answer_text text;
  v_scored_option_count int;
begin
  perform public.assert_youth_password_ready();

  select * into v_survey from public.surveys where survey_id = p_survey_id;
  if not found then raise exception 'Survey not found'; end if;

  if v_survey.status <> 'published'::public.survey_status_type
     or (v_survey.start_date is not null and v_survey.start_date > now())
     or (v_survey.end_date is not null and v_survey.end_date <= now()) then
    raise exception 'Survey is not accepting responses';
  end if;

  if exists (select 1 from public.survey_responses where survey_id = p_survey_id and user_id = auth.uid()) then
    raise exception 'You have already submitted this survey';
  end if;

  if jsonb_typeof(coalesce(p_answers, '[]'::jsonb)) <> 'array' then
    raise exception 'Answers must be an array';
  end if;

  for v_question in select * from public.survey_questions where survey_id = p_survey_id order by sort_order, question_id
  loop
    select value into v_matching_answer
    from jsonb_array_elements(coalesce(p_answers, '[]'::jsonb)) value
    where (value->>'question_id')::int = v_question.question_id
    limit 1;

    v_answer_text := nullif(trim(coalesce(v_matching_answer->>'answer_text', '')), '');
    select count(*) into v_option_count
    from jsonb_array_elements_text(coalesce(v_matching_answer->'option_ids', '[]'::jsonb));

    if v_question.is_required and v_matching_answer is null then
      raise exception 'Required question is missing';
    end if;

    if v_matching_answer is not null then
      if v_question.question_type in ('short_text', 'long_text') then
        if v_question.is_required and v_answer_text is null then raise exception 'Required text answer is missing'; end if;
        if v_option_count > 0 then raise exception 'Text questions cannot include options'; end if;
      elsif v_question.question_type = 'single_choice' then
        if v_option_count <> 1 then raise exception 'Single-choice questions require exactly one option'; end if;
      elsif v_question.question_type = 'event_interest_likert' then
        if v_option_count <> 1 then raise exception 'Event-interest questions require exactly one option'; end if;
        select count(*) into v_scored_option_count
        from jsonb_array_elements_text(coalesce(v_matching_answer->'option_ids', '[]'::jsonb)) option_item(option_id)
        join public.survey_options o on o.option_id = option_item.option_id::int
        where o.question_id = v_question.question_id
          and o.score_value between 1 and 5;
        if v_scored_option_count <> 1 then raise exception 'Event-interest option is invalid'; end if;
      elsif v_question.question_type = 'multiple_choice' then
        if v_question.is_required and v_option_count < 1 then raise exception 'Multiple-choice question requires at least one option'; end if;
      end if;

      if v_option_count > 0 and exists (
        select 1
        from jsonb_array_elements_text(coalesce(v_matching_answer->'option_ids', '[]'::jsonb)) option_item(option_id)
        left join public.survey_options o on o.option_id = option_item.option_id::int and o.question_id = v_question.question_id
        where o.option_id is null
      ) then
        raise exception 'Submitted option does not belong to the question';
      end if;
    end if;
  end loop;

  if exists (
    select 1
    from jsonb_array_elements(coalesce(p_answers, '[]'::jsonb)) answer_item
    left join public.survey_questions q on q.question_id = (answer_item->>'question_id')::int and q.survey_id = p_survey_id
    where q.question_id is null
  ) then
    raise exception 'Submitted question does not belong to the survey';
  end if;

  insert into public.survey_responses (survey_id, user_id)
  values (p_survey_id, auth.uid())
  returning * into v_response;

  for v_answer in select * from jsonb_array_elements(coalesce(p_answers, '[]'::jsonb))
  loop
    select * into v_question from public.survey_questions
    where question_id = (v_answer->>'question_id')::int and survey_id = p_survey_id;
    v_answer_text := nullif(trim(coalesce(v_answer->>'answer_text', '')), '');

    insert into public.survey_answers (response_id, question_id, answer_text)
    values (
      v_response.response_id,
      v_question.question_id,
      case when v_question.question_type in ('short_text', 'long_text') then v_answer_text else null end
    ) returning answer_id into v_answer_id;

    if v_question.question_type in ('single_choice', 'multiple_choice', 'event_interest_likert') then
      insert into public.survey_answer_options (answer_id, option_id)
      select v_answer_id, option_item.option_id::int
      from jsonb_array_elements_text(coalesce(v_answer->'option_ids', '[]'::jsonb)) option_item(option_id);
    end if;
  end loop;

  return v_response;
end;
$$;

revoke all on function public.register_youth_for_event(integer) from public, anon;
revoke all on function public.cancel_youth_event_registration(integer) from public, anon;
revoke all on function public.submit_youth_survey_response(integer, jsonb) from public, anon;
revoke all on function public.submit_event_feedback(integer, integer, text, text) from public;
grant execute on function public.register_youth_for_event(integer) to authenticated;
grant execute on function public.cancel_youth_event_registration(integer) to authenticated;
grant execute on function public.submit_youth_survey_response(integer, jsonb) to authenticated;
grant execute on function public.submit_event_feedback(integer, integer, text, text) to anon, authenticated;
