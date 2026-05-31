alter table public.ticket_turn_services
  add column if not exists queue_paused boolean not null default false,
  add column if not exists queue_paused_at timestamptz;

alter table public.ticket_turns
  add column if not exists is_special boolean not null default false;

alter table public.ticket_turn_events
  drop constraint if exists ticket_turn_events_event_type_check;

alter table public.ticket_turn_events
  add constraint ticket_turn_events_event_type_check
  check (
    event_type in (
      'qr_scanned',
      'turn_assigned',
      'turn_reactivated',
      'status_changed',
      'turn_expired',
      'queue_paused',
      'queue_resumed',
      'special_turn_assigned'
    )
  );

drop policy if exists "monitors can update assigned turn services" on public.ticket_turn_services;
create policy "monitors can update assigned turn services"
  on public.ticket_turn_services
  for update
  to authenticated
  using (private.is_ticket_turn_monitor(id))
  with check (private.is_ticket_turn_monitor(id));

drop policy if exists "monitors can insert assigned service turns" on public.ticket_turns;
create policy "monitors can insert assigned service turns"
  on public.ticket_turns
  for insert
  to authenticated
  with check (private.is_ticket_turn_monitor(service_id));

grant update (queue_paused, queue_paused_at, updated_at) on public.ticket_turn_services to authenticated;
grant insert (service_id, user_id, student_code, student_email, student_name, turn_date, sequence_number, turn_code, status, is_special, assigned_at, expires_at) on public.ticket_turns to authenticated;
