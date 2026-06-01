create or replace function private.ticket_turn_prefix_from_index(input_index integer)
returns text
language plpgsql
immutable
as $$
declare
  value integer := input_index;
  prefix text := '';
begin
  loop
    prefix := chr(65 + (value % 26)) || prefix;
    value := floor(value / 26)::integer - 1;
    exit when value < 0;
  end loop;

  return prefix;
end;
$$;

create or replace function private.ticket_turn_code_from_sequence(sequence_number integer)
returns text
language sql
immutable
as $$
  select private.ticket_turn_prefix_from_index(floor(sequence_number / 100)::integer)
    || '-'
    || lpad((sequence_number % 100)::text, 2, '0');
$$;

create or replace function private.ticket_turn_status_to_app(input_status text, is_special boolean)
returns text
language sql
immutable
as $$
  select case
    when input_status in ('activo', 'en_fila') and is_special then 'reserved'
    when input_status in ('activo', 'en_fila') then 'active'
    when input_status = 'atendido' then 'completed'
    when input_status = 'expirado' then 'expired'
    else 'cancelled'
  end;
$$;

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
    'reactivationsAvailable', greatest(coalesce(service_row.monthly_reactivation_limit, 10) - monthly_reactivations_used, 0),
    'monthlyReactivationsUsed', monthly_reactivations_used,
    'monthlyReactivationsLimit', coalesce(service_row.monthly_reactivation_limit, 10),
    'monthlyReservationsUsed', monthly_special_used,
    'monthlyReservationsLimit', 5
  );
end;
$$;

create or replace function public.get_lunch_turn_state()
returns jsonb
language plpgsql
security definer
set search_path = public, private
as $$
declare
  service_row public.ticket_turn_services;
  turn_row public.ticket_turns;
  today date := (now() at time zone 'America/Bogota')::date;
begin
  if auth.uid() is null then
    raise exception 'UNAUTHORIZED';
  end if;

  select *
    into service_row
    from public.ticket_turn_services
    where code = 'univalle-lunch-main'
      and is_active
    limit 1;

  if service_row.id is null then
    return null;
  end if;

  update public.ticket_turns
    set status = 'expirado'
    where service_id = service_row.id
      and turn_date = today
      and status in ('activo', 'en_fila')
      and expires_at is not null
      and expires_at < now();

  select *
    into turn_row
    from public.ticket_turns
    where service_id = service_row.id
      and user_id = auth.uid()
      and turn_date = today
      and status in ('activo', 'en_fila')
    order by assigned_at desc
    limit 1;

  if turn_row.id is null then
    return null;
  end if;

  return private.ticket_turn_snapshot(turn_row);
end;
$$;

create or replace function public.request_lunch_turn(
  qr_code_id text,
  student_code text,
  student_email text,
  student_name text
)
returns jsonb
language plpgsql
security definer
set search_path = public, private
as $$
declare
  service_row public.ticket_turn_services;
  existing_turn public.ticket_turns;
  new_turn public.ticket_turns;
  today date := (now() at time zone 'America/Bogota')::date;
  next_sequence integer;
begin
  if auth.uid() is null then
    raise exception 'UNAUTHORIZED';
  end if;

  if qr_code_id is null or position('lazos-lunch-turns-v1' in qr_code_id) = 0 then
    raise exception 'INVALID_TURN_QR';
  end if;

  insert into public.ticket_turn_services (code, name, qr_code_token, is_active)
  values ('univalle-lunch-main', 'Fila de almuerzos Univalle', 'lazos-lunch-turns-v1', true)
  on conflict (code) do update
    set is_active = true,
        qr_code_token = 'lazos-lunch-turns-v1'
  returning * into service_row;

  update public.ticket_turns
    set status = 'expirado'
    where service_id = service_row.id
      and turn_date = today
      and status in ('activo', 'en_fila')
      and expires_at is not null
      and expires_at < now();

  select *
    into existing_turn
    from public.ticket_turns
    where service_id = service_row.id
      and user_id = auth.uid()
      and turn_date = today
      and status in ('activo', 'en_fila')
    order by assigned_at desc
    limit 1;

  if existing_turn.id is not null then
    return private.ticket_turn_snapshot(existing_turn);
  end if;

  select coalesce(max(sequence_number) + 1, 0)
    into next_sequence
    from public.ticket_turns
    where service_id = service_row.id
      and turn_date = today;

  insert into public.ticket_turns (
    service_id,
    user_id,
    student_code,
    student_email,
    student_name,
    turn_date,
    sequence_number,
    turn_code,
    status,
    is_special,
    assigned_at,
    expires_at
  )
  values (
    service_row.id,
    auth.uid(),
    coalesce(nullif(trim(student_code), ''), split_part(coalesce(student_email, auth.uid()::text), '@', 1)),
    coalesce(nullif(trim(student_email), ''), auth.uid()::text),
    coalesce(nullif(trim(student_name), ''), split_part(coalesce(student_email, auth.uid()::text), '@', 1)),
    today,
    next_sequence,
    private.ticket_turn_code_from_sequence(next_sequence),
    'activo',
    false,
    now(),
    now() + interval '30 minutes'
  )
  returning * into new_turn;

  return private.ticket_turn_snapshot(new_turn);
end;
$$;

create or replace function public.reactivate_lunch_turn()
returns jsonb
language plpgsql
security definer
set search_path = public, private
as $$
declare
  service_row public.ticket_turn_services;
  turn_row public.ticket_turns;
  monthly_reactivations_used integer;
  today date := (now() at time zone 'America/Bogota')::date;
begin
  if auth.uid() is null then
    raise exception 'UNAUTHORIZED';
  end if;

  select *
    into service_row
    from public.ticket_turn_services
    where code = 'univalle-lunch-main'
      and is_active
    limit 1;

  if service_row.id is null then
    raise exception 'TURN_NOT_FOUND';
  end if;

  select *
    into turn_row
    from public.ticket_turns
    where service_id = service_row.id
      and user_id = auth.uid()
      and turn_date = today
      and status <> 'atendido'
    order by assigned_at desc
    limit 1;

  if turn_row.id is null then
    raise exception 'TURN_NOT_FOUND';
  end if;

  select count(*)::integer
    into monthly_reactivations_used
    from public.ticket_turn_reactivations reaction
    where reaction.user_id = auth.uid()
      and reaction.service_id = service_row.id
      and date_trunc('month', reaction.reactivated_at at time zone 'America/Bogota') =
        date_trunc('month', now() at time zone 'America/Bogota');

  if monthly_reactivations_used >= service_row.monthly_reactivation_limit then
    raise exception 'TURN_REACTIVATION_LIMIT_REACHED';
  end if;

  update public.ticket_turns
    set status = 'activo',
        expires_at = now() + interval '10 minutes'
    where id = turn_row.id
    returning * into turn_row;

  insert into public.ticket_turn_reactivations (turn_id, service_id, user_id, expires_at)
  values (turn_row.id, service_row.id, auth.uid(), turn_row.expires_at);

  return private.ticket_turn_snapshot(turn_row);
end;
$$;

grant execute on function public.get_lunch_turn_state() to authenticated;
grant execute on function public.request_lunch_turn(text, text, text, text) to authenticated;
grant execute on function public.reactivate_lunch_turn() to authenticated;
