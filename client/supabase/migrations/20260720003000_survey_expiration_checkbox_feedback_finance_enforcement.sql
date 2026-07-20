alter table public.surveys
  add column if not exists expires_at timestamptz;

alter table public.surveys
  drop constraint if exists surveys_expiration_after_start_check;

alter table public.surveys
  add constraint surveys_expiration_after_start_check
  check (expires_at is null or start_date is null or expires_at > start_date);

alter table public.survey_answers
  drop constraint if exists survey_answers_answer_text_length_check;

alter table public.survey_answers
  add constraint survey_answers_answer_text_length_check
  check (answer_text is null or length(answer_text) <= 2000);

alter table public.survey_options
  add column if not exists is_other boolean not null default false,
  add column if not exists event_name text,
  add column if not exists event_category text,
  add column if not exists event_description text;

drop policy if exists "Authenticated can view eligible surveys" on public.surveys;
create policy "Authenticated can view eligible surveys"
on public.surveys
for select
to authenticated
using (
  public.is_active_admin()
  or (
    status = 'published'::public.survey_status_type
    and target_audience = 'kabataan'::public.survey_target_audience_type
    and (start_date is null or start_date <= now())
    and (coalesce(expires_at, end_date) is null or coalesce(expires_at, end_date) > now())
  )
);

drop policy if exists "Authenticated can view eligible survey questions" on public.survey_questions;
create policy "Authenticated can view eligible survey questions"
on public.survey_questions
for select
to authenticated
using (
  public.is_active_admin()
  or exists (
    select 1
    from public.surveys s
    where s.survey_id = survey_questions.survey_id
      and s.status = 'published'::public.survey_status_type
      and s.target_audience = 'kabataan'::public.survey_target_audience_type
      and (s.start_date is null or s.start_date <= now())
      and (coalesce(s.expires_at, s.end_date) is null or coalesce(s.expires_at, s.end_date) > now())
  )
);

drop policy if exists "Authenticated can view eligible survey options" on public.survey_options;
create policy "Authenticated can view eligible survey options"
on public.survey_options
for select
to authenticated
using (
  public.is_active_admin()
  or exists (
    select 1
    from public.survey_questions q
    join public.surveys s on s.survey_id = q.survey_id
    where q.question_id = survey_options.question_id
      and s.status = 'published'::public.survey_status_type
      and s.target_audience = 'kabataan'::public.survey_target_audience_type
      and (s.start_date is null or s.start_date <= now())
      and (coalesce(s.expires_at, s.end_date) is null or coalesce(s.expires_at, s.end_date) > now())
  )
);

create or replace function public.delete_survey_responses_for_unpublish(p_survey_id integer)
returns integer
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_deleted_count integer := 0;
begin
  if not public.is_active_admin() then
    raise exception 'Only active admins can unpublish surveys';
  end if;

  select count(*)::integer
  into v_deleted_count
  from public.survey_responses
  where survey_id = p_survey_id;

  delete from public.survey_answer_options ao
  using public.survey_answers a, public.survey_responses r
  where ao.answer_id = a.answer_id
    and a.response_id = r.response_id
    and r.survey_id = p_survey_id;

  delete from public.survey_answers a
  using public.survey_responses r
  where a.response_id = r.response_id
    and r.survey_id = p_survey_id;

  delete from public.survey_responses
  where survey_id = p_survey_id;

  return v_deleted_count;
end;
$function$;

revoke all on function public.delete_survey_responses_for_unpublish(integer) from public, anon;
grant execute on function public.delete_survey_responses_for_unpublish(integer) to authenticated;

create or replace function public.save_admin_survey(
  p_survey_id integer,
  p_title text,
  p_description text,
  p_status public.survey_status_type,
  p_start_date timestamptz,
  p_end_date timestamptz,
  p_expires_at timestamptz,
  p_target_audience public.survey_target_audience_type,
  p_allow_guest_responses boolean,
  p_questions jsonb
)
returns public.surveys
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_survey public.surveys;
  v_old_status public.survey_status_type;
  v_had_responses boolean := false;
  v_question jsonb;
  v_option jsonb;
  v_question_id integer;
