-- Cover every Asset Layer foreign-key column reported by the Supabase advisor.
-- These tables are empty at migration time, so regular transactional index
-- creation is preferable to CREATE INDEX CONCURRENTLY.

create index if not exists asset_layer_custody_events_asset_id_idx
  on public.asset_layer_custody_events (asset_id);

create index if not exists asset_layer_outbox_asset_id_idx
  on public.asset_layer_outbox (asset_id);

create index if not exists asset_layer_transformations_output_asset_id_idx
  on public.asset_layer_transformations (output_asset_id);

create index if not exists asset_layer_verifications_asset_id_idx
  on public.asset_layer_verifications (asset_id);
