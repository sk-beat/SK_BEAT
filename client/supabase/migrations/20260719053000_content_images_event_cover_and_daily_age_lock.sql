drop policy if exists "Active admins can upload announcement and event images" on storage.objects;
drop policy if exists "Active admins can update announcement and event images" on storage.objects;
drop policy if exists "Active admins can delete announcement and event images" on storage.objects;

create policy "Active admins can upload announcement and event images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'profile-images'
  and public.is_active_admin()
  and (storage.foldername(name))[1] in ('announcements', 'events')
);

create policy "Active admins can update announcement and event images"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'profile-images'
  and public.is_active_admin()
  and (storage.foldername(name))[1] in ('announcements', 'events')
)
with check (
  bucket_id = 'profile-images'
  and public.is_active_admin()
  and (storage.foldername(name))[1] in ('announcements', 'events')
);

create policy "Active admins can delete announcement and event images"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'profile-images'
  and public.is_active_admin()
  and (storage.foldername(name))[1] in ('announcements', 'events')
);

create or replace function public.save_admin_event_with_expenses(
  p_event_id integer,
  p_budget_year_id integer,
  p_event_name text,
  p_category text,
  p_status public.event_status_type,
  p_event_date date,
  p_event_time text,
  p_location text,
  p_expected_attendees integer,
  p_description text,
  p_expenses jsonb,
  p_cover_image text default null
)
returns public.events
language plpgsql
set search_path = public
as $$
declare
  v_event public.events;
  v_expected_attendees int := coalesce(p_expected_attendees, 0);
  v_allocated_budget numeric(10,2);
  v_budget_items jsonb;
begin
  if not public.is_active_admin() then
    raise exception 'Only active admins can manage events';
  end if;

  if v_expected_attendees < 0 then
    raise exception 'Expected attendees cannot be negative';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(coalesce(p_expenses, '[]'::jsonb)) expense_item
    where nullif(trim(expense_item->>'expense_type'), '') is null
  ) then
    raise exception 'Expense name cannot be empty';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(coalesce(p_expenses, '[]'::jsonb)) expense_item
    where coalesce(expense_item->>'calculation_type', 'fixed') not in ('fixed', 'per_attendee')
  ) then
    raise exception 'Invalid calculation type';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(coalesce(p_expenses, '[]'::jsonb)) expense_item
    where coalesce(nullif(expense_item->>'unit_cost', '')::numeric, 0) < 0
       or coalesce(nullif(expense_item->>'quantity', '')::numeric, 1) < 0
  ) then
    raise exception 'Unit cost and quantity cannot be negative';
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'expense_type', trim(expense_item.value->>'expense_type'),
        'calculation_type', coalesce(expense_item.value->>'calculation_type', 'fixed'),
        'unit_cost', coalesce(nullif(expense_item.value->>'unit_cost', '')::numeric, 0),
        'quantity',
          case
            when coalesce(expense_item.value->>'calculation_type', 'fixed') = 'per_attendee'
              then v_expected_attendees
            else coalesce(nullif(expense_item.value->>'quantity', '')::numeric, 1)
          end,
        'amount',
          case
            when coalesce(expense_item.value->>'calculation_type', 'fixed') = 'per_attendee'
              then coalesce(nullif(expense_item.value->>'unit_cost', '')::numeric, 0) * v_expected_attendees
            else coalesce(nullif(expense_item.value->>'unit_cost', '')::numeric, 0)
              * coalesce(nullif(expense_item.value->>'quantity', '')::numeric, 1)
          end,
        'description', nullif(expense_item.value->>'description', '')
      )
      order by expense_item.sort_order
    ),
    '[]'::jsonb
  )
  into v_budget_items
  from jsonb_array_elements(coalesce(p_expenses, '[]'::jsonb)) with ordinality as expense_item(value, sort_order)
  where nullif(trim(expense_item.value->>'expense_type'), '') is not null;

  select coalesce(sum(coalesce(nullif(budget_item->>'amount', '')::numeric, 0)), 0)
  into v_allocated_budget
  from jsonb_array_elements(v_budget_items) budget_item;

  if p_event_id is null then
    insert into public.events (
      budget_year_id,
      event_name,
      category,
      allocated_budget,
      budget_items,
      status,
      event_date,
      event_time,
      location,
      expected_attendees,
      cover_image,
      description,
      created_by
    )
    values (
      p_budget_year_id,
      p_event_name,
      p_category,
      v_allocated_budget,
      v_budget_items,
      coalesce(p_status, 'draft'::public.event_status_type),
      p_event_date,
      p_event_time,
      p_location,
      v_expected_attendees,
      nullif(trim(coalesce(p_cover_image, '')), ''),
      p_description,
      auth.uid()
    )
    returning * into v_event;
  else
    update public.events
    set
      budget_year_id = p_budget_year_id,
      event_name = p_event_name,
      category = p_category,
      allocated_budget = v_allocated_budget,
      budget_items = v_budget_items,
      status = coalesce(p_status, status),
      event_date = p_event_date,
      event_time = p_event_time,
      location = p_location,
      expected_attendees = v_expected_attendees,
      cover_image = nullif(trim(coalesce(p_cover_image, '')), ''),
      description = p_description
    where event_id = p_event_id
    returning * into v_event;

    if not found then
      raise exception 'Event not found';
    end if;

    delete from public.event_expenses
    where event_id = p_event_id;
  end if;

  insert into public.event_expenses (
    event_id,
    expense_type,
    calculation_type,
    unit_cost,
    quantity,
    amount,
    description
  )
  select
    v_event.event_id,
    budget_item->>'expense_type',
    budget_item->>'calculation_type',
    coalesce(nullif(budget_item->>'unit_cost', '')::numeric, 0),
    coalesce(nullif(budget_item->>'quantity', '')::numeric, 0),
    coalesce(nullif(budget_item->>'amount', '')::numeric, 0),
    nullif(budget_item->>'description', '')
  from jsonb_array_elements(v_budget_items) budget_item;

  return v_event;
end;
$$;

create or replace function public.lock_age_limit_kabataan_accounts()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_locked_count integer := 0;
begin
  update public.kabataan_profiles
  set status = 'inactive'::public.kabataan_status_type,
      age = public.calculate_age_from_birthdate(date_of_birth),
      account_lock_reason = 'age_limit',
      account_locked_at = coalesce(account_locked_at, now())
  where date_of_birth is not null
    and public.calculate_age_from_birthdate(date_of_birth) >= 31
    and (
      status is distinct from 'inactive'::public.kabataan_status_type
      or account_lock_reason is distinct from 'age_limit'
      or age is distinct from public.calculate_age_from_birthdate(date_of_birth)
    );

  get diagnostics v_locked_count = row_count;
  return v_locked_count;
end;
$$;

revoke all on function public.lock_age_limit_kabataan_accounts() from public, anon, authenticated;

do $$
begin
  create extension if not exists pg_cron;
exception
  when insufficient_privilege then
    raise notice 'pg_cron extension could not be created by this role.';
end $$;

select cron.unschedule(jobid)
from cron.job
where jobname = 'lock-age-limit-kabataan-accounts-daily';

select cron.schedule(
  'lock-age-limit-kabataan-accounts-daily',
  '0 16 * * *',
  $$select public.lock_age_limit_kabataan_accounts();$$
);

select public.lock_age_limit_kabataan_accounts();
