alter table public.kabataan_suggestions
  add column if not exists feedback_comment text,
  add column if not exists feedback_updated_at timestamptz,
  add column if not exists feedback_updated_by uuid references public.admins(admin_id) on delete set null;

drop policy if exists "Authenticated users can view suggestions" on public.kabataan_suggestions;
drop policy if exists "Active admins can read suggestions" on public.kabataan_suggestions;
drop policy if exists "Youth can read own suggestions" on public.kabataan_suggestions;
drop policy if exists "Active admins can update suggestion feedback" on public.kabataan_suggestions;

create policy "Active admins can read suggestions"
on public.kabataan_suggestions
for select
to authenticated
using (public.is_active_admin());

create policy "Youth can read own suggestions"
on public.kabataan_suggestions
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Active admins can update suggestion feedback"
on public.kabataan_suggestions
for update
to authenticated
using (public.is_active_admin())
with check (public.is_active_admin());