begin
  if not public.is_active_admin() then
    raise exception 'Only active admins can save surveys';
  end if;

  if nullif(trim(coalesce(p_title, '')), '') is null then
    raise exception 'Survey title is required';
  end if;

  if p_expires_at is not null and p_start_date is not null and p_expires_at <= p_start_date then
    raise exception 'Expiration must be later than start date';
  end if;

  if p_survey_id is not null then
    select status into v_old_status
    from public.surveys
    where survey_id = p_survey_id
    for update;

    if not found then
      raise exception 'Survey not found';
    end if;

    select exists (
      select 1
      from public.survey_responses
      where survey_id = p_survey_id
    ) into v_had_responses;

    update public.surveys
    set title = trim(p_title),
        question_text = trim(p_title),
        description = nullif(trim(coalesce(p_description, '')), ''),
        status = p_status,
        is_active = (p_status = 'published'::public.survey_status_type),
        start_date = p_start_date,
        end_date = p_end_date,
        expires_at = p_expires_at,
        target_audience = p_target_audience,
        allow_guest_responses = coalesce(p_allow_guest_responses, false)
    where survey_id = p_survey_id
    returning * into v_survey;

    if v_old_status = 'published'::public.survey_status_type
       and p_status <> 'published'::public.survey_status_type then
      perform public.delete_survey_responses_for_unpublish(p_survey_id);
    end if;
  else
    insert into public.surveys (
      title,
      question_text,
      description,
      status,
      is_active,
      start_date,
      end_date,
      expires_at,
      target_audience,
      allow_guest_responses
    )
    values (
      trim(p_title),
      trim(p_title),
      nullif(trim(coalesce(p_description, '')), ''),
      p_status,
      (p_status = 'published'::public.survey_status_type),
      p_start_date,
      p_end_date,
      p_expires_at,
      p_target_audience,
      coalesce(p_allow_guest_responses, false)
    )
    returning * into v_survey;
  end if;

  if p_survey_id is null or not v_had_responses then
    delete from public.survey_questions where survey_id = v_survey.survey_id;

    for v_question in select * from jsonb_array_elements(coalesce(p_questions, '[]'::jsonb))
    loop
      insert into public.survey_questions (
        survey_id,
        question_text,
        question_type,
        is_required,
        sort_order,
        reporting_key,
        event_name,
        event_category,
        event_description
      )
      values (
        v_survey.survey_id,
        nullif(trim(coalesce(v_question->>'question_text', '')), ''),
        (v_question->>'question_type')::public.survey_question_type,
        coalesce((v_question->>'is_required')::boolean, true),
        coalesce((v_question->>'sort_order')::integer, 0),
        nullif(trim(coalesce(v_question->>'reporting_key', '')), ''),
        nullif(trim(coalesce(v_question->>'event_name', '')), ''),
        nullif(trim(coalesce(v_question->>'event_category', '')), ''),
        nullif(trim(coalesce(v_question->>'event_description', '')), '')
      )
      returning question_id into v_question_id;

      for v_option in select * from jsonb_array_elements(coalesce(v_question->'options', '[]'::jsonb))
      loop
        insert into public.survey_options (
          question_id,
          option_text,
          sort_order,
          score_value
        )
        values (
          v_question_id,
          nullif(trim(coalesce(v_option->>'option_text', '')), ''),
          coalesce((v_option->>'sort_order')::integer, 0),
          nullif(v_option->>'score_value', '')::integer
        );
      end loop;
    end loop;
  end if;

  return v_survey;
end;
$function$;

revoke all on function public.save_admin_survey(integer, text, text, public.survey_status_type, timestamptz, timestamptz, timestamptz, public.survey_target_audience_type, boolean, jsonb) from public, anon;
grant execute on function public.save_admin_survey(integer, text, text, public.survey_status_type, timestamptz, timestamptz, timestamptz, public.survey_target_audience_type, boolean, jsonb) to authenticated;

create or replace function public.submit_youth_survey_response(p_survey_id integer, p_answers jsonb)
returns public.survey_responses
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_survey public.surveys;
  v_response public.survey_responses;
  v_question public.survey_questions;
  v_answer jsonb;
  v_matching_answer jsonb;
  v_answer_id integer;
  v_option_count integer;
  v_answer_text text;
  v_has_other boolean;
