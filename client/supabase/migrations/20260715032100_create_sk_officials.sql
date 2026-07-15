create table if not exists public.sk_officials (
  official_id uuid primary key default gen_random_uuid(),
  full_name text not null check (length(trim(full_name)) > 0),
  position text not null check (length(trim(position)) > 0),
  committee text,
  biography text,
  photo_path text,
  display_order integer not null default 0 check (display_order >= 0),
  is_active boolean not null default true,
  term_start date,
  term_end date,
  created_by uuid references public.admins(admin_id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sk_officials_term_check check (
    term_start is null
    or term_end is null
    or term_end >= term_start
  )
);

create index if not exists sk_officials_is_active_idx
  on public.sk_officials (is_active);

create index if not exists sk_officials_display_order_idx
  on public.sk_officials (display_order, created_at, official_id);

create index if not exists sk_officials_position_idx
  on public.sk_officials (position);

create or replace function public.set_sk_officials_audit_fields()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if not public.is_active_admin() then
    raise exception 'Only active admins can manage SK officials.';
  end if;

  if tg_op = 'INSERT' then
    new.created_by := auth.uid();
    new.created_at := coalesce(new.created_at, now());
    new.updated_at := now();
  elsif tg_op = 'UPDATE' then
    new.created_by := old.created_by;
    new.created_at := old.created_at;
    new.updated_at := now();
  end if;

  return new;
end;
$$;

drop trigger if exists set_sk_officials_audit_fields on public.sk_officials;

create trigger set_sk_officials_audit_fields
before insert or update on public.sk_officials
for each row
execute function public.set_sk_officials_audit_fields();

alter table public.sk_officials enable row level security;

drop policy if exists "Public can view active SK officials" on public.sk_officials;
drop policy if exists "Active admins can insert SK officials" on public.sk_officials;
drop policy if exists "Active admins can update SK officials" on public.sk_officials;
drop policy if exists "Active admins can delete SK officials" on public.sk_officials;

create policy "Public can view active SK officials"
on public.sk_officials
for select
to anon, authenticated
using (is_active = true or public.is_active_admin());

create policy "Active admins can insert SK officials"
on public.sk_officials
for insert
to authenticated
with check (public.is_active_admin());

create policy "Active admins can update SK officials"
on public.sk_officials
for update
to authenticated
using (public.is_active_admin())
with check (public.is_active_admin());

create policy "Active admins can delete SK officials"
on public.sk_officials
for delete
to authenticated
using (public.is_active_admin());

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'sk-official-photos',
  'sk-official-photos',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can read SK official photos" on storage.objects;
drop policy if exists "Active admins can upload SK official photos" on storage.objects;
drop policy if exists "Active admins can update SK official photos" on storage.objects;
drop policy if exists "Active admins can delete SK official photos" on storage.objects;

create policy "Public can read SK official photos"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'sk-official-photos');

create policy "Active admins can upload SK official photos"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'sk-official-photos'
  and public.is_active_admin()
);

create policy "Active admins can update SK official photos"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'sk-official-photos'
  and public.is_active_admin()
)
with check (
  bucket_id = 'sk-official-photos'
  and public.is_active_admin()
);

create policy "Active admins can delete SK official photos"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'sk-official-photos'
  and public.is_active_admin()
);
