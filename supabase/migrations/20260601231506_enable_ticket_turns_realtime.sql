do $$
begin
  alter publication supabase_realtime add table public.ticket_turns;
exception
  when duplicate_object then null;
end;
$$;