begin
  perform public.assert_youth_password_ready();

  select * into v_survey from public.surveys where survey_id = p_survey_id;
  if not found then raise exception 'Survey not found'; end if;

  if v_survey.status <> 'published'::public.survey_status_type
     or (v_survey.start_date is not null and v_survey.start_date > now())
     or (coalesce(v_survey.expires_at, v_survey.end_date) is not null and coalesce(v_survey.expires_at, v_survey.end_date) <= now()) then
    raise exception 'Survey is not accepting responses';
  end if;

  if exists (select 1 from public.survey_responses where survey_id = p_survey_id and user_id = auth.uid()) then
    raise exception 'You have already submitted this survey';
  end if;

  if jsonb_typeof(coalesce(p_answers, '[]'::jsonb)) <> 'array' then
    raise exception 'Answers must be an array';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(coalesce(p_answers, '[]'::jsonb)) answer_item
    left join public.survey_questions q on q.question_id = (answer_item->>'question_id')::integer and q.survey_id = p_survey_id
    where q.question_id is null
  ) then
    raise exception 'Submitted question does not belong to the survey';
  end if;

  for v_question in select * from public.survey_questions where survey_id = p_survey_id order by sort_order, question_id
  loop
    select value into v_matching_answer
    from jsonb_array_elements(coalesce(p_answers, '[]'::jsonb)) value
    where (value->>'question_id')::integer = v_question.question_id
    limit 1;

    v_answer_text := nullif(trim(coalesce(v_matching_answer->>'answer_text', '')), '');
    select count(*) into v_option_count
    from jsonb_array_elements_text(coalesce(v_matching_answer->'option_ids', '[]'::jsonb));

    if v_question.is_required and v_matching_answer is null then
      raise exception 'Required question is missing';
    end if;

    if v_matching_answer is not null then
      if v_option_count > 0 and exists (
        select 1
        from jsonb_array_elements_text(coalesce(v_matching_answer->'option_ids', '[]'::jsonb)) option_item(option_id)
        left join public.survey_options o on o.option_id = option_item.option_id::integer and o.question_id = v_question.question_id
        where o.option_id is null
      ) then
        raise exception 'Submitted option does not belong to the question';
      end if;

      select exists (
        select 1
        from jsonb_array_elements_text(coalesce(v_matching_answer->'option_ids', '[]'::jsonb)) option_item(option_id)
        join public.survey_options o on o.option_id = option_item.option_id::integer
        where o.question_id = v_question.question_id
          and lower(trim(o.option_text)) = 'other'
      ) into v_has_other;

      if v_question.question_type in ('short_text', 'long_text') then
        if v_question.is_required and v_answer_text is null then raise exception 'Required text answer is missing'; end if;
        if v_option_count > 0 then raise exception 'Text questions cannot include options'; end if;
      elsif v_question.question_type = 'single_choice' then
        if v_option_count <> 1 then raise exception 'Single-choice questions require exactly one option'; end if;
      elsif v_question.question_type = 'multiple_choice' then
        if v_question.is_required and v_option_count < 1 then raise exception 'Multiple-choice question requires at least one option'; end if;
        if v_has_other and v_answer_text is null then raise exception 'Other event suggestion is required'; end if;
        if v_answer_text is not null and length(v_answer_text) > 120 then raise exception 'Other event suggestion is too long'; end if;
      elsif v_question.question_type = 'event_interest_likert' then
        if v_option_count <> 1 then raise exception 'Event-interest questions require exactly one option'; end if;
      end if;
    end if;
  end loop;

  insert into public.survey_responses (survey_id, user_id)
  values (p_survey_id, auth.uid())
  returning * into v_response;

  for v_answer in select * from jsonb_array_elements(coalesce(p_answers, '[]'::jsonb))
  loop
    select * into v_question
    from public.survey_questions
    where question_id = (v_answer->>'question_id')::integer and survey_id = p_survey_id;

    v_answer_text := nullif(trim(coalesce(v_answer->>'answer_text', '')), '');

    insert into public.survey_answers (response_id, question_id, answer_text)
    values (
      v_response.response_id,
      v_question.question_id,
      case
        when v_question.question_type in ('short_text', 'long_text', 'multiple_choice') then v_answer_text
        else null
      end
    )
    returning answer_id into v_answer_id;

    if v_question.question_type in ('single_choice', 'multiple_choice', 'event_interest_likert') then
      insert into public.survey_answer_options (answer_id, option_id)
      select v_answer_id, option_item.option_id::integer
      from jsonb_array_elements_text(coalesce(v_answer->'option_ids', '[]'::jsonb)) option_item(option_id);
    end if;
  end loop;

  return v_response;
exception when unique_violation then
  raise exception 'This survey has already been submitted';
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
  v_response public.survey_responses;
  v_question public.survey_questions;
  v_matching_answer jsonb;
  v_option_count integer;
  v_answer_text text;
  v_has_other boolean;
