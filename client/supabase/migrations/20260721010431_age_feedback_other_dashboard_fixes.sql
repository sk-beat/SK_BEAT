create or replace function public.current_manila_date()
returns date
language sql
stable
set search_path to 'public'
as $function$
  select (now() at time zone 'Asia/Manila')::date;
$function$;

revoke all on function public.current_manila_date() from public, anon, authenticated;

create or replace function public.is_kabataan_age_ineligible(
  p_date_of_birth date,
  p_reference_date date default public.current_manila_date()
)
returns boolean
language sql
stable
set search_path to 'public'
as $function$
  select p_date_of_birth is not null
    and p_reference_date >= (p_date_of_birth + interval '31 years')::date;
$function$;

revoke all on function public.is_kabataan_age_ineligible(date, date) from public, anon, authenticated;

create or replace function public.calculate_age_from_birthdate(p_date_of_birth date)
returns integer
language sql
stable
set search_path to 'public'
as $function$
  select case
    when p_date_of_birth is null then null
    else extract(year from age(public.current_manila_date(), p_date_of_birth))::integer
  end;
$function$;

revoke all on function public.calculate_age_from_birthdate(date) from public, anon, authenticated;

create or replace function public.validate_kabataan_birthdate(p_date_of_birth date)
returns void
language plpgsql
stable
set search_path = public
as $function$
begin
  if p_date_of_birth is null then
    return;
  end if;

  if p_date_of_birth < date '1900-01-01' then
    raise exception 'Birthday must be on or after January 1, 1900.';
  end if;

  if p_date_of_birth > public.current_manila_date() then
    raise exception 'Birthday cannot be in the future.';
  end if;
end;
$function$;

revoke all on function public.validate_kabataan_birthdate(date) from public, anon, authenticated;

create or replace function public.apply_kabataan_account_lock(p_profile_id uuid)
returns public.kabataan_profiles
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_profile public.kabataan_profiles;
  v_age integer;
begin
  select * into v_profile
  from public.kabataan_profiles
  where profile_id = p_profile_id;

  if not found then
    raise exception 'Youth profile not found.';
  end if;

  if v_profile.date_of_birth is null then
    return v_profile;
  end if;

  v_age := public.calculate_age_from_birthdate(v_profile.date_of_birth);

  if public.is_kabataan_age_ineligible(v_profile.date_of_birth) then
    update public.kabataan_profiles
    set status = 'inactive'::public.kabataan_status_type,
        age = v_age,
        account_lock_reason = coalesce(account_lock_reason, 'age_limit'),
        account_locked_at = coalesce(account_locked_at, now())
    where profile_id = p_profile_id
      and (
        status is distinct from 'inactive'::public.kabataan_status_type
        or age is distinct from v_age
        or account_locked_at is null
        or account_lock_reason is null
      )
    returning * into v_profile;
  elsif v_profile.age is distinct from v_age then
    update public.kabataan_profiles
    set age = v_age
    where profile_id = p_profile_id
    returning * into v_profile;
  end if;

  return v_profile;
end;
$function$;

revoke all on function public.apply_kabataan_account_lock(uuid) from public, anon, authenticated;
grant execute on function public.apply_kabataan_account_lock(uuid) to authenticated;

create or replace function public.refresh_kabataan_ages_and_lock_limit()
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_checked_count integer := 0;
  v_missing_birthday_count integer := 0;
  v_age_refreshed_count integer := 0;
  v_newly_locked_count integer := 0;
  v_already_locked_count integer := 0;
  v_run_date_manila date := public.current_manila_date();
  v_result jsonb;
begin
  select
    count(*)::integer,
    count(*) filter (where date_of_birth is null)::integer,
    count(*) filter (
      where date_of_birth is not null
        and public.is_kabataan_age_ineligible(date_of_birth, v_run_date_manila)
        and status = 'inactive'::public.kabataan_status_type
        and account_lock_reason = 'age_limit'
    )::integer
  into v_checked_count, v_missing_birthday_count, v_already_locked_count
  from public.kabataan_profiles;

  update public.kabataan_profiles
  set age = public.calculate_age_from_birthdate(date_of_birth)
  where date_of_birth is not null
    and age is distinct from public.calculate_age_from_birthdate(date_of_birth);

  get diagnostics v_age_refreshed_count = row_count;

  update public.kabataan_profiles
  set status = 'inactive'::public.kabataan_status_type,
      age = public.calculate_age_from_birthdate(date_of_birth),
      account_lock_reason = 'age_limit',
      account_locked_at = coalesce(account_locked_at, now())
  where date_of_birth is not null
    and public.is_kabataan_age_ineligible(date_of_birth, v_run_date_manila)
    and status = 'active'::public.kabataan_status_type
    and (account_lock_reason is null or account_lock_reason = 'age_limit');

  get diagnostics v_newly_locked_count = row_count;

  v_result := jsonb_build_object(
    'checked_count', v_checked_count,
    'newly_locked_count', v_newly_locked_count,
    'already_locked_count', v_already_locked_count,
    'missing_birthday_count', v_missing_birthday_count,
    'age_refreshed_count', v_age_refreshed_count,
    'run_date_manila', v_run_date_manila
  );

  raise log '[Age Checker] Completed checked_count: %, newly_locked_count: %, already_locked_count: %, missing_birthday_count: %, run_date_manila: %',
    v_checked_count,
    v_newly_locked_count,
    v_already_locked_count,
    v_missing_birthday_count,
    v_run_date_manila;

  return v_result;
