begin;

create or replace function public.get_admin_dashboard_summary()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_result jsonb;
begin
  if not public.is_active_admin() then
    raise exception 'Only active admins can view dashboard data';
  end if;

  select jsonb_build_object(
    'totalYouth', (select count(*) from public.kabataan_profiles),
    'activeYouth', (select count(*) from public.kabataan_profiles where status = 'approved'),
    'totalBudget', coalesce((select sum(total_allocation) from public.annual_budgets), 0),
    'allocatedBudget', coalesce((select sum(allocated_budget) from public.events), 0),
    'completedSpending', coalesce((select sum(amount) from public.financial_transactions where status = 'completed'), 0),
    'upcomingEventsCount', (select count(*) from public.events where status = 'scheduled'),
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
      limit 4
    ), '[]'::jsonb)
  ) into v_result;

  return v_result;
end;
$$;

revoke all on function public.get_admin_dashboard_summary() from public, anon;
grant execute on function public.get_admin_dashboard_summary() to authenticated;

commit;