begin
  select * into v_survey from public.surveys where survey_id = p_survey_id;
  if not found then raise exception 'Survey not found'; end if;

  if v_auth_uid is not null then
    v_response := public.submit_youth_survey_response(p_survey_id, p_answers);
    return query select v_response.response_id;
    return;
  end if;

  if not coalesce(v_survey.allow_guest_responses, false) then
    raise exception 'Guest responses are not allowed for this survey';
  end if;

  if v_survey.status <> 'published'::public.survey_status_type
     or (v_survey.start_date is not null and v_survey.start_date > now())
     or (coalesce(v_survey.expires_at, v_survey.end_date) is not null and coalesce(v_survey.expires_at, v_survey.end_date) <= now()) then
    raise exception 'Survey is not accepting responses';
  end if;

  if p_guest_session_id is null then raise exception 'Guest session is required'; end if;
  if exists(select 1 from public.survey_responses where survey_id = p_survey_id and guest_session_id = p_guest_session_id and respondent_type = 'guest') then
    raise exception 'This guest session already submitted this survey';
  end if;

  if jsonb_typeof(coalesce(p_answers, '[]'::jsonb)) <> 'array' then
    raise exception 'Answers must be an array';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(coalesce(p_answers, '[]'::jsonb)) a
    group by (a->>'question_id')::integer
    having count(*) > 1
  ) then
    raise exception 'Duplicate question answers are not allowed';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(coalesce(p_answers, '[]'::jsonb)) answer_item
    left join public.survey_questions q
      on q.question_id = (answer_item->>'question_id')::integer
     and q.survey_id = p_survey_id
     and q.question_type = 'multiple_choice'::public.survey_question_type
     and q.reporting_key = 'suggested_event'
    where q.question_id is null
  ) then
    raise exception 'Submitted question does not belong to this supported survey';
  end if;

  for v_question in
    select *
    from public.survey_questions
    where survey_id = p_survey_id
      and question_type = 'multiple_choice'::public.survey_question_type
      and reporting_key = 'suggested_event'
    order by sort_order, question_id
  loop
    select value into v_matching_answer
    from jsonb_array_elements(coalesce(p_answers, '[]'::jsonb)) value
    where (value->>'question_id')::integer = v_question.question_id
    limit 1;

    v_answer_text := nullif(trim(coalesce(v_matching_answer->>'answer_text', '')), '');
    select count(*) into v_option_count
    from jsonb_array_elements_text(coalesce(v_matching_answer->'option_ids', '[]'::jsonb));

    if v_question.is_required and v_matching_answer is null then
      raise exception 'Required question is missing';
    end if;

    if v_matching_answer is not null then
      if v_question.is_required and v_option_count < 1 then
        raise exception 'Multiple-choice question requires at least one option';
      end if;

      if exists (
        select 1
        from jsonb_array_elements_text(coalesce(v_matching_answer->'option_ids', '[]'::jsonb)) option_item(option_id)
        left join public.survey_options o
          on o.option_id = option_item.option_id::integer
         and o.question_id = v_question.question_id
        where o.option_id is null
      ) then
        raise exception 'Submitted option does not belong to the question';
      end if;

      select exists (
        select 1
        from jsonb_array_elements_text(coalesce(v_matching_answer->'option_ids', '[]'::jsonb)) option_item(option_id)
        join public.survey_options o on o.option_id = option_item.option_id::integer
        where o.question_id = v_question.question_id
          and lower(trim(o.option_text)) = 'other'
      ) into v_has_other;

      if v_has_other and v_answer_text is null then
        raise exception 'Other event suggestion is required';
      end if;

      if v_answer_text is not null and length(v_answer_text) > 120 then
        raise exception 'Other event suggestion is too long';
      end if;
    end if;
  end loop;

  insert into public.survey_responses(survey_id, user_id, respondent_type, guest_session_id)
  values (p_survey_id, null, 'guest', p_guest_session_id)
  returning * into v_response;

  -- Validate and store with the same option rules as Youth, without requiring auth.uid().
  perform 1
  from public.survey_questions
  where survey_id = p_survey_id
  having count(*) = count(*) filter (where question_type = 'multiple_choice'::public.survey_question_type);

  insert into public.survey_answers(response_id, question_id, answer_text)
  select v_response.response_id,
         (answer_item->>'question_id')::integer,
         nullif(trim(coalesce(answer_item->>'answer_text', '')), '')
  from jsonb_array_elements(coalesce(p_answers, '[]'::jsonb)) answer_item
  join public.survey_questions q on q.question_id = (answer_item->>'question_id')::integer and q.survey_id = p_survey_id
  where q.question_type = 'multiple_choice'::public.survey_question_type;

  insert into public.survey_answer_options(answer_id, option_id)
  select a.answer_id, option_item.option_id::integer
  from public.survey_answers a
  join jsonb_array_elements(coalesce(p_answers, '[]'::jsonb)) answer_item on (answer_item->>'question_id')::integer = a.question_id
  join jsonb_array_elements_text(coalesce(answer_item->'option_ids', '[]'::jsonb)) option_item(option_id) on true
  join public.survey_options o on o.option_id = option_item.option_id::integer and o.question_id = a.question_id
  where a.response_id = v_response.response_id;

  if exists (
    select 1
    from public.survey_questions q
    left join public.survey_answers a on a.question_id = q.question_id and a.response_id = v_response.response_id
    where q.survey_id = p_survey_id
      and q.is_required
      and not exists (select 1 from public.survey_answer_options ao where ao.answer_id = a.answer_id)
  ) then
    raise exception 'Multiple-choice question requires at least one option';
  end if;

  if exists (
    select 1
    from public.survey_answers a
    join public.survey_answer_options ao on ao.answer_id = a.answer_id
    join public.survey_options o on o.option_id = ao.option_id
    where a.response_id = v_response.response_id
      and lower(trim(o.option_text)) = 'other'
      and nullif(trim(coalesce(a.answer_text, '')), '') is null
  ) then
    raise exception 'Other event suggestion is required';
  end if;

  if exists (
    select 1
    from public.survey_answers a
    where a.response_id = v_response.response_id
      and length(coalesce(a.answer_text, '')) > 120
  ) then
    raise exception 'Other event suggestion is too long';
  end if;

  return query select v_response.response_id;
