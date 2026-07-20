update public.admins
set barangay = 'Barangay Galas Maasim'
where barangay is distinct from 'Barangay Galas Maasim';

drop function if exists public.update_admin_profile_image(text);

create or replace function public.update_admin_profile_image(
  p_profile_image text,
  p_fullname text default null,
  p_position text default null,
  p_contact_number text default null
)
returns public.admins
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_admin public.admins;
begin
  if not public.is_active_admin() then
    raise exception 'Only active admins can update admin profiles';
  end if;

  update public.admins
  set
    fullname = coalesce(nullif(trim(coalesce(p_fullname, '')), ''), fullname),
    position = nullif(trim(coalesce(p_position, '')), ''),
    contact_number = nullif(trim(coalesce(p_contact_number, '')), ''),
    profile_image = nullif(trim(coalesce(p_profile_image, '')), ''),
    barangay = 'Barangay Galas Maasim'
  where admin_id = auth.uid()
  returning * into v_admin;

  if not found then
    raise exception 'Admin profile not found';
  end if;

  return v_admin;
end;
$function$;

revoke all on function public.update_admin_profile_image(text, text, text, text) from public, anon;
grant execute on function public.update_admin_profile_image(text, text, text, text) to authenticated;

create or replace function public.enforce_admin_barangay()
returns trigger
language plpgsql
security invoker
set search_path to 'public'
as $function$
begin
  new.barangay := 'Barangay Galas Maasim';
  return new;
end;
$function$;

drop trigger if exists enforce_admin_barangay on public.admins;

create trigger enforce_admin_barangay
before insert or update on public.admins
for each row
execute function public.enforce_admin_barangay();

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
        so.sort_order
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
        coalesce(oo.normalized_name, public.normalize_survey_suggestion(a.answer_text)) as normalized_name,
        coalesce(oo.display_name, trim(a.answer_text)) as display_name,
        oo.sort_order
      from public.survey_responses sr
      join public.survey_answers a on a.response_id = sr.response_id
      join public.survey_answer_options ao on ao.answer_id = a.answer_id
      join public.survey_options so on so.option_id = ao.option_id
      left join official_options oo on oo.normalized_name = public.normalize_survey_suggestion(a.answer_text)
      where sr.survey_id = p_survey_id
        and a.question_id = p_question_id
        and (coalesce(so.is_other, false) or lower(trim(so.option_text)) = 'other')
        and public.normalize_survey_suggestion(a.answer_text) is not null
    ), grouped as (
      select
        normalized_name,
        coalesce(min(display_name) filter (where sort_order is not null), min(display_name)) as display_name,
        count(distinct response_id)::integer as selection_count,
        min(sort_order) as sort_order
      from selections
      where normalized_name is not null
      group by normalized_name
    )
    select
      p_survey_id,
      v_survey_title,
      p_question_id,
      v_question.question_text::text,
      v_question.question_type::text,
      'multiple_choice'::text,
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
