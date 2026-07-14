create index if not exists ticket_turn_events_actor_user_id_idx
  on public.ticket_turn_events (actor_user_id);
create index if not exists ticket_turn_events_service_id_idx
  on public.ticket_turn_events (service_id);
create index if not exists ticket_turn_events_turn_id_idx
  on public.ticket_turn_events (turn_id);
create index if not exists ticket_turn_monitor_roles_service_id_idx
  on public.ticket_turn_monitor_roles (service_id);
create index if not exists ticket_turn_reactivations_service_id_idx
  on public.ticket_turn_reactivations (service_id);
create index if not exists ticket_turn_reactivations_turn_id_idx
  on public.ticket_turn_reactivations (turn_id);
create index if not exists ticket_turns_user_id_idx
  on public.ticket_turns (user_id);
create index if not exists token_rewards_recycling_event_id_idx
  on public.token_rewards (recycling_event_id);

drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles for insert
  to authenticated
  with check ((select auth.uid()) = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

drop policy if exists "Users can view own recycling events" on public.recycling_events;
create policy "Users can view own recycling events"
  on public.recycling_events for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can create own recycling events" on public.recycling_events;
create policy "Users can create own recycling events"
  on public.recycling_events for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can view own token rewards" on public.token_rewards;
create policy "Users can view own token rewards"
  on public.token_rewards for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "users can read their own monitor roles" on public.ticket_turn_monitor_roles;
create policy "users can read their own monitor roles"
  on public.ticket_turn_monitor_roles for select
  to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "monitors can read assigned service turns" on public.ticket_turns;
drop policy if exists "students can read their own turns" on public.ticket_turns;
create policy "users can read permitted turns"
  on public.ticket_turns for select
  to authenticated
  using (
    user_id = (select auth.uid())
    or private.is_ticket_turn_monitor(service_id)
  );

drop policy if exists "monitors can read assigned service reactivations" on public.ticket_turn_reactivations;
drop policy if exists "students can read their own reactivations" on public.ticket_turn_reactivations;
create policy "users can read permitted reactivations"
  on public.ticket_turn_reactivations for select
  to authenticated
  using (
    user_id = (select auth.uid())
    or private.is_ticket_turn_monitor(service_id)
  );

drop policy if exists "monitors can read assigned service events" on public.ticket_turn_events;
drop policy if exists "users can read events for their own turns" on public.ticket_turn_events;
create policy "users can read permitted turn events"
  on public.ticket_turn_events for select
  to authenticated
  using (
    private.is_ticket_turn_monitor(service_id)
    or exists (
      select 1
      from public.ticket_turns turn_row
      where turn_row.id = ticket_turn_events.turn_id
        and turn_row.user_id = (select auth.uid())
    )
  );