exception when unique_violation then
  raise exception 'This survey has already been submitted';
end;
$function$;

revoke all on function public.submit_youth_survey_response(integer, jsonb) from public, anon;
grant execute on function public.submit_youth_survey_response(integer, jsonb) to authenticated;
revoke all on function public.submit_public_event_interest_survey(integer, jsonb, uuid) from public;
grant execute on function public.submit_public_event_interest_survey(integer, jsonb, uuid) to anon, authenticated;

drop function if exists public.get_public_event_interest_surveys();

create or replace function public.get_public_event_interest_surveys()
returns table(
  survey_id integer,
  title text,
  description text,
  start_date timestamptz,
  end_date timestamptz,
  expires_at timestamptz,
  question_count integer,
  allow_guest_responses boolean
)
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  return query
  select
    s.survey_id,
    s.title::text,
    s.description::text,
    s.start_date,
    s.end_date,
    s.expires_at,
    count(q.question_id)::integer as question_count,
    s.allow_guest_responses
  from public.surveys s
  join public.survey_questions q on q.survey_id = s.survey_id
  where s.status = 'published'::public.survey_status_type
    and coalesce(s.allow_guest_responses, false) = true
    and (s.start_date is null or s.start_date <= now())
    and (coalesce(s.expires_at, s.end_date) is null or coalesce(s.expires_at, s.end_date) > now())
    and q.question_type = 'multiple_choice'::public.survey_question_type
    and q.reporting_key = 'suggested_event'
  group by s.survey_id, s.title, s.description, s.start_date, s.end_date, s.expires_at, s.allow_guest_responses
  order by s.created_at desc;
end;
$function$;

create or replace function public.get_public_event_interest_survey(p_survey_id integer)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_result jsonb;
begin
  select jsonb_build_object(
    'survey_id', s.survey_id,
    'title', s.title,
    'description', s.description,
    'status', s.status,
    'start_date', s.start_date,
    'end_date', s.end_date,
    'expires_at', s.expires_at,
    'allow_guest_responses', s.allow_guest_responses,
    'created_at', s.created_at,
    'survey_responses', '[]'::jsonb,
    'survey_questions', coalesce((
      select jsonb_agg(jsonb_build_object(
        'question_id', q.question_id,
        'question_text', q.question_text,
        'question_type', q.question_type,
        'is_required', q.is_required,
        'sort_order', q.sort_order,
        'reporting_key', q.reporting_key,
        'event_name', q.event_name,
        'event_category', q.event_category,
        'event_description', q.event_description,
        'survey_options', coalesce((
          select jsonb_agg(jsonb_build_object(
            'option_id', o.option_id,
            'option_text', o.option_text,
            'sort_order', o.sort_order,
            'score_value', o.score_value
          ) order by o.sort_order, o.option_id)
          from public.survey_options o
          where o.question_id = q.question_id
        ), '[]'::jsonb)
      ) order by q.sort_order, q.question_id)
      from public.survey_questions q
      where q.survey_id = s.survey_id
        and q.question_type = 'multiple_choice'::public.survey_question_type
        and q.reporting_key = 'suggested_event'
    ), '[]'::jsonb)
  )
  into v_result
  from public.surveys s
  where s.survey_id = p_survey_id
    and s.status = 'published'::public.survey_status_type
    and coalesce(s.allow_guest_responses, false) = true
    and (s.start_date is null or s.start_date <= now())
    and (coalesce(s.expires_at, s.end_date) is null or coalesce(s.expires_at, s.end_date) > now());

  return v_result;
