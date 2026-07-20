create or replace function public.normalize_survey_suggestion(p_value text)
returns text
language sql
immutable
as $function$
  select nullif(
    regexp_replace(
      lower(
        regexp_replace(
          trim(regexp_replace(coalesce(p_value, ''), '^[[:punct:][:space:]]+|[[:punct:][:space:]]+$', '', 'g')),
          '\s+',
          ' ',
          'g'
        )
      ),
      '\s+',
      ' ',
      'g'
    ),
    ''
  );
$function$;

revoke all on function public.normalize_survey_suggestion(text) from public, anon, authenticated;
grant execute on function public.normalize_survey_suggestion(text) to authenticated;

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
  v_existing_start timestamptz;
  v_existing_end timestamptz;
  v_existing_expires timestamptz;
  v_had_responses boolean := false;
  v_schedule_changed boolean := false;
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

  if p_survey_id is not null then
    select status, start_date, end_date, expires_at
    into v_old_status, v_existing_start, v_existing_end, v_existing_expires
    from public.surveys
    where survey_id = p_survey_id
    for update;

    if not found then
      raise exception 'Survey not found';
    end if;
  end if;

  v_schedule_changed :=
    p_survey_id is null
    or p_start_date is distinct from v_existing_start
    or p_end_date is distinct from v_existing_end
    or p_expires_at is distinct from v_existing_expires;

  if v_schedule_changed and p_start_date is not null and p_start_date < now() then
    raise exception 'Survey start time must be today or in the future.';
  end if;

  if v_schedule_changed and p_expires_at is not null and p_expires_at < now() then
    raise exception 'Survey expiration cannot be in the past.';
  end if;

  if v_schedule_changed and p_expires_at is not null and p_start_date is not null and p_expires_at <= p_start_date then
    raise exception 'Survey expiration must be after the start time.';
  end if;

  if p_end_date is not null and p_start_date is not null and p_end_date <= p_start_date then
    raise exception 'End date must be later than start date';
  end if;

  if p_survey_id is not null then
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
      created_by,
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
      auth.uid(),
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
          score_value,
          is_other,
          event_name,
          event_category,
          event_description
        )
        values (
          v_question_id,
          nullif(trim(coalesce(v_option->>'option_text', '')), ''),
          coalesce((v_option->>'sort_order')::integer, 0),
          nullif(v_option->>'score_value', '')::integer,
          coalesce((v_option->>'is_other')::boolean, false),
          nullif(trim(coalesce(v_option->>'event_name', '')), ''),
          nullif(trim(coalesce(v_option->>'event_category', '')), ''),
          nullif(trim(coalesce(v_option->>'event_description', '')), '')
        );
      end loop;
    end loop;
  end if;

  return v_survey;
end;
$function$;

revoke all on function public.save_admin_survey(integer, text, text, public.survey_status_type, timestamptz, timestamptz, timestamptz, public.survey_target_audience_type, boolean, jsonb) from public, anon;
grant execute on function public.save_admin_survey(integer, text, text, public.survey_status_type, timestamptz, timestamptz, timestamptz, public.survey_target_audience_type, boolean, jsonb) to authenticated;

create or replace function public.save_admin_survey(
  p_survey_id integer,
  p_title text,
  p_description text,
  p_status public.survey_status_type,
  p_start_date timestamptz,
  p_end_date timestamptz,
  p_target_audience public.survey_target_audience_type,
  p_questions jsonb,
  p_allow_guest_responses boolean default false
)
returns public.surveys
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_existing_expires timestamptz;
begin
  select expires_at
  into v_existing_expires
  from public.surveys
  where survey_id = p_survey_id;

  return public.save_admin_survey(
    p_survey_id,
    p_title,
    p_description,
    p_status,
    p_start_date,
    p_end_date,
    v_existing_expires,
    p_target_audience,
    p_allow_guest_responses,
    p_questions
  );
end;
$function$;

