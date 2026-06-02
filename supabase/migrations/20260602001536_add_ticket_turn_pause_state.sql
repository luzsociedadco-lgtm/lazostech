alter table public.ticket_turns
  add column if not exists is_paused boolean not null default false,
  add column if not exists paused_at timestamptz;

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
      'special_turn_assigned',
      'turn_paused',
      'turn_resumed'
    )
  );

create or replace function private.ticket_turn_snapshot(turn_row public.ticket_turns)
returns jsonb
language plpgsql
security definer
set search_path = public, private
as $$
declare
  active_ahead integer;
  monthly_reactivations_used integer;
  monthly_special_used integer;
  queue_position integer;
  estimated_minutes integer;
  estimated_hour integer;
  estimated_minute integer;
  service_row public.ticket_turn_services;
begin
  select *
    into service_row
    from public.ticket_turn_services
    where id = turn_row.service_id;

  select count(*)::integer
    into active_ahead
    from public.ticket_turns queue_turn
    where queue_turn.service_id = turn_row.service_id
      and queue_turn.turn_date = turn_row.turn_date
      and queue_turn.status in ('activo', 'en_fila')
      and coalesce(queue_turn.is_paused, false) = false
      and queue_turn.sequence_number <= turn_row.sequence_number;

  queue_position := greatest(active_ahead, 0);
  estimated_minutes := case
    when queue_position > 0 then ceiling(greatest(queue_position - 1, 0)::numeric / 3)::integer
    else 0
  end;
  estimated_hour := 12 + floor(estimated_minutes / 60)::integer;
  estimated_minute := estimated_minutes % 60;

  select count(*)::integer
    into monthly_reactivations_used
    from public.ticket_turn_reactivations reaction
    where reaction.user_id = turn_row.user_id
      and reaction.service_id = turn_row.service_id
      and date_trunc('month', reaction.reactivated_at at time zone 'America/Bogota') =
        date_trunc('month', now() at time zone 'America/Bogota');

  select count(*)::integer
    into monthly_special_used
    from public.ticket_turns special_turn
    where special_turn.user_id = turn_row.user_id
      and special_turn.service_id = turn_row.service_id
      and special_turn.is_special
      and date_trunc('month', special_turn.assigned_at at time zone 'America/Bogota') =
        date_trunc('month', now() at time zone 'America/Bogota');

  return jsonb_build_object(
    'id', turn_row.id,
    'userId', turn_row.user_id,
    'number', turn_row.turn_code,
    'status', private.ticket_turn_status_to_app(turn_row.status, turn_row.is_special),
    'type', case when turn_row.is_special then 'special' else 'regular' end,
    'qrCodeId', 'lazos-lunch-turns-v1',
    'createdAt', turn_row.assigned_at,
    'updatedAt', turn_row.updated_at,
    'expiresAt', coalesce(turn_row.expires_at, turn_row.assigned_at + interval '30 minutes'),
    'reactivationsUsed', monthly_reactivations_used,
    'reactivationEvents', '[]'::jsonb,
    'queuePosition', queue_position,
    'estimatedMinutes', estimated_minutes,
    'estimatedTimeLabel', lpad(estimated_hour::text, 2, '0') || ':' || lpad(estimated_minute::text, 2, '0'),
    'queuePaused', coalesce(service_row.queue_paused, false),
    'turnPaused', coalesce(turn_row.is_paused, false),
    'reactivationsAvailable', greatest(coalesce(service_row.monthly_reactivation_limit, 10) - monthly_reactivations_used, 0),
    'monthlyReactivationsUsed', monthly_reactivations_used,
    'monthlyReactivationsLimit', coalesce(service_row.monthly_reactivation_limit, 10),
    'monthlyReservationsUsed', monthly_special_used,
    'monthlyReservationsLimit', 5
  );
end;
$$;

do $$
begin
  alter publication supabase_realtime add table public.ticket_turn_services;
exception
  when duplicate_object then null;
end;
$$;

grant update (status, expires_at, attended_at, is_paused, paused_at, updated_at) on public.ticket_turns to authenticated;
