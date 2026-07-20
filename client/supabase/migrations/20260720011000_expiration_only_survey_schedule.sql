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
  v_existing_expires timestamptz;
  v_had_responses boolean := false;
  v_expiration_changed boolean := false;
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

  if p_expires_at is null then
    raise exception 'Survey expiration is required.';
  end if;

  if p_survey_id is not null then
    select status, expires_at
    into v_old_status, v_existing_expires
    from public.surveys
    where survey_id = p_survey_id
    for update;

    if not found then
      raise exception 'Survey not found';
    end if;
  end if;

  v_expiration_changed := p_survey_id is null or p_expires_at is distinct from v_existing_expires;

  if v_expiration_changed and p_expires_at < now() then
    raise exception 'Survey expiration cannot be in the past.';
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
        start_date = null,
        end_date = null,
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
      null,
      null,
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
    null,
    null,
    v_existing_expires,
    p_target_audience,
    p_allow_guest_responses,
    p_questions
  );
end;
$function$;

revoke all on function public.save_admin_survey(integer, text, text, public.survey_status_type, timestamptz, timestamptz, public.survey_target_audience_type, jsonb, boolean) from public, anon;
grant execute on function public.save_admin_survey(integer, text, text, public.survey_status_type, timestamptz, timestamptz, public.survey_target_audience_type, jsonb, boolean) to authenticated;
