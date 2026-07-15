do $$
begin
  if not exists (select 1 from public.sk_officials) then
    alter table public.sk_officials disable trigger set_sk_officials_audit_fields;

    insert into public.sk_officials (
      full_name,
      position,
      committee,
      biography,
      display_order,
      is_active,
      term_start,
      term_end,
      created_by
    )
    values
      ('Starter SK Chairperson', 'SK Chairperson', 'Youth Council Leadership', 'Starter homepage record. Replace this with the elected SK Chairperson profile.', 0, true, null, null, null),
      ('Starter Education Kagawad', 'SK Kagawad', 'Education Committee', 'Starter homepage record. Replace this with the education committee official.', 1, true, null, null, null),
      ('Starter Health Kagawad', 'SK Kagawad', 'Health Committee', 'Starter homepage record. Replace this with the health committee official.', 2, true, null, null, null),
      ('Starter Sports Kagawad', 'SK Kagawad', 'Sports Committee', 'Starter homepage record. Replace this with the sports committee official.', 3, true, null, null, null),
      ('Starter Environment Kagawad', 'SK Kagawad', 'Environment Committee', 'Starter homepage record. Replace this with the environment committee official.', 4, true, null, null, null),
      ('Starter SK Secretary', 'SK Secretary', 'Council Records', 'Starter homepage record. Replace this with the SK Secretary profile.', 5, true, null, null, null),
      ('Starter SK Treasurer', 'SK Treasurer', 'Finance and Budget', 'Starter homepage record. Replace this with the SK Treasurer profile.', 6, true, null, null, null),
      ('Starter Youth Volunteer Lead', 'Youth Volunteer Lead', 'Volunteer Coordination', 'Starter homepage record. Replace this with the volunteer lead profile.', 7, true, null, null, null);

    alter table public.sk_officials enable trigger set_sk_officials_audit_fields;
  end if;
exception
  when others then
    alter table public.sk_officials enable trigger set_sk_officials_audit_fields;
    raise;
end;
$$;
