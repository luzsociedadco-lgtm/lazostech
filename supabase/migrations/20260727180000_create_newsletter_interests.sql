create table if not exists public.newsletter_interests (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 2 and 100),
  email text not null check (
    char_length(email) between 3 and 254
    and email = lower(email)
    and email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'
  ),
  city text check (city is null or char_length(trim(city)) between 2 and 100),
  organization text check (organization is null or char_length(trim(organization)) between 2 and 140),
  interest text check (
    interest is null
    or interest in ('estudiante', 'universidad', 'aliado', 'emprendimiento', 'comunidad')
  ),
  message text check (message is null or char_length(trim(message)) <= 600),
  consent boolean not null default false check (consent is true),
  source text not null default 'we_landing' check (char_length(source) between 1 and 80),
  user_agent text,
  referrer text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists newsletter_interests_email_unique
  on public.newsletter_interests (lower(email));

create index if not exists newsletter_interests_created_at_idx
  on public.newsletter_interests (created_at desc);

alter table public.newsletter_interests enable row level security;

drop policy if exists "visitors can subscribe to newsletter" on public.newsletter_interests;
create policy "visitors can subscribe to newsletter"
  on public.newsletter_interests
  for insert
  to anon, authenticated
  with check (
    consent is true
    and source = 'we_landing'
    and char_length(trim(name)) between 2 and 100
    and (city is null or char_length(trim(city)) between 2 and 100)
    and (organization is null or char_length(trim(organization)) between 2 and 140)
    and (
      interest is null
      or interest in ('estudiante', 'universidad', 'aliado', 'emprendimiento', 'comunidad')
    )
    and email = lower(email)
  );

revoke all on public.newsletter_interests from anon, authenticated;
grant insert on public.newsletter_interests to anon, authenticated;
