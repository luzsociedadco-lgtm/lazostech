alter table public.user_profiles
  add column if not exists linked_wallet text,
  add column if not exists wallet_linked_at timestamptz,
  add column if not exists onchain_profile_registered boolean not null default false,
  add column if not exists onchain_affiliation_synced boolean not null default false;

alter table public.user_profiles
  drop constraint if exists user_profiles_linked_wallet_format;

alter table public.user_profiles
  add constraint user_profiles_linked_wallet_format
  check (linked_wallet is null or linked_wallet ~ '^0x[0-9A-Fa-f]{40}$');

create unique index if not exists user_profiles_linked_wallet_unique
  on public.user_profiles (lower(linked_wallet))
  where linked_wallet is not null;

create table if not exists public.user_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('recycling', 'tickets', 'profile', 'dao')),
  title text not null check (char_length(title) between 1 and 120),
  body text not null check (char_length(body) between 1 and 500),
  href text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists user_notifications_user_created_idx
  on public.user_notifications (user_id, created_at desc);

alter table public.user_notifications enable row level security;

drop policy if exists "users can read own notifications" on public.user_notifications;
create policy "users can read own notifications"
  on public.user_notifications
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "users can insert own notifications" on public.user_notifications;
create policy "users can insert own notifications"
  on public.user_notifications
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "users can update own notifications" on public.user_notifications;
create policy "users can update own notifications"
  on public.user_notifications
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

revoke all on public.user_profiles from anon;
grant select, insert, update on public.user_profiles to authenticated;

revoke all on public.user_notifications from anon;
grant select, insert, update on public.user_notifications to authenticated;

alter function public.set_user_profiles_updated_at() set search_path = '';
revoke execute on function public.set_user_profiles_updated_at() from public, anon, authenticated;

alter function public.set_ticket_turn_updated_at() set search_path = '';
revoke execute on function public.set_ticket_turn_updated_at() from public, anon, authenticated;

alter function private.ticket_turn_prefix_from_index(integer) set search_path = '';
alter function private.ticket_turn_code_from_sequence(integer) set search_path = '';
alter function private.ticket_turn_status_to_app(text, boolean) set search_path = '';

revoke execute on function private.ticket_turn_prefix_from_index(integer)
  from public, anon, authenticated;
revoke execute on function private.ticket_turn_code_from_sequence(integer)
  from public, anon, authenticated;
revoke execute on function private.ticket_turn_status_to_app(text, boolean)
  from public, anon, authenticated;
revoke execute on function private.ticket_turn_snapshot(public.ticket_turns)
  from public, anon, authenticated;
revoke execute on function private.is_ticket_turn_monitor(uuid) from public, anon;
grant execute on function private.is_ticket_turn_monitor(uuid) to authenticated;

alter function public.get_lunch_turn_state() set schema private;
alter function public.request_lunch_turn(text, text, text, text) set schema private;
alter function public.reactivate_lunch_turn() set schema private;

revoke execute on function private.get_lunch_turn_state() from public, anon;
revoke execute on function private.request_lunch_turn(text, text, text, text) from public, anon;
revoke execute on function private.reactivate_lunch_turn() from public, anon;
grant execute on function private.get_lunch_turn_state() to authenticated;
grant execute on function private.request_lunch_turn(text, text, text, text) to authenticated;
grant execute on function private.reactivate_lunch_turn() to authenticated;

create function public.get_lunch_turn_state()
returns jsonb
language sql
security invoker
set search_path = ''
as $$
  select private.get_lunch_turn_state();
$$;

create function public.request_lunch_turn(
  qr_code_id text,
  _student_code text,
  _student_email text,
  _student_name text
)
returns jsonb
language sql
security invoker
set search_path = ''
as $$
  select private.request_lunch_turn(
    qr_code_id,
    coalesce(
      (select nullif(trim(profile.student_code), '')
       from public.user_profiles profile
       where profile.user_id = (select auth.uid())),
      split_part(coalesce(auth.jwt() ->> 'email', (select auth.uid())::text), '@', 1)
    ),
    coalesce(auth.jwt() ->> 'email', (select auth.uid())::text),
    coalesce(
      (select nullif(trim(profile.first_name || ' ' || profile.last_name), '')
       from public.user_profiles profile
       where profile.user_id = (select auth.uid())),
      split_part(coalesce(auth.jwt() ->> 'email', (select auth.uid())::text), '@', 1)
    )
  );
$$;

create function public.reactivate_lunch_turn()
returns jsonb
language sql
security invoker
set search_path = ''
as $$
  select private.reactivate_lunch_turn();
$$;

revoke execute on function public.get_lunch_turn_state() from public, anon;
revoke execute on function public.request_lunch_turn(text, text, text, text) from public, anon;
revoke execute on function public.reactivate_lunch_turn() from public, anon;
grant execute on function public.get_lunch_turn_state() to authenticated;
grant execute on function public.request_lunch_turn(text, text, text, text) to authenticated;
grant execute on function public.reactivate_lunch_turn() to authenticated;

do $$
begin
  if to_regprocedure('private.set_ticket_turn_monitor_email_allowlist_updated_at()') is not null then
    execute 'alter function private.set_ticket_turn_monitor_email_allowlist_updated_at() set search_path = ''''';
    execute 'revoke execute on function private.set_ticket_turn_monitor_email_allowlist_updated_at() from public, anon, authenticated';
  end if;

  if to_regprocedure('public.handle_new_user()') is not null then
    execute 'revoke execute on function public.handle_new_user() from public, anon, authenticated';
  end if;
end;
$$;