end;
$function$;

revoke all on function public.get_public_event_interest_surveys() from public;
revoke all on function public.get_public_event_interest_survey(integer) from public;
grant execute on function public.get_public_event_interest_surveys() to anon, authenticated;
grant execute on function public.get_public_event_interest_survey(integer) to anon, authenticated;

drop function if exists public.get_admin_top_suggested_events();
drop function if exists public.get_admin_event_preference_recommendations();
drop view if exists public.survey_top_suggested_events;
drop view if exists public.survey_top_event_preferences;

create or replace view public.survey_top_suggested_events
with (security_invoker = true)
as
with selected_options as (
  select
    s.survey_id,
    s.title as source_survey,
    sr.response_id,
    q.question_id,
    o.option_id,
    o.option_text,
    o.sort_order
  from public.survey_responses sr
  join public.surveys s on s.survey_id = sr.survey_id
  join public.survey_answers a on a.response_id = sr.response_id
  join public.survey_questions q on q.question_id = a.question_id
  join public.survey_answer_options ao on ao.answer_id = a.answer_id
  join public.survey_options o on o.option_id = ao.option_id
  where q.question_type = 'multiple_choice'::public.survey_question_type
    and q.reporting_key = 'suggested_event'
    and lower(trim(o.option_text)) <> 'other'
), respondents as (
  select survey_id, count(distinct response_id)::numeric as respondent_count
  from selected_options
  group by survey_id
), grouped as (
  select
    option_id,
    option_text,
    min(sort_order) as sort_order,
    min(source_survey) as source_survey,
    min(survey_id) as survey_id,
    count(distinct response_id)::integer as vote_count
  from selected_options
  group by option_id, option_text
)
select
  row_number() over (order by g.vote_count desc, g.sort_order asc, g.option_text asc)::integer as rank,
  g.option_text::text as suggested_event_name,
  'Event preference'::text as category,
  g.vote_count as respondent_count,
  g.vote_count,
  coalesce(r.respondent_count, 0)::integer as total_respondent_count,
  g.vote_count as authenticated_respondent_count,
  0::integer as guest_respondent_count,
  null::numeric as average_rating,
  g.vote_count::numeric as total_score,
  g.vote_count as positive_count,
  case when coalesce(r.respondent_count, 0) > 0 then round(g.vote_count::numeric / r.respondent_count * 100, 2) else 0 end as positive_interest_percentage,
  case when coalesce(r.respondent_count, 0) > 0 then round(g.vote_count::numeric / r.respondent_count * 100, 2) else 0 end as respondent_support_percentage,
  case when coalesce(r.respondent_count, 0) > 0 then round(g.vote_count::numeric / r.respondent_count * 100, 2) else 0 end as respondent_percentage,
  g.vote_count as submission_count,
  array[g.source_survey]::text[] as source_surveys,
  exists (
    select 1 from public.events e
    where lower(trim(e.event_name)) = lower(trim(g.option_text))
      and e.status in ('scheduled'::public.event_status_type, 'ongoing'::public.event_status_type)
  ) as is_already_planned,
  (
    select min(e.event_id)
    from public.events e
    where lower(trim(e.event_name)) = lower(trim(g.option_text))
      and e.status in ('scheduled'::public.event_status_type, 'ongoing'::public.event_status_type)
  ) as matching_event_id
from grouped g
left join respondents r on r.survey_id = g.survey_id;

revoke all on public.survey_top_suggested_events from public, anon, authenticated;

create or replace view public.survey_top_event_preferences
with (security_invoker = true)
as
select
  rank,
  suggested_event_name as event_name,
  category as event_category,
  vote_count as response_count,
  authenticated_respondent_count,
  guest_respondent_count,
  total_respondent_count,
  average_rating,
  total_score,
  positive_count,
  positive_interest_percentage,
  source_surveys,
  is_already_planned,
  matching_event_id
from public.survey_top_suggested_events;

revoke all on public.survey_top_event_preferences from public, anon, authenticated;

create or replace function public.get_admin_top_suggested_events()
returns setof public.survey_top_suggested_events
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if not public.is_active_admin() then
    raise exception 'Only active admins can view survey analytics';
  end if;
  return query select * from public.survey_top_suggested_events order by rank;
end;
$function$;

create or replace function public.get_admin_event_preference_recommendations()
returns setof public.survey_top_event_preferences
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if not public.is_active_admin() then
    raise exception 'Only active admins can view event preference recommendations';
  end if;
  return query select * from public.survey_top_event_preferences order by rank;