end;
$function$;

revoke all on function public.refresh_kabataan_ages_and_lock_limit() from public, anon, authenticated;

create or replace function public.lock_age_limit_kabataan_accounts()
returns integer
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_result jsonb;
begin
  v_result := public.refresh_kabataan_ages_and_lock_limit();
  return coalesce((v_result->>'newly_locked_count')::integer, 0);
end;
$function$;

revoke all on function public.lock_age_limit_kabataan_accounts() from public, anon, authenticated;

create or replace function public.get_admin_survey_answer_chart(
  p_survey_id integer,
  p_question_id integer
)
returns table (
  survey_id integer,
  survey_title text,
  question_id integer,
  question_text text,
  question_type text,
  answer_type text,
  label text,
  count integer,
  percentage numeric,
  display_order integer,
  respondent_count integer
)
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_question public.survey_questions%rowtype;
  v_survey_title text;
  v_respondent_count integer;
begin
  if not public.is_active_admin() then
    raise exception 'Only active admins can view survey analytics';
  end if;

  select q.*
  into v_question
  from public.survey_questions q
  where q.survey_id = p_survey_id
    and q.question_id = p_question_id;

  if not found then
    return;
  end if;

  select s.title::text
  into v_survey_title
  from public.surveys s
  where s.survey_id = p_survey_id;

  select count(distinct sr.response_id)::integer
  into v_respondent_count
  from public.survey_responses sr
  join public.survey_answers a on a.response_id = sr.response_id
  where sr.survey_id = p_survey_id
    and a.question_id = p_question_id;

  if v_question.question_type = 'event_interest_likert'::public.survey_question_type then
    return query
    with ratings as (
      select
        sr.response_id,
        coalesce(so.score_value, nullif(regexp_replace(coalesce(a.answer_text, ''), '[^0-9]', '', 'g'), '')::integer) as rating
      from public.survey_responses sr
      join public.survey_answers a on a.response_id = sr.response_id
      left join public.survey_answer_options ao on ao.answer_id = a.answer_id
      left join public.survey_options so on so.option_id = ao.option_id
      where sr.survey_id = p_survey_id
        and a.question_id = p_question_id
    ), buckets as (
      select *
      from (values
        (1, '1 star / Strongly disagree'::text),
        (2, '2 stars'::text),
        (3, '3 stars'::text),
        (4, '4 stars'::text),
        (5, '5 stars / Strongly agree'::text)
      ) as bucket(rating, label)
    )
    select
      p_survey_id,
      v_survey_title,
      p_question_id,
      v_question.question_text::text,
      v_question.question_type::text,
      'likert'::text,
      b.label,
      count(distinct r.response_id)::integer,
      case
        when v_respondent_count > 0 then round(count(distinct r.response_id)::numeric / v_respondent_count * 100, 2)
        else 0
      end,
      b.rating,
      v_respondent_count
    from buckets b
    left join ratings r on r.rating = b.rating
    group by b.rating, b.label
    order by b.rating;

    return;
  end if;

  if v_question.question_type = 'multiple_choice'::public.survey_question_type then
    return query
    with official_options as (
      select
        public.normalize_survey_suggestion(o.option_text) as normalized_name,
        min(o.option_text) as display_name,
        min(o.sort_order) as sort_order
      from public.survey_options o
      where o.question_id = p_question_id
        and not coalesce(o.is_other, false)
        and lower(trim(o.option_text)) <> 'other'
      group by public.normalize_survey_suggestion(o.option_text)
    ), selections as (
      select distinct
        sr.response_id,
        public.normalize_survey_suggestion(so.option_text) as normalized_name,
        so.option_text as display_name,
        so.sort_order,
        'multiple_choice'::text as answer_type
      from public.survey_responses sr
      join public.survey_answers a on a.response_id = sr.response_id
      join public.survey_answer_options ao on ao.answer_id = a.answer_id
      join public.survey_options so on so.option_id = ao.option_id
      where sr.survey_id = p_survey_id
        and a.question_id = p_question_id
        and not coalesce(so.is_other, false)
        and lower(trim(so.option_text)) <> 'other'
      union
      select distinct
        sr.response_id,
        '__other__'::text as normalized_name,
        'Other'::text as display_name,
        100000 as sort_order,
        'other'::text as answer_type
      from public.survey_responses sr
      join public.survey_answers a on a.response_id = sr.response_id
      join public.survey_answer_options ao on ao.answer_id = a.answer_id
      join public.survey_options so on so.option_id = ao.option_id
      where sr.survey_id = p_survey_id
        and a.question_id = p_question_id
        and (coalesce(so.is_other, false) or lower(trim(so.option_text)) = 'other')
    ), grouped as (
      select
        normalized_name,
        answer_type,
        coalesce(min(display_name) filter (where sort_order is not null), min(display_name)) as display_name,
        count(distinct response_id)::integer as selection_count,
        min(sort_order) as sort_order
      from selections
      where normalized_name is not null
      group by normalized_name, answer_type
    )
    select
      p_survey_id,
      v_survey_title,
      p_question_id,
      v_question.question_text::text,
      v_question.question_type::text,
      g.answer_type,
      g.display_name,
      g.selection_count,
      case
        when v_respondent_count > 0 then round(g.selection_count::numeric / v_respondent_count * 100, 2)
        else 0
      end,
      coalesce(g.sort_order, 100000) + row_number() over (order by g.selection_count desc, g.display_name)::integer,
      v_respondent_count
    from grouped g
    order by g.selection_count desc, g.sort_order nulls last, g.display_name;

    return;
  end if;

  return query
  with selections as (
    select distinct
      sr.response_id,
      coalesce(nullif(trim(so.option_text), ''), nullif(trim(a.answer_text), ''), 'Blank response') as display_name,
      coalesce(so.sort_order, 100000) as sort_order
    from public.survey_responses sr
    join public.survey_answers a on a.response_id = sr.response_id
    left join public.survey_answer_options ao on ao.answer_id = a.answer_id
    left join public.survey_options so on so.option_id = ao.option_id
    where sr.survey_id = p_survey_id
      and a.question_id = p_question_id
  ), grouped as (
    select
      display_name,
      count(distinct response_id)::integer as response_count,
      min(sort_order) as sort_order
    from selections
    group by display_name
  )
  select
    p_survey_id,
    v_survey_title,
    p_question_id,
    v_question.question_text::text,
    v_question.question_type::text,
    v_question.question_type::text,
    g.display_name,
    g.response_count,
    case
      when v_respondent_count > 0 then round(g.response_count::numeric / v_respondent_count * 100, 2)
      else 0
    end,
    g.sort_order,
    v_respondent_count
  from grouped g
  order by g.response_count desc, g.sort_order, g.display_name;
