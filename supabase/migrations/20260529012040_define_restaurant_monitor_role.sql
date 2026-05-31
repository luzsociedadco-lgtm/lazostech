alter table public.ticket_turn_monitor_roles
  drop constraint if exists ticket_turn_monitor_roles_role_check;

update public.ticket_turn_monitor_roles
set role = 'restaurant_monitor'
where role = 'monitor';

alter table public.ticket_turn_monitor_roles
  add constraint ticket_turn_monitor_roles_role_check
  check (role in ('restaurant_monitor', 'admin'));

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
      and role_row.role in ('restaurant_monitor', 'admin')
  );
$$;