revoke all on function public.save_admin_survey(integer, text, text, public.survey_status_type, timestamptz, timestamptz, public.survey_target_audience_type, jsonb, boolean) from public, anon;
grant execute on function public.save_admin_survey(integer, text, text, public.survey_status_type, timestamptz, timestamptz, public.survey_target_audience_type, jsonb, boolean) to authenticated;

drop function if exists public.get_admin_top_suggested_events();
drop function if exists public.get_admin_event_preference_recommendations();
drop view if exists public.survey_top_event_preferences;
drop view if exists public.survey_top_suggested_events;

create view public.survey_top_suggested_events
with (security_invoker = true)
as
with official_options as (
  select
    o.option_id,
    public.normalize_survey_suggestion(o.option_text) as normalized_name,
    min(o.sort_order) as official_sort_order,
    min(o.option_text) as official_display_name
  from public.survey_options o
  join public.survey_questions q on q.question_id = o.question_id
  where q.question_type = 'multiple_choice'::public.survey_question_type
    and q.reporting_key = 'suggested_event'
    and not coalesce(o.is_other, false)
    and lower(trim(o.option_text)) <> 'other'
  group by o.option_id, public.normalize_survey_suggestion(o.option_text)
), official_votes as (
  select
    s.survey_id,
    s.title as source_survey,
    sr.response_id,
    public.normalize_survey_suggestion(o.option_text) as normalized_name,
    o.option_text as display_name,
    o.sort_order as official_sort_order,
    true as is_official,
    false as is_custom
  from public.survey_responses sr
  join public.surveys s on s.survey_id = sr.survey_id
  join public.survey_answers a on a.response_id = sr.response_id
  join public.survey_questions q on q.question_id = a.question_id
  join public.survey_answer_options ao on ao.answer_id = a.answer_id
  join public.survey_options o on o.option_id = ao.option_id
  where q.question_type = 'multiple_choice'::public.survey_question_type
    and q.reporting_key = 'suggested_event'
    and not coalesce(o.is_other, false)
    and lower(trim(o.option_text)) <> 'other'
), other_votes as (
  select
    s.survey_id,
    s.title as source_survey,
    sr.response_id,
    coalesce(oo.normalized_name, public.normalize_survey_suggestion(a.answer_text)) as normalized_name,
    coalesce(oo.official_display_name, trim(a.answer_text)) as display_name,
    oo.official_sort_order,
    oo.option_id is not null as is_official,
    true as is_custom
  from public.survey_responses sr
  join public.surveys s on s.survey_id = sr.survey_id
  join public.survey_answers a on a.response_id = sr.response_id
  join public.survey_questions q on q.question_id = a.question_id
  join public.survey_answer_options ao on ao.answer_id = a.answer_id
  join public.survey_options other_option on other_option.option_id = ao.option_id
  left join official_options oo on oo.normalized_name = public.normalize_survey_suggestion(a.answer_text)
  where q.question_type = 'multiple_choice'::public.survey_question_type
    and q.reporting_key = 'suggested_event'
    and (coalesce(other_option.is_other, false) or lower(trim(other_option.option_text)) = 'other')
    and public.normalize_survey_suggestion(a.answer_text) is not null
), unified_votes as (
  select * from official_votes
  union all
  select * from other_votes
), respondents as (
  select survey_id, count(distinct response_id)::numeric as respondent_count
  from unified_votes
  group by survey_id
), grouped as (
  select
    normalized_name,
    min(display_name) filter (where is_official) as official_display_name,
    min(display_name) as fallback_display_name,
    min(official_sort_order) as official_sort_order,
    array_agg(distinct source_survey order by source_survey) as source_surveys,
    min(survey_id) as survey_id,
    count(*)::integer as vote_count,
    count(distinct response_id)::integer as respondent_count,
    bool_or(is_official) as has_official,
    bool_or(is_custom) as has_custom
  from unified_votes
  where normalized_name is not null
  group by normalized_name
)
select
  row_number() over (
    order by g.vote_count desc, g.official_sort_order nulls last, coalesce(g.official_display_name, g.fallback_display_name)
  )::integer as rank,
  coalesce(g.official_display_name, g.fallback_display_name)::text as suggested_event_name,
  case
    when g.has_official and g.has_custom then 'Combined'
    when g.has_custom then 'Custom suggestion'
    else 'Official option'
  end::text as category,
  g.respondent_count,
  g.vote_count,
  coalesce(r.respondent_count, 0)::integer as total_respondent_count,
  g.respondent_count as authenticated_respondent_count,
  0::integer as guest_respondent_count,
  null::numeric as average_rating,
  g.vote_count::numeric as total_score,
  g.vote_count as positive_count,
  case when coalesce(r.respondent_count, 0) > 0 then round(g.vote_count::numeric / r.respondent_count * 100, 2) else 0 end as positive_interest_percentage,
  case when coalesce(r.respondent_count, 0) > 0 then round(g.vote_count::numeric / r.respondent_count * 100, 2) else 0 end as respondent_support_percentage,
  case when coalesce(r.respondent_count, 0) > 0 then round(g.vote_count::numeric / r.respondent_count * 100, 2) else 0 end as respondent_percentage,
  g.vote_count as submission_count,
  g.source_surveys,
  exists (
    select 1
    from public.events e
    where public.normalize_survey_suggestion(e.event_name) = g.normalized_name
      and e.status in ('scheduled'::public.event_status_type, 'ongoing'::public.event_status_type)
  ) as is_already_planned,
  (
    select min(e.event_id)
    from public.events e
    where public.normalize_survey_suggestion(e.event_name) = g.normalized_name
      and e.status in ('scheduled'::public.event_status_type, 'ongoing'::public.event_status_type)
  ) as matching_event_id,
  case
    when g.has_official and g.has_custom then 'combined'
    when g.has_custom then 'custom'
    else 'official'
  end::text as source_type
