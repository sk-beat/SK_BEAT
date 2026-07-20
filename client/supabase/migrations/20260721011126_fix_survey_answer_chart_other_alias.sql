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
    with selections as (
      select distinct
        sr.response_id,
        public.normalize_survey_suggestion(so.option_text) as normalized_name,
        so.option_text as display_name,
        so.sort_order,
        'multiple_choice'::text as answer_kind
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
        'other'::text as answer_kind
      from public.survey_responses sr
      join public.survey_answers a on a.response_id = sr.response_id
      join public.survey_answer_options ao on ao.answer_id = a.answer_id
      join public.survey_options so on so.option_id = ao.option_id
      where sr.survey_id = p_survey_id
        and a.question_id = p_question_id
        and (coalesce(so.is_other, false) or lower(trim(so.option_text)) = 'other')
    ), grouped as (
      select
        selections.normalized_name,
        selections.answer_kind,
        coalesce(min(selections.display_name) filter (where selections.sort_order is not null), min(selections.display_name)) as display_name,
        count(distinct selections.response_id)::integer as selection_count,
        min(selections.sort_order) as sort_order
      from selections
      where selections.normalized_name is not null
      group by selections.normalized_name, selections.answer_kind
    )
    select
      p_survey_id,
      v_survey_title,
      p_question_id,
      v_question.question_text::text,
      v_question.question_type::text,
      g.answer_kind,
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
