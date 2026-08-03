create extension if not exists pg_cron with schema pg_catalog;

grant usage on schema cron to postgres;
grant all privileges on all tables in schema cron to postgres;

with expired as (
  update public.ticket_turns
  set
    status = 'expirado',
    expires_at = coalesce(expires_at, now())
  where status in ('activo', 'en_fila')
    and turn_date < (now() at time zone 'America/Bogota')::date
  returning id, service_id
)
insert into public.ticket_turn_events (
  turn_id,
  service_id,
  actor_user_id,
  event_type,
  payload
)
select
  id,
  service_id,
  null,
  'turn_expired',
  jsonb_build_object(
    'reason', 'daily_rollover_backfill',
    'timezone', 'America/Bogota',
    'closed_at', now()
  )
from expired;

do $$
begin
  if exists (
    select 1
    from cron.job
    where jobname = 'close-stale-ticket-turns-daily'
  ) then
    perform cron.unschedule('close-stale-ticket-turns-daily');
  end if;
end
$$;

select cron.schedule(
  'close-stale-ticket-turns-daily',
  '5 5 * * *',
  $cron$
    with expired as (
      update public.ticket_turns
      set
        status = 'expirado',
        expires_at = coalesce(expires_at, now())
      where status in ('activo', 'en_fila')
        and turn_date < (now() at time zone 'America/Bogota')::date
      returning id, service_id
    )
    insert into public.ticket_turn_events (
      turn_id,
      service_id,
      actor_user_id,
      event_type,
      payload
    )
    select
      id,
      service_id,
      null,
      'turn_expired',
      jsonb_build_object(
        'reason', 'daily_rollover',
        'timezone', 'America/Bogota',
        'closed_at', now()
      )
    from expired;
  $cron$
);