end;
$function$;

create or replace function public.get_admin_other_event_suggestions()
returns table(suggestion text, submitted_at timestamptz, survey_title text)
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if not public.is_active_admin() then
    raise exception 'Only active admins can view survey analytics';
  end if;

  return query
  select trim(a.answer_text)::text, sr.submitted_at, s.title::text
  from public.survey_answers a
  join public.survey_responses sr on sr.response_id = a.response_id
  join public.surveys s on s.survey_id = sr.survey_id
  join public.survey_answer_options ao on ao.answer_id = a.answer_id
  join public.survey_options o on o.option_id = ao.option_id
  join public.survey_questions q on q.question_id = a.question_id
  where q.reporting_key = 'suggested_event'
    and lower(trim(o.option_text)) = 'other'
    and nullif(trim(coalesce(a.answer_text, '')), '') is not null
  order by sr.submitted_at desc;
end;
$function$;

grant execute on function public.get_admin_top_suggested_events() to authenticated;
revoke all on function public.get_admin_event_preference_recommendations() from public, anon;
grant execute on function public.get_admin_event_preference_recommendations() to authenticated;
revoke all on function public.get_admin_other_event_suggestions() from public, anon;
grant execute on function public.get_admin_other_event_suggestions() to authenticated;

create or replace function public.get_admin_feedback_insights_summary()
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_result jsonb;
begin
  if not public.is_active_admin() then
    raise exception 'Only active admins can view feedback insights';
  end if;

  with event_ratings as (
    select
      e.event_id,
      e.event_name,
      e.event_date,
      count(f.feedback_id)::integer as response_count,
      round(avg(f.rating)::numeric, 2) as average_rating,
      count(*) filter (where f.rating = 1)::integer as one_star_count,
      count(*) filter (where f.rating = 2)::integer as two_star_count,
      count(*) filter (where f.rating = 3)::integer as three_star_count,
      count(*) filter (where f.rating = 4)::integer as four_star_count,
      count(*) filter (where f.rating = 5)::integer as five_star_count
    from public.events e
    left join public.post_event_feedback f
      on f.event_id = e.event_id
     and f.rating between 1 and 5
    where e.status = 'completed'::public.event_status_type
    group by e.event_id, e.event_name, e.event_date
  ), rated_events as (
    select * from event_ratings where response_count > 0
  ), totals as (
    select
      coalesce(sum(response_count), 0)::integer as total_responses,
      round(
        (
          sum(one_star_count * 1 + two_star_count * 2 + three_star_count * 3 + four_star_count * 4 + five_star_count * 5)::numeric
          / nullif(sum(response_count), 0)::numeric
        ),
        2
      ) as overall_average_rating,
      jsonb_build_object(
        '1', coalesce(sum(one_star_count), 0),
        '2', coalesce(sum(two_star_count), 0),
        '3', coalesce(sum(three_star_count), 0),
        '4', coalesce(sum(four_star_count), 0),
        '5', coalesce(sum(five_star_count), 0)
      ) as rating_distribution
    from event_ratings
  ), recent_halves as (
    select
      (avg(rating) filter (where submitted_at >= now() - interval '30 days'))::numeric as recent_average,
      (avg(rating) filter (where submitted_at < now() - interval '30 days' and submitted_at >= now() - interval '60 days'))::numeric as previous_average,
      count(*) filter (where submitted_at >= now() - interval '30 days') as recent_count,
      count(*) filter (where submitted_at < now() - interval '30 days' and submitted_at >= now() - interval '60 days') as previous_count
    from public.post_event_feedback
    where rating between 1 and 5
  ), trend as (
    select case
      when recent_count < 3 or previous_count < 3 then 'not_enough_data'
      when recent_average > previous_average + 0.1 then 'up'
      when recent_average < previous_average - 0.1 then 'down'
      else 'flat'
    end as recent_trend
    from recent_halves
  ), highest as (
    select coalesce(jsonb_agg(to_jsonb(h) order by h.average_rating desc, h.response_count desc, h.event_name asc), '[]'::jsonb) as rows
    from (select * from rated_events order by average_rating desc, response_count desc, event_name asc limit 3) h
  ), lowest as (
    select coalesce(jsonb_agg(to_jsonb(l) order by l.average_rating asc, l.response_count desc, l.event_name asc), '[]'::jsonb) as rows
    from (select * from rated_events order by average_rating asc, response_count desc, event_name asc limit 3) l
  ), insights as (
    select array_remove(array[
      (select case when response_count > 0 then event_name || ' received the highest average rating at ' || average_rating || ' stars.' end from rated_events order by average_rating desc, response_count desc, event_name asc limit 1),
      (select case when total_responses > 0 and ((rating_distribution->>'4')::integer + (rating_distribution->>'5')::integer) >= greatest(1, ceil(total_responses * 0.5)::integer) then 'Most respondents rated completed events between 4 and 5 stars.' end from totals),
      (select case when re.response_count > 0 and t.overall_average_rating is not null and re.average_rating < t.overall_average_rating then re.event_name || ' is below the overall average and may need improvement.' end from rated_events re cross join totals t order by re.average_rating asc, re.response_count desc, re.event_name asc limit 1)
    ], null) as rows
  )
  select jsonb_build_object(
    'events', coalesce((select jsonb_agg(to_jsonb(event_ratings) order by event_date desc nulls last, event_name asc) from event_ratings), '[]'::jsonb),
    'highestRatedEvents', highest.rows,
    'lowestRatedEvents', lowest.rows,
    'overallAverageRating', totals.overall_average_rating,
    'totalResponses', totals.total_responses,
    'ratingDistribution', totals.rating_distribution,
    'recentTrend', trend.recent_trend,
    'insights', coalesce(to_jsonb(insights.rows), '[]'::jsonb)
  )
  into v_result
  from totals, trend, highest, lowest, insights;

  return v_result;
