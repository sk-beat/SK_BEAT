drop function if exists public.save_admin_survey(
  integer,
  text,
  text,
  public.survey_status_type,
  timestamp with time zone,
  timestamp with time zone,
  public.survey_target_audience_type,
  jsonb
);

revoke all on function public.save_admin_survey(
  integer,
  text,
  text,
  public.survey_status_type,
  timestamp with time zone,
  timestamp with time zone,
  public.survey_target_audience_type,
  jsonb,
  boolean
) from public, anon;

grant execute on function public.save_admin_survey(
  integer,
  text,
  text,
  public.survey_status_type,
  timestamp with time zone,
  timestamp with time zone,
  public.survey_target_audience_type,
  jsonb,
  boolean
) to authenticated;
