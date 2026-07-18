alter table public.kabataan_profiles
add column if not exists date_of_birth date;

alter table public.kabataan_profiles
drop constraint if exists kabataan_profiles_date_of_birth_reasonable_check;

alter table public.kabataan_profiles
add constraint kabataan_profiles_date_of_birth_reasonable_check
check (
  date_of_birth is null
  or date_of_birth >= date '1900-01-01'
);

create index if not exists kabataan_profiles_date_of_birth_idx
on public.kabataan_profiles(date_of_birth);
