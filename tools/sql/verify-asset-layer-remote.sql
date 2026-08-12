select json_build_object(
  'tables_present', (
    select count(*)
    from information_schema.tables
    where table_schema = 'public'
      and table_name in (
        'asset_layer_organizations',
        'asset_layer_members',
        'asset_layer_assets',
        'asset_layer_evidence',
        'asset_layer_passports',
        'asset_layer_verifications',
        'asset_layer_custody_events',
        'asset_layer_transformations',
        'asset_layer_certificates',
        'asset_layer_redemptions',
        'asset_layer_events',
        'asset_layer_outbox'
      )
  ),
  'rls_enabled', (
    select count(*)
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relrowsecurity
      and c.relname in (
        'asset_layer_organizations',
        'asset_layer_members',
        'asset_layer_assets',
        'asset_layer_evidence',
        'asset_layer_passports',
        'asset_layer_verifications',
        'asset_layer_custody_events',
        'asset_layer_transformations',
        'asset_layer_certificates',
        'asset_layer_redemptions',
        'asset_layer_events',
        'asset_layer_outbox'
      )
  ),
  'public_view_present', to_regclass('public.asset_layer_public_passports') is not null,
  'transform_rpc_present', to_regprocedure(
    'public.transform_asset_layer_lot(uuid,text,text,bigint,bigint,text,text,text)'
  ) is not null,
  'evidence_bucket_private', exists (
    select 1
    from storage.buckets
    where id = 'asset-layer-evidence'
      and public = false
  ),
  'lazostech_root', (
    select json_build_object(
      'organization_id', id,
      'slug', slug,
      'chain_id', chain_id,
      'root_address', root_address,
      'priority_material', priority_material,
      'material_scope', material_scope,
      'active', is_active
    )
    from public.asset_layer_organizations
    where id = '6dbfbbe9-d271-4c10-a1bd-2cda227d2453'::uuid
  ),
  'pilot_counts', json_build_object(
    'members', (select count(*) from public.asset_layer_members),
    'assets', (select count(*) from public.asset_layer_assets),
    'outbox_pending', (
      select count(*)
      from public.asset_layer_outbox
      where status = 'pending'
    )
  )
) as asset_layer_remote_verification;
