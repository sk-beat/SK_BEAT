create or replace function public.sync_kabataan_age_from_birthdate()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_age integer;
begin
  if new.date_of_birth is not null then
    perform public.validate_kabataan_birthdate(new.date_of_birth);
    v_age := public.calculate_age_from_birthdate(new.date_of_birth);
    new.age := v_age;

    if tg_op = 'INSERT' and (v_age < 15 or v_age > 30) then
      raise exception 'Youth account creation is only allowed for ages 15 to 30.';
    end if;

    if v_age >= 31 then
      new.status := 'inactive'::public.kabataan_status_type;
      new.account_lock_reason := 'age_limit';
      new.account_locked_at := coalesce(new.account_locked_at, now());
    elsif new.account_lock_reason = 'age_limit' then
      new.status := 'active'::public.kabataan_status_type;
      new.account_lock_reason := null;
      new.account_locked_at := null;
    end if;
  else
    new.age := null;
  end if;

  return new;
end;
$$;

revoke all on function public.sync_kabataan_age_from_birthdate() from public, anon, authenticated;

drop trigger if exists sync_kabataan_age_from_birthdate_trigger
on public.kabataan_profiles;

create trigger sync_kabataan_age_from_birthdate_trigger
before insert or update of date_of_birth, age
on public.kabataan_profiles
for each row
execute function public.sync_kabataan_age_from_birthdate();
