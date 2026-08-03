insert into public.ticket_turn_services (code, name, qr_code_token, is_active)
values ('univalle-lunch-main', 'Fila de almuerzos Univalle', 'lazos-lunch-turns-v1', true)
on conflict (code) do update
  set name = excluded.name,
      qr_code_token = excluded.qr_code_token,
      is_active = true;

create table if not exists private.ticket_turn_monitor_email_allowlist (
  id uuid primary key default gen_random_uuid(),
  email_hash text not null check (email_hash ~ '^[0-9a-f]{64}$'),
  service_code text not null,
  role text not null check (role in ('restaurant_monitor', 'admin')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists ticket_turn_monitor_email_allowlist_unique
  on private.ticket_turn_monitor_email_allowlist (email_hash, service_code, role);

create or replace function private.set_ticket_turn_monitor_email_allowlist_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_ticket_turn_monitor_email_allowlist_updated_at
  on private.ticket_turn_monitor_email_allowlist;

create trigger set_ticket_turn_monitor_email_allowlist_updated_at
  before update on private.ticket_turn_monitor_email_allowlist
  for each row
  execute function private.set_ticket_turn_monitor_email_allowlist_updated_at();

create or replace function private.sync_ticket_turn_monitor_roles_for_user(
  target_user_id uuid,
  target_email text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.ticket_turn_monitor_roles (user_id, service_id, role, is_active)
  select
    target_user_id,
    service_row.id,
    allowlist.role,
    true
  from private.ticket_turn_monitor_email_allowlist allowlist
  join public.ticket_turn_services service_row
    on service_row.code = allowlist.service_code
  where allowlist.email_hash = encode(
      sha256(convert_to(lower(trim(target_email)), 'UTF8')),
      'hex'
    )
    and allowlist.is_active
    and service_row.is_active
  on conflict (user_id, service_id, role) do update
    set is_active = true;
end;
$$;

create or replace function private.sync_ticket_turn_monitor_roles_for_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.email is not null then
    perform private.sync_ticket_turn_monitor_roles_for_user(new.id, new.email);
  end if;

  return new;
end;
$$;

drop trigger if exists sync_ticket_turn_monitor_roles_for_auth_user
  on auth.users;

create trigger sync_ticket_turn_monitor_roles_for_auth_user
  after insert or update of email on auth.users
  for each row
  execute function private.sync_ticket_turn_monitor_roles_for_auth_user();

revoke all on private.ticket_turn_monitor_email_allowlist from public, anon, authenticated;
revoke execute on function private.set_ticket_turn_monitor_email_allowlist_updated_at()
  from public, anon, authenticated;
revoke execute on function private.sync_ticket_turn_monitor_roles_for_user(uuid, text)
  from public, anon, authenticated;
revoke execute on function private.sync_ticket_turn_monitor_roles_for_auth_user()
  from public, anon, authenticated;

-- Store only deterministic email hashes in version control and in the private
-- allowlist. The original addresses remain in Auth and are never exposed here.
insert into private.ticket_turn_monitor_email_allowlist (email_hash, service_code, role, is_active)
values
  ('3d3755c5df539af5cad14512c1b7fe315823d265576a4e6cbb27be1cbcf55630', 'univalle-lunch-main', 'restaurant_monitor', true),
  ('35f2ca2351276da47cda718b049d8cc943bc94271829d55b661b7ed53c273ce7', 'univalle-lunch-main', 'restaurant_monitor', true),
  ('078797511975d2fa7f2140f733a7a92c056d702bb2529ebc747cdc5dcf35dd79', 'univalle-lunch-main', 'restaurant_monitor', true)
on conflict (email_hash, service_code, role) do update
  set is_active = true,
      updated_at = now();

select private.sync_ticket_turn_monitor_roles_for_user(user_row.id, user_row.email)
from auth.users user_row
where encode(
    sha256(convert_to(lower(trim(user_row.email)), 'UTF8')),
    'hex'
  ) in (
  '3d3755c5df539af5cad14512c1b7fe315823d265576a4e6cbb27be1cbcf55630',
  '35f2ca2351276da47cda718b049d8cc943bc94271829d55b661b7ed53c273ce7',
  '078797511975d2fa7f2140f733a7a92c056d702bb2529ebc747cdc5dcf35dd79'
);
