drop policy if exists "Public can read SK official photos" on storage.objects;

create index if not exists sk_officials_created_by_idx
  on public.sk_officials (created_by);