end;
$function$;

revoke all on function public.get_admin_feedback_insights_summary() from public, anon;
grant execute on function public.get_admin_feedback_insights_summary() to authenticated;

create or replace function public.enforce_financial_transaction_status()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if tg_op = 'INSERT' then
    new.status := 'completed';
  elsif tg_op = 'UPDATE' then
    new.status := old.status;
  end if;
  return new;
end;
$function$;

drop trigger if exists enforce_financial_transaction_status on public.financial_transactions;
create trigger enforce_financial_transaction_status
before insert or update on public.financial_transactions
for each row execute function public.enforce_financial_transaction_status();

create or replace function public.save_admin_financial_transaction(
  p_transaction_id bigint,
  p_budget_year_id integer,
  p_event_id integer,
  p_transaction_type text,
  p_category text,
  p_amount numeric,
  p_transaction_date date,
  p_status text,
  p_description text,
  p_reference_number text,
  p_payment_method text,
  p_receipt_path text
)
returns public.financial_transactions
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_transaction public.financial_transactions;
begin
  if not public.is_active_admin() then
    raise exception 'Only active admins can save financial transactions';
  end if;

  if p_amount is null or p_amount <= 0 then
    raise exception 'Amount must be greater than zero';
  end if;

  if p_transaction_id is null then
    insert into public.financial_transactions (
      budget_year_id,
      event_id,
      transaction_type,
      category,
      amount,
      transaction_date,
      status,
      description,
      reference_number,
      payment_method,
      receipt_path,
      created_by
    )
    values (
      p_budget_year_id,
      p_event_id,
      p_transaction_type,
      nullif(trim(coalesce(p_category, '')), ''),
      p_amount,
      coalesce(p_transaction_date, current_date),
      'completed',
      nullif(trim(coalesce(p_description, '')), ''),
      nullif(trim(coalesce(p_reference_number, '')), ''),
      nullif(trim(coalesce(p_payment_method, '')), ''),
      nullif(trim(coalesce(p_receipt_path, '')), ''),
      auth.uid()
    )
    returning * into v_transaction;
  else
    update public.financial_transactions
    set budget_year_id = p_budget_year_id,
        event_id = p_event_id,
        transaction_type = p_transaction_type,
        category = nullif(trim(coalesce(p_category, '')), ''),
        amount = p_amount,
        transaction_date = coalesce(p_transaction_date, current_date),
        description = nullif(trim(coalesce(p_description, '')), ''),
        reference_number = nullif(trim(coalesce(p_reference_number, '')), ''),
        payment_method = nullif(trim(coalesce(p_payment_method, '')), ''),
        receipt_path = nullif(trim(coalesce(p_receipt_path, '')), '')
    where transaction_id = p_transaction_id
    returning * into v_transaction;

    if v_transaction.transaction_id is null then
      raise exception 'Financial transaction not found';
    end if;
  end if;

  return v_transaction;
end;
$function$;

revoke all on function public.save_admin_financial_transaction(bigint, integer, integer, text, text, numeric, date, text, text, text, text, text) from public, anon;
grant execute on function public.save_admin_financial_transaction(bigint, integer, integer, text, text, numeric, date, text, text, text, text, text) to authenticated;
