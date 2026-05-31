create table if not exists public.user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  first_name text not null default '',
  last_name text not null default '',
  phone text not null default '',
  national_id text not null default '',
  student_code text not null default '',
  university_id integer not null default 0,
  campus_id integer not null default 1,
  program_id integer not null default 0,
  student_type text not null default 'Pregrado',
  benefit_label text not null default 'Almuerzo Regular',
  university_validated boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_profiles enable row level security;

drop policy if exists "users can read own profile" on public.user_profiles;
create policy "users can read own profile"
  on public.user_profiles
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "users can insert own profile" on public.user_profiles;
create policy "users can insert own profile"
  on public.user_profiles
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "users can update own profile" on public.user_profiles;
create policy "users can update own profile"
  on public.user_profiles
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create index if not exists user_profiles_email_idx on public.user_profiles (lower(email));
create index if not exists user_profiles_student_code_idx on public.user_profiles (student_code);

create or replace function public.set_user_profiles_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_user_profiles_updated_at on public.user_profiles;
create trigger set_user_profiles_updated_at
  before update on public.user_profiles
  for each row
  execute function public.set_user_profiles_updated_at();
