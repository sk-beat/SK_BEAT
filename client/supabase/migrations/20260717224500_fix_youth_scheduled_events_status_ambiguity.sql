-- Qualifies status references in get_youth_scheduled_events().
-- Applied remotely as: fix_youth_scheduled_events_status_ambiguity.

create or replace function public.get_youth_scheduled_events()
returns table (
  event_id integer,
  event_name text,
  category text,
  status public.event_status_type,
  event_date date,
  event_time text,
  location text,
  expected_attendees integer,
  cover_image text,
  description text,
  registration_count integer,
  occupied_slots integer,
  remaining_slots integer,
  is_registered boolean,
  attendance_status public.attendance_status_type
)
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
      and kp.status = 'approved'
  ) then
    raise exception 'Approved Youth profile required';
  end if;

  return query
  with counts as (
    select
      er.event_id,
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
$$;

revoke all on function public.get_youth_scheduled_events() from public, anon;
grant execute on function public.get_youth_scheduled_events() to authenticated;
