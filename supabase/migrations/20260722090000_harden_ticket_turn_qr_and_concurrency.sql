-- Upgrade installations where the monitor allowlist was already deployed with
-- clear email addresses. Fresh databases already create email_hash in the
-- earlier migration, so this block is safe in both cases.
alter table private.ticket_turn_monitor_email_allowlist
  add column if not exists email_hash text;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'private'
      and table_name = 'ticket_turn_monitor_email_allowlist'
      and column_name = 'email'
  ) then
    update private.ticket_turn_monitor_email_allowlist
      set email_hash = encode(
        sha256(convert_to(lower(trim(email)), 'UTF8')),
        'hex'
      )
      where email_hash is null;

    drop index if exists private.ticket_turn_monitor_email_allowlist_unique;

    alter table private.ticket_turn_monitor_email_allowlist
      drop column email;
  end if;
end;
$$;

alter table private.ticket_turn_monitor_email_allowlist
  alter column email_hash set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'ticket_turn_monitor_email_hash_format'
      and conrelid = 'private.ticket_turn_monitor_email_allowlist'::regclass
  ) then
    alter table private.ticket_turn_monitor_email_allowlist
      add constraint ticket_turn_monitor_email_hash_format
      check (email_hash ~ '^[0-9a-f]{64}$');
  end if;
end;
$$;

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

revoke all on private.ticket_turn_monitor_email_allowlist
  from public, anon, authenticated;
revoke execute on function private.set_ticket_turn_monitor_email_allowlist_updated_at()
  from public, anon, authenticated;
revoke execute on function private.sync_ticket_turn_monitor_roles_for_user(uuid, text)
  from public, anon, authenticated;
revoke execute on function private.sync_ticket_turn_monitor_roles_for_auth_user()
  from public, anon, authenticated;

-- Keep a single permanent QR for the lunch queue. It is an operational
-- identifier, not an authorization secret; identity and per-day uniqueness are
-- enforced independently in the database.
revoke execute on function private.request_lunch_turn(text, text, text, text)
  from public, anon, authenticated;

create or replace function public.request_lunch_turn(
  qr_code_id text,
  _student_code text,
  _student_email text,
  _student_name text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := (select auth.uid());
  service_row public.ticket_turn_services;
  result jsonb;
begin
  if caller_id is null then
    raise exception 'UNAUTHORIZED';
  end if;

  if qr_code_id is distinct from 'lazos-lunch-turns-v1' then
    raise exception 'INVALID_TURN_QR';
  end if;

  select *
    into service_row
    from public.ticket_turn_services
    where code = 'univalle-lunch-main'
      and is_active
    limit 1;

  if service_row.id is null then
    raise exception 'TURN_SERVICE_UNAVAILABLE';
  end if;

  -- Serialize number assignment for this service/day. The legacy function can
  -- safely retain MAX(sequence_number) + 1 once calls share this transaction
  -- lock.
  perform pg_advisory_xact_lock(
    hashtextextended(
      'ticket-turn:'
      || service_row.id::text
      || ':'
      || ((now() at time zone 'America/Bogota')::date)::text,
      0
    )
  );

  select private.request_lunch_turn(
    'lazos-lunch-turns-v1',
    coalesce(
      (select nullif(trim(profile.student_code), '')
       from public.user_profiles profile
       where profile.user_id = caller_id),
      split_part(coalesce(auth.jwt() ->> 'email', caller_id::text), '@', 1)
    ),
    coalesce(auth.jwt() ->> 'email', caller_id::text),
    coalesce(
      (select nullif(trim(profile.first_name || ' ' || profile.last_name), '')
       from public.user_profiles profile
       where profile.user_id = caller_id),
      split_part(coalesce(auth.jwt() ->> 'email', caller_id::text), '@', 1)
    )
  )
  into result;

  return result;
end;
$$;

revoke execute on function public.request_lunch_turn(text, text, text, text)
  from public, anon;
grant execute on function public.request_lunch_turn(text, text, text, text)
  to authenticated;

create or replace function public.assign_special_lunch_turn(
  target_student_code text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := (select auth.uid());
  service_row public.ticket_turn_services;
  student_row public.ticket_turns;
  new_turn public.ticket_turns;
  today date := (now() at time zone 'America/Bogota')::date;
  next_sequence integer;
begin
  if caller_id is null then
    raise exception 'UNAUTHORIZED';
  end if;

  if nullif(trim(target_student_code), '') is null then
    raise exception 'STUDENT_CODE_REQUIRED';
  end if;

  select *
    into service_row
    from public.ticket_turn_services
    where code = 'univalle-lunch-main'
      and is_active
    limit 1;

  if service_row.id is null
     or not private.is_ticket_turn_monitor(service_row.id) then
    raise exception 'FORBIDDEN';
  end if;

  select *
    into student_row
    from public.ticket_turns
    where service_id = service_row.id
      and student_code = trim(target_student_code)
    order by assigned_at desc
    limit 1;

  if student_row.id is null then
    raise exception 'STUDENT_NOT_FOUND';
  end if;

  perform pg_advisory_xact_lock(
    hashtextextended(
      'ticket-turn:' || service_row.id::text || ':' || today::text,
      0
    )
  );

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
    student_row.user_id,
    student_row.student_code,
    student_row.student_email,
    student_row.student_name,
    today,
    next_sequence,
    private.ticket_turn_code_from_sequence(next_sequence) || 'E',
    'activo',
    true,
    now(),
    now() + interval '30 minutes'
  )
  returning * into new_turn;

  return jsonb_build_object(
    'ok', true,
    'turnCode', new_turn.turn_code,
    'turnId', new_turn.id
  );
end;
$$;

revoke execute on function public.assign_special_lunch_turn(text)
  from public, anon;
grant execute on function public.assign_special_lunch_turn(text)
  to authenticated;

create or replace function public.call_next_lunch_turn()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := (select auth.uid());
  service_row public.ticket_turn_services;
  next_turn public.ticket_turns;
  today date := (now() at time zone 'America/Bogota')::date;
begin
  if caller_id is null then
    raise exception 'UNAUTHORIZED';
  end if;

  select *
    into service_row
    from public.ticket_turn_services
    where code = 'univalle-lunch-main'
      and is_active
    limit 1;

  if service_row.id is null
     or not private.is_ticket_turn_monitor(service_row.id) then
    raise exception 'FORBIDDEN';
  end if;

  perform pg_advisory_xact_lock(
    hashtextextended(
      'ticket-turn-call-next:' || service_row.id::text || ':' || today::text,
      0
    )
  );

  select *
    into next_turn
    from public.ticket_turns
    where service_id = service_row.id
      and turn_date = today
      and status = 'activo'
      and not coalesce(is_paused, false)
    order by sequence_number
    limit 1
    for update;

  if next_turn.id is null then
    raise exception 'NO_ACTIVE_TURNS';
  end if;

  update public.ticket_turns
    set status = 'en_fila'
    where id = next_turn.id
    returning * into next_turn;

  return jsonb_build_object(
    'ok', true,
    'turnCode', next_turn.turn_code,
    'turnId', next_turn.id
  );
end;
$$;

revoke execute on function public.call_next_lunch_turn()
  from public, anon;
grant execute on function public.call_next_lunch_turn()
  to authenticated;
