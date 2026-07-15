begin;

revoke all on public.sk_officials from anon, authenticated;

grant select (
  official_id,
  full_name,
  position,
  biography,
  photo_path,
  term_start,
  term_end
) on public.sk_officials to anon, authenticated;

grant delete on public.sk_officials to authenticated;

drop policy if exists "Active admins can read SK officials" on public.sk_officials;
drop policy if exists "Public can read SK official display columns" on public.sk_officials;
drop policy if exists "Active admins can delete SK officials" on public.sk_officials;

create policy "Public can read SK official display columns"
on public.sk_officials
for select
to anon, authenticated
using (true);

create policy "Active admins can delete SK officials"
on public.sk_officials
for delete
to authenticated
using (public.is_active_admin());

commit;