from grouped g
left join respondents r on r.survey_id = g.survey_id;

revoke all on public.survey_top_suggested_events from public, anon, authenticated;

create view public.survey_top_event_preferences
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

revoke all on function public.get_admin_top_suggested_events() from public, anon;
grant execute on function public.get_admin_top_suggested_events() to authenticated;

create or replace function public.get_admin_event_preference_recommendations()
returns setof public.survey_top_event_preferences
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if not public.is_active_admin() then
    raise exception 'Only active admins can view survey analytics';
  end if;

  return query select * from public.survey_top_event_preferences order by rank;
end;
$function$;

revoke all on function public.get_admin_event_preference_recommendations() from public, anon;
grant execute on function public.get_admin_event_preference_recommendations() to authenticated;

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
    'survey_questions', coalesce((
      select jsonb_agg(
        jsonb_build_object(
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
            select jsonb_agg(
              jsonb_build_object(
                'option_id', o.option_id,
                'option_text', o.option_text,
                'sort_order', o.sort_order,
                'score_value', o.score_value,
                'is_other', o.is_other,
                'event_name', o.event_name,
                'event_category', o.event_category,
                'event_description', o.event_description
              )
              order by o.sort_order, o.option_id
            )
            from public.survey_options o
            where o.question_id = q.question_id
          ), '[]'::jsonb)
        )
        order by q.sort_order, q.question_id
      )
      from public.survey_questions q
      where q.survey_id = s.survey_id
    ), '[]'::jsonb),
    'survey_responses', '[]'::jsonb
  )
  into v_result
  from public.surveys s
  where s.survey_id = p_survey_id
    and s.status = 'published'::public.survey_status_type
    and (s.start_date is null or s.start_date <= now())
    and (coalesce(s.expires_at, s.end_date) is null or coalesce(s.expires_at, s.end_date) > now());

  return v_result;
end;
$function$;

revoke all on function public.get_public_event_interest_survey(integer) from public;
grant execute on function public.get_public_event_interest_survey(integer) to anon, authenticated;
