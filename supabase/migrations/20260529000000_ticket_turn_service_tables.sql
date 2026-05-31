create extension if not exists pgcrypto;

create schema if not exists private;
revoke all on schema private from public;
revoke all on schema private from anon;
revoke all on schema private from authenticated;

create table if not exists public.ticket_turn_services (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  qr_code_token text not null unique default replace(gen_random_uuid()::text, '-', ''),
  operation_start_time time not null default time '12:00',
  monthly_reactivation_limit integer not null default 10 check (monthly_reactivation_limit >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ticket_turn_monitor_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  service_id uuid references public.ticket_turn_services(id) on delete cascade,
  role text not null check (role in ('monitor', 'admin')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (user_id, service_id, role)
);

create unique index if not exists ticket_turn_monitor_global_role_unique
  on public.ticket_turn_monitor_roles (user_id, role)
  where service_id is null;

create table if not exists public.ticket_turns (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references public.ticket_turn_services(id) on delete restrict,
  user_id uuid not null references auth.users(id) on delete cascade,
  student_code text not null,
  student_email text not null,
  student_name text not null,
  turn_date date not null default current_date,
  sequence_number integer not null check (sequence_number >= 0),
  turn_code text not null,
  status text not null default 'activo' check (status in ('activo', 'en_fila', 'atendido', 'expirado')),
  assigned_at timestamptz not null default now(),
  expires_at timestamptz,
  attended_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (service_id, turn_date, sequence_number),
  unique (service_id, turn_date, turn_code)
);

create table if not exists public.ticket_turn_reactivations (
  id uuid primary key default gen_random_uuid(),
  turn_id uuid not null references public.ticket_turns(id) on delete cascade,
  service_id uuid not null references public.ticket_turn_services(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  reactivated_at timestamptz not null default now(),
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.ticket_turn_events (
  id uuid primary key default gen_random_uuid(),
  turn_id uuid references public.ticket_turns(id) on delete cascade,
  service_id uuid references public.ticket_turn_services(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null,
  event_type text not null check (
    event_type in (
      'qr_scanned',
      'turn_assigned',
      'turn_reactivated',
      'status_changed',
      'turn_expired'
    )
  ),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create unique index if not exists ticket_turns_one_open_turn_per_user_day
  on public.ticket_turns (service_id, turn_date, user_id)
  where status in ('activo', 'en_fila');

create index if not exists ticket_turns_monitor_lookup_idx
  on public.ticket_turns (service_id, turn_date, status, sequence_number);

create index if not exists ticket_turns_student_code_idx
  on public.ticket_turns (student_code);

create index if not exists ticket_turns_student_email_idx
  on public.ticket_turns (student_email);

create index if not exists ticket_turn_reactivations_monthly_idx
  on public.ticket_turn_reactivations (user_id, service_id, reactivated_at);

create or replace function private.is_ticket_turn_monitor(target_service_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.ticket_turn_monitor_roles role_row
    where role_row.user_id = auth.uid()
      and role_row.is_active
      and (
        role_row.service_id = target_service_id
        or role_row.service_id is null
      )
      and role_row.role in ('monitor', 'admin')
  );
$$;

grant usage on schema private to authenticated;
grant execute on function private.is_ticket_turn_monitor(uuid) to authenticated;

create or replace function public.set_ticket_turn_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_ticket_turn_services_updated_at on public.ticket_turn_services;
create trigger set_ticket_turn_services_updated_at
  before update on public.ticket_turn_services
  for each row execute function public.set_ticket_turn_updated_at();

drop trigger if exists set_ticket_turns_updated_at on public.ticket_turns;
create trigger set_ticket_turns_updated_at
  before update on public.ticket_turns
  for each row execute function public.set_ticket_turn_updated_at();

alter table public.ticket_turn_services enable row level security;
alter table public.ticket_turn_monitor_roles enable row level security;
alter table public.ticket_turns enable row level security;
alter table public.ticket_turn_reactivations enable row level security;
alter table public.ticket_turn_events enable row level security;

drop policy if exists "authenticated users can read active turn services" on public.ticket_turn_services;
create policy "authenticated users can read active turn services"
  on public.ticket_turn_services
  for select
  to authenticated
  using (is_active);

drop policy if exists "users can read their own monitor roles" on public.ticket_turn_monitor_roles;
create policy "users can read their own monitor roles"
  on public.ticket_turn_monitor_roles
  for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "students can read their own turns" on public.ticket_turns;
create policy "students can read their own turns"
  on public.ticket_turns
  for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "monitors can read assigned service turns" on public.ticket_turns;
create policy "monitors can read assigned service turns"
  on public.ticket_turns
  for select
  to authenticated
  using (private.is_ticket_turn_monitor(service_id));

drop policy if exists "monitors can update assigned service turns" on public.ticket_turns;
create policy "monitors can update assigned service turns"
  on public.ticket_turns
  for update
  to authenticated
  using (private.is_ticket_turn_monitor(service_id))
  with check (private.is_ticket_turn_monitor(service_id));

drop policy if exists "students can read their own reactivations" on public.ticket_turn_reactivations;
create policy "students can read their own reactivations"
  on public.ticket_turn_reactivations
  for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "monitors can read assigned service reactivations" on public.ticket_turn_reactivations;
create policy "monitors can read assigned service reactivations"
  on public.ticket_turn_reactivations
  for select
  to authenticated
  using (private.is_ticket_turn_monitor(service_id));

drop policy if exists "users can read events for their own turns" on public.ticket_turn_events;
create policy "users can read events for their own turns"
  on public.ticket_turn_events
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.ticket_turns turn_row
      where turn_row.id = ticket_turn_events.turn_id
        and turn_row.user_id = auth.uid()
    )
  );

drop policy if exists "monitors can read assigned service events" on public.ticket_turn_events;
create policy "monitors can read assigned service events"
  on public.ticket_turn_events
  for select
  to authenticated
  using (private.is_ticket_turn_monitor(service_id));

grant usage on schema public to authenticated;
grant select on public.ticket_turn_services to authenticated;
grant select on public.ticket_turn_monitor_roles to authenticated;
grant select on public.ticket_turns to authenticated;
grant update (status, expires_at, attended_at, updated_at) on public.ticket_turns to authenticated;
grant select on public.ticket_turn_reactivations to authenticated;
grant select on public.ticket_turn_events to authenticated;
