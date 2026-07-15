begin;

alter table public.sk_officials disable trigger set_sk_officials_audit_fields;

update public.sk_officials
set position = 'SK Councilor', updated_at = now()
where position = 'SK Kagawad';

delete from public.sk_officials
where official_id = '4d189bfa-e08a-45ed-a154-a6bb11f69218'
  and full_name = 'Starter Youth Volunteer Lead'
  and position = 'Youth Volunteer Lead'
  and photo_path is null;

alter table public.sk_officials enable trigger set_sk_officials_audit_fields;

commit;