end;
$function$;

revoke all on function public.get_admin_survey_answer_chart(integer, integer) from public, anon;
grant execute on function public.get_admin_survey_answer_chart(integer, integer) to authenticated;

create or replace function public.get_admin_kabataan_feedback_records()
returns table (
  feedback_id text,
  comment text,
  source_type text,
  submitted_by_name text,
  is_guest boolean,
  related_title text,
  created_at timestamp with time zone
)
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if not public.is_active_admin() then
    raise exception 'Only active admins can view feedback records';
  end if;

  return query
  select
    ('suggestion:' || ks.suggestion_id::text) as feedback_id,
    ks.message as comment,
    'Suggestion'::text as source_type,
    coalesce(nullif(trim(kp.fullname), ''), 'Guest') as submitted_by_name,
    (ks.user_id is null) as is_guest,
    null::text as related_title,
    ks.submitted_at as created_at
  from public.kabataan_suggestions ks
  left join public.kabataan_profiles kp on kp.profile_id = ks.user_id
  union all
  select
    ('event_feedback:' || pef.feedback_id::text) as feedback_id,
    pef.comments as comment,
    case
      when pef.respondent_type = 'guest' or pef.user_id is null then 'Guest Event Feedback'
      else 'Event Feedback'
    end as source_type,
    case
      when pef.respondent_type = 'guest' or pef.user_id is null then 'Guest'
      else coalesce(nullif(trim(kp.fullname), ''), 'Youth')
    end as submitted_by_name,
    (pef.respondent_type = 'guest' or pef.user_id is null) as is_guest,
    e.event_name::text as related_title,
    pef.submitted_at as created_at
  from public.post_event_feedback pef
  left join public.kabataan_profiles kp on kp.profile_id = pef.user_id
  left join public.events e on e.event_id = pef.event_id
  order by created_at desc nulls last, feedback_id desc;
end;
$function$;

revoke all on function public.get_admin_kabataan_feedback_records() from public, anon;
grant execute on function public.get_admin_kabataan_feedback_records() to authenticated;
