create schema if not exists private;

create table if not exists public.asset_layer_organizations (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  legal_name text not null check (char_length(legal_name) between 2 and 160),
  enterprise_id bigint not null check (enterprise_id > 0),
  root_address text not null check (root_address ~ '^0x[0-9A-Fa-f]{40}$'),
  chain_id bigint not null check (chain_id > 0),
  priority_material text not null,
  material_scope text[] not null check (cardinality(material_scope) > 0),
  base_unit text not null default 'g' check (base_unit = 'g'),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (chain_id, root_address, enterprise_id)
);

create table if not exists public.asset_layer_members (
  organization_id uuid not null references public.asset_layer_organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('admin', 'operator', 'verifier', 'auditor', 'viewer')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (organization_id, user_id, role)
);

create table if not exists public.asset_layer_assets (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.asset_layer_organizations(id) on delete restrict,
  asset_ref text not null check (asset_ref ~ '^[A-Z0-9][A-Z0-9._-]{4,79}$'),
  material_type text not null,
  quantity_grams bigint not null check (quantity_grams > 0),
  origin_general text not null check (char_length(origin_general) between 2 and 240),
  origin_digest text not null check (origin_digest ~ '^0x[0-9A-Fa-f]{64}$'),
  metadata_uri text not null check (char_length(metadata_uri) between 3 and 500),
  current_custodian text not null check (char_length(current_custodian) between 2 and 160),
  status text not null default 'registered'
    check (status in ('registered', 'verified', 'in_custody', 'transformed', 'certified', 'redeemed', 'suspended')),
  passport_version integer not null default 0 check (passport_version >= 0),
  passport_digest text check (passport_digest is null or passport_digest ~ '^0x[0-9A-Fa-f]{64}$'),
  certificate_id uuid,
  chain_asset_id bigint check (chain_asset_id is null or chain_asset_id > 0),
  chain_tx_hash text check (chain_tx_hash is null or chain_tx_hash ~ '^0x[0-9A-Fa-f]{64}$'),
  anchor_status text not null default 'pending'
    check (anchor_status in ('pending', 'processing', 'confirmed', 'failed', 'not_required')),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  redeemed_at timestamptz,
  unique (organization_id, asset_ref),
  unique (organization_id, chain_asset_id)
);

create table if not exists public.asset_layer_evidence (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.asset_layer_organizations(id) on delete restrict,
  asset_id uuid not null references public.asset_layer_assets(id) on delete restrict,
  evidence_type text not null check (char_length(evidence_type) between 2 and 80),
  digest text not null check (digest ~ '^0x[0-9A-Fa-f]{64}$'),
  storage_path text not null check (char_length(storage_path) between 3 and 500),
  content_type text,
  recorded_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (asset_id, digest)
);

create table if not exists public.asset_layer_passports (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.asset_layer_organizations(id) on delete restrict,
  asset_id uuid not null references public.asset_layer_assets(id) on delete restrict,
  version integer not null check (version > 0),
  metadata_digest text not null check (metadata_digest ~ '^0x[0-9A-Fa-f]{64}$'),
  metadata_uri text not null check (char_length(metadata_uri) between 3 and 500),
  issued_by uuid not null references auth.users(id) on delete restrict,
  issued_at timestamptz not null default now(),
  unique (asset_id, version)
);

create table if not exists public.asset_layer_verifications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.asset_layer_organizations(id) on delete restrict,
  asset_id uuid not null references public.asset_layer_assets(id) on delete restrict,
  verification_type text not null check (char_length(verification_type) between 2 and 80),
  verified_quantity_grams bigint not null check (verified_quantity_grams > 0),
  approved boolean not null,
  evidence_digest text not null check (evidence_digest ~ '^0x[0-9A-Fa-f]{64}$'),
  evidence_uri text not null check (char_length(evidence_uri) between 3 and 500),
  verified_by uuid not null references auth.users(id) on delete restrict,
  verified_at timestamptz not null default now()
);

create table if not exists public.asset_layer_custody_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.asset_layer_organizations(id) on delete restrict,
  asset_id uuid not null references public.asset_layer_assets(id) on delete restrict,
  from_custodian text not null check (char_length(from_custodian) between 2 and 160),
  to_custodian text not null check (char_length(to_custodian) between 2 and 160),
  manifest_digest text not null check (manifest_digest ~ '^0x[0-9A-Fa-f]{64}$'),
  manifest_uri text not null check (char_length(manifest_uri) between 3 and 500),
  recorded_by uuid not null references auth.users(id) on delete restrict,
  recorded_at timestamptz not null default now()
);

create table if not exists public.asset_layer_transformations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.asset_layer_organizations(id) on delete restrict,
  input_asset_id uuid not null references public.asset_layer_assets(id) on delete restrict,
  output_asset_id uuid not null references public.asset_layer_assets(id) on delete restrict,
  input_quantity_grams bigint not null check (input_quantity_grams > 0),
  output_quantity_grams bigint not null check (output_quantity_grams > 0),
  rejected_quantity_grams bigint not null check (rejected_quantity_grams >= 0),
  evidence_digest text not null check (evidence_digest ~ '^0x[0-9A-Fa-f]{64}$'),
  evidence_uri text not null check (char_length(evidence_uri) between 3 and 500),
  recorded_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  check (input_asset_id <> output_asset_id),
  check (input_quantity_grams = output_quantity_grams + rejected_quantity_grams),
  unique (input_asset_id)
);

create table if not exists public.asset_layer_certificates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.asset_layer_organizations(id) on delete restrict,
  asset_id uuid not null references public.asset_layer_assets(id) on delete restrict,
  certificate_type text not null check (char_length(certificate_type) between 2 and 80),
  digest text not null check (digest ~ '^0x[0-9A-Fa-f]{64}$'),
  public_uri text not null check (char_length(public_uri) between 3 and 500),
  status text not null default 'issued' check (status in ('issued', 'revoked', 'redeemed')),
  issued_by uuid not null references auth.users(id) on delete restrict,
  issued_at timestamptz not null default now(),
  revoked_at timestamptz,
  unique (asset_id, status) deferrable initially immediate
);

create table if not exists public.asset_layer_redemptions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.asset_layer_organizations(id) on delete restrict,
  asset_id uuid not null references public.asset_layer_assets(id) on delete restrict,
  redemption_digest text not null check (redemption_digest ~ '^0x[0-9A-Fa-f]{64}$'),
  redemption_uri text not null check (char_length(redemption_uri) between 3 and 500),
  redeemed_by uuid not null references auth.users(id) on delete restrict,
  redeemed_at timestamptz not null default now(),
  unique (asset_id)
);

alter table public.asset_layer_assets
  drop constraint if exists asset_layer_assets_certificate_id_fkey;
alter table public.asset_layer_assets
  add constraint asset_layer_assets_certificate_id_fkey
  foreign key (certificate_id) references public.asset_layer_certificates(id) on delete restrict;

create table if not exists public.asset_layer_events (
  id bigint generated always as identity primary key,
  organization_id uuid not null references public.asset_layer_organizations(id) on delete restrict,
  asset_id uuid references public.asset_layer_assets(id) on delete restrict,
  event_type text not null check (char_length(event_type) between 2 and 80),
  actor_user_id uuid references auth.users(id) on delete set null,
  payload jsonb not null default '{}'::jsonb check (jsonb_typeof(payload) = 'object'),
  chain_tx_hash text check (chain_tx_hash is null or chain_tx_hash ~ '^0x[0-9A-Fa-f]{64}$'),
  created_at timestamptz not null default now()
);

create table if not exists public.asset_layer_outbox (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.asset_layer_organizations(id) on delete restrict,
  asset_id uuid references public.asset_layer_assets(id) on delete restrict,
  operation text not null check (operation in ('register', 'passport', 'verify', 'custody', 'transform', 'certificate', 'redeem')),
  idempotency_key text not null unique,
  payload jsonb not null check (jsonb_typeof(payload) = 'object'),
  status text not null default 'pending' check (status in ('pending', 'processing', 'confirmed', 'failed')),
  attempts integer not null default 0 check (attempts >= 0),
  chain_tx_hash text check (chain_tx_hash is null or chain_tx_hash ~ '^0x[0-9A-Fa-f]{64}$'),
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  processed_at timestamptz
);

create table if not exists public.asset_layer_public_passports (
  organization_id uuid not null references public.asset_layer_organizations(id) on delete restrict,
  asset_ref text not null,
  organization_name text not null,
  enterprise_id bigint not null,
  root_address text not null,
  chain_id bigint not null,
  material_type text not null,
  quantity_grams bigint not null,
  origin_general text not null,
  status text not null,
  passport_version integer not null,
  passport_digest text,
  certificate_digest text,
  chain_asset_id bigint,
  chain_tx_hash text,
  updated_at timestamptz not null,
  primary key (organization_id, asset_ref)
);

create index if not exists asset_layer_members_user_idx
  on public.asset_layer_members (user_id, organization_id) where is_active;
create index if not exists asset_layer_assets_org_updated_idx
  on public.asset_layer_assets (organization_id, updated_at desc);
create index if not exists asset_layer_assets_created_by_idx
  on public.asset_layer_assets (created_by);
create index if not exists asset_layer_assets_certificate_idx
  on public.asset_layer_assets (certificate_id) where certificate_id is not null;
create index if not exists asset_layer_evidence_org_asset_idx
  on public.asset_layer_evidence (organization_id, asset_id);
create index if not exists asset_layer_evidence_recorded_by_idx
  on public.asset_layer_evidence (recorded_by);
create index if not exists asset_layer_passports_org_asset_idx
  on public.asset_layer_passports (organization_id, asset_id);
create index if not exists asset_layer_passports_issued_by_idx
  on public.asset_layer_passports (issued_by);
create index if not exists asset_layer_verifications_org_asset_idx
  on public.asset_layer_verifications (organization_id, asset_id, verified_at desc);
create index if not exists asset_layer_verifications_verified_by_idx
  on public.asset_layer_verifications (verified_by);
create index if not exists asset_layer_custody_org_asset_idx
  on public.asset_layer_custody_events (organization_id, asset_id, recorded_at desc);
create index if not exists asset_layer_custody_recorded_by_idx
  on public.asset_layer_custody_events (recorded_by);
create index if not exists asset_layer_transformations_org_output_idx
  on public.asset_layer_transformations (organization_id, output_asset_id);
create index if not exists asset_layer_transformations_recorded_by_idx
  on public.asset_layer_transformations (recorded_by);
create index if not exists asset_layer_certificates_org_asset_idx
  on public.asset_layer_certificates (organization_id, asset_id);
create index if not exists asset_layer_certificates_issued_by_idx
  on public.asset_layer_certificates (issued_by);
create index if not exists asset_layer_redemptions_org_asset_idx
  on public.asset_layer_redemptions (organization_id, asset_id);
create index if not exists asset_layer_redemptions_redeemed_by_idx
  on public.asset_layer_redemptions (redeemed_by);
create index if not exists asset_layer_events_asset_created_idx
  on public.asset_layer_events (asset_id, created_at desc);
create index if not exists asset_layer_events_org_created_idx
  on public.asset_layer_events (organization_id, created_at desc);
create index if not exists asset_layer_events_actor_idx
  on public.asset_layer_events (actor_user_id) where actor_user_id is not null;
create index if not exists asset_layer_outbox_pending_idx
  on public.asset_layer_outbox (status, created_at) where status in ('pending', 'failed');
create index if not exists asset_layer_outbox_org_asset_idx
  on public.asset_layer_outbox (organization_id, asset_id);

create or replace function private.is_asset_layer_member(
  target_organization_id uuid,
  allowed_roles text[] default array['admin', 'operator', 'verifier', 'auditor', 'viewer']::text[]
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.asset_layer_members member_row
    where member_row.organization_id = target_organization_id
      and member_row.user_id = (select auth.uid())
      and member_row.is_active
      and member_row.role = any (allowed_roles)
  );
$$;

create or replace function private.asset_layer_storage_organization(object_name text)
returns uuid
language sql
stable
security invoker
set search_path = ''
as $$
  select case
    when (storage.foldername(object_name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
      then ((storage.foldername(object_name))[1])::uuid
    else null
  end;
$$;

create or replace function private.set_asset_layer_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function private.audit_asset_layer_asset()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  next_event_type text;
begin
  if tg_op = 'INSERT' then
    next_event_type := 'asset_registered';
  elsif old.status is distinct from new.status then
    next_event_type := 'status_' || new.status;
  elsif old.passport_version is distinct from new.passport_version then
    next_event_type := 'passport_issued';
  elsif old.current_custodian is distinct from new.current_custodian then
    next_event_type := 'custody_transferred';
  elsif old.anchor_status is distinct from new.anchor_status then
    next_event_type := 'anchor_' || new.anchor_status;
  else
    return new;
  end if;

  insert into public.asset_layer_events (
    organization_id,
    asset_id,
    event_type,
    actor_user_id,
    payload,
    chain_tx_hash
  ) values (
    new.organization_id,
    new.id,
    next_event_type,
    (select auth.uid()),
    jsonb_strip_nulls(jsonb_build_object(
      'assetRef', new.asset_ref,
      'status', new.status,
      'quantityGrams', new.quantity_grams,
      'passportVersion', new.passport_version,
      'custodian', new.current_custodian,
      'anchorStatus', new.anchor_status
    )),
    new.chain_tx_hash
  );

  return new;
end;
$$;

create or replace function private.project_asset_layer_passport()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.asset_layer_public_passports (
    organization_id,
    asset_ref,
    organization_name,
    enterprise_id,
    root_address,
    chain_id,
    material_type,
    quantity_grams,
    origin_general,
    status,
    passport_version,
    passport_digest,
    certificate_digest,
    chain_asset_id,
    chain_tx_hash,
    updated_at
  )
  select
    new.organization_id,
    new.asset_ref,
    organization_row.legal_name,
    organization_row.enterprise_id,
    organization_row.root_address,
    organization_row.chain_id,
    new.material_type,
    new.quantity_grams,
    new.origin_general,
    new.status,
    new.passport_version,
    new.passport_digest,
    certificate_row.digest,
    new.chain_asset_id,
    new.chain_tx_hash,
    new.updated_at
  from public.asset_layer_organizations organization_row
  left join public.asset_layer_certificates certificate_row on certificate_row.id = new.certificate_id
  where organization_row.id = new.organization_id
  on conflict (organization_id, asset_ref) do update set
    organization_name = excluded.organization_name,
    enterprise_id = excluded.enterprise_id,
    root_address = excluded.root_address,
    chain_id = excluded.chain_id,
    material_type = excluded.material_type,
    quantity_grams = excluded.quantity_grams,
    origin_general = excluded.origin_general,
    status = excluded.status,
    passport_version = excluded.passport_version,
    passport_digest = excluded.passport_digest,
    certificate_digest = excluded.certificate_digest,
    chain_asset_id = excluded.chain_asset_id,
    chain_tx_hash = excluded.chain_tx_hash,
    updated_at = excluded.updated_at;

  return new;
end;
$$;

create or replace function private.enqueue_asset_layer_operation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  operation_name text;
  target_asset_id uuid;
  target_organization_id uuid;
  row_payload jsonb;
begin
  row_payload := to_jsonb(new);
  operation_name := case tg_table_name
    when 'asset_layer_assets' then 'register'
    when 'asset_layer_passports' then 'passport'
    when 'asset_layer_verifications' then 'verify'
    when 'asset_layer_custody_events' then 'custody'
    when 'asset_layer_transformations' then 'transform'
    when 'asset_layer_certificates' then 'certificate'
    when 'asset_layer_redemptions' then 'redeem'
    else null
  end;

  if operation_name is null then
    return new;
  end if;

  if tg_table_name = 'asset_layer_assets' and row_payload ->> 'anchor_status' = 'not_required' then
    return new;
  end if;

  target_organization_id := (row_payload ->> 'organization_id')::uuid;
  target_asset_id := coalesce(
    (row_payload ->> 'input_asset_id')::uuid,
    (row_payload ->> 'asset_id')::uuid,
    (row_payload ->> 'id')::uuid
  );

  insert into public.asset_layer_outbox (
    organization_id,
    asset_id,
    operation,
    idempotency_key,
    payload
  ) values (
    target_organization_id,
    target_asset_id,
    operation_name,
    tg_table_name || ':' || new.id::text,
    row_payload
  ) on conflict (idempotency_key) do nothing;

  if tg_table_name <> 'asset_layer_assets' then
    update public.asset_layer_assets
    set anchor_status = 'pending'
    where id = target_asset_id;
  end if;

  return new;
end;
$$;

create or replace function private.apply_asset_layer_passport()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.asset_layer_assets
  set passport_version = new.version,
      passport_digest = new.metadata_digest
  where id = new.asset_id
    and organization_id = new.organization_id
    and status not in ('redeemed', 'transformed');

  if not found then
    raise exception 'El lote no admite un nuevo pasaporte';
  end if;
  return new;
end;
$$;

create or replace function private.apply_asset_layer_verification()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  expected_quantity bigint;
begin
  select quantity_grams into expected_quantity
  from public.asset_layer_assets
  where id = new.asset_id and organization_id = new.organization_id
  for update;

  if expected_quantity is null then
    raise exception 'Lote no encontrado';
  end if;
  if new.approved and new.verified_quantity_grams <> expected_quantity then
    raise exception 'La verificación aprobada debe coincidir con el peso del lote';
  end if;

  update public.asset_layer_assets
  set status = case when new.approved then 'verified' else 'suspended' end
  where id = new.asset_id
    and status in ('registered', 'suspended');

  if not found then
    raise exception 'El lote no admite esta verificación';
  end if;
  return new;
end;
$$;

create or replace function private.apply_asset_layer_custody()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.asset_layer_assets
  set current_custodian = new.to_custodian,
      status = 'in_custody'
  where id = new.asset_id
    and organization_id = new.organization_id
    and current_custodian = new.from_custodian
    and status = 'verified';

  if not found then
    raise exception 'La custodia cambió o el lote no está verificado';
  end if;
  return new;
end;
$$;

create or replace function private.apply_asset_layer_transformation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.asset_layer_assets
  set status = 'transformed'
  where id = new.input_asset_id
    and organization_id = new.organization_id
    and quantity_grams = new.input_quantity_grams
    and status = 'in_custody';

  if not found then
    raise exception 'El lote de entrada no admite transformación';
  end if;
  return new;
end;
$$;

create or replace function private.apply_asset_layer_certificate()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.asset_layer_assets
  set certificate_id = new.id,
      status = 'certified'
  where id = new.asset_id
    and organization_id = new.organization_id
    and status = 'verified';

  if not found then
    raise exception 'El lote debe estar verificado para certificarse';
  end if;
  return new;
end;
$$;

create or replace function private.apply_asset_layer_redemption()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.asset_layer_assets
  set status = 'redeemed',
      redeemed_at = new.redeemed_at
  where id = new.asset_id
    and organization_id = new.organization_id
    and status = 'certified';

  if not found then
    raise exception 'El lote debe estar certificado y no retirado';
  end if;

  update public.asset_layer_certificates
  set status = 'redeemed'
  where id = (select certificate_id from public.asset_layer_assets where id = new.asset_id);
  return new;
end;
$$;

create or replace function public.transform_asset_layer_lot(
  target_asset_id uuid,
  output_asset_ref text,
  output_material_type text,
  output_quantity_grams bigint,
  rejected_quantity_grams bigint,
  evidence_digest text,
  evidence_uri text,
  output_metadata_uri text
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  input_row public.asset_layer_assets%rowtype;
  output_asset_id uuid;
begin
  select * into input_row
  from public.asset_layer_assets
  where id = target_asset_id
  for update;

  if input_row.id is null then
    raise exception 'Lote de entrada no encontrado';
  end if;
  if input_row.status <> 'in_custody' then
    raise exception 'El lote debe estar bajo custodia antes de transformarse';
  end if;
  if input_row.quantity_grams <> output_quantity_grams + rejected_quantity_grams then
    raise exception 'La transformación debe conservar el balance de masa';
  end if;

  insert into public.asset_layer_assets (
    organization_id,
    asset_ref,
    material_type,
    quantity_grams,
    origin_general,
    origin_digest,
    metadata_uri,
    current_custodian,
    anchor_status,
    created_by
  ) values (
    input_row.organization_id,
    output_asset_ref,
    output_material_type,
    output_quantity_grams,
    input_row.origin_general,
    evidence_digest,
    output_metadata_uri,
    input_row.current_custodian,
    'not_required',
    (select auth.uid())
  ) returning id into output_asset_id;

  insert into public.asset_layer_transformations (
    organization_id,
    input_asset_id,
    output_asset_id,
    input_quantity_grams,
    output_quantity_grams,
    rejected_quantity_grams,
    evidence_digest,
    evidence_uri,
    recorded_by
  ) values (
    input_row.organization_id,
    input_row.id,
    output_asset_id,
    input_row.quantity_grams,
    output_quantity_grams,
    rejected_quantity_grams,
    evidence_digest,
    evidence_uri,
    (select auth.uid())
  );

  return output_asset_id;
end;
$$;

drop trigger if exists set_asset_layer_organizations_updated_at on public.asset_layer_organizations;
create trigger set_asset_layer_organizations_updated_at
  before update on public.asset_layer_organizations
  for each row execute function private.set_asset_layer_updated_at();

drop trigger if exists set_asset_layer_members_updated_at on public.asset_layer_members;
create trigger set_asset_layer_members_updated_at
  before update on public.asset_layer_members
  for each row execute function private.set_asset_layer_updated_at();

drop trigger if exists set_asset_layer_assets_updated_at on public.asset_layer_assets;
create trigger set_asset_layer_assets_updated_at
  before update on public.asset_layer_assets
  for each row execute function private.set_asset_layer_updated_at();

drop trigger if exists audit_asset_layer_assets on public.asset_layer_assets;
create trigger audit_asset_layer_assets
  after insert or update on public.asset_layer_assets
  for each row execute function private.audit_asset_layer_asset();

drop trigger if exists project_asset_layer_passports on public.asset_layer_assets;
create trigger project_asset_layer_passports
  after insert or update on public.asset_layer_assets
  for each row execute function private.project_asset_layer_passport();

drop trigger if exists enqueue_asset_layer_asset_registration on public.asset_layer_assets;
create trigger enqueue_asset_layer_asset_registration
  after insert on public.asset_layer_assets
  for each row execute function private.enqueue_asset_layer_operation();

drop trigger if exists apply_asset_layer_passports on public.asset_layer_passports;
create trigger apply_asset_layer_passports
  after insert on public.asset_layer_passports
  for each row execute function private.apply_asset_layer_passport();
drop trigger if exists enqueue_asset_layer_passports on public.asset_layer_passports;
create trigger enqueue_asset_layer_passports
  after insert on public.asset_layer_passports
  for each row execute function private.enqueue_asset_layer_operation();

drop trigger if exists apply_asset_layer_verifications on public.asset_layer_verifications;
create trigger apply_asset_layer_verifications
  after insert on public.asset_layer_verifications
  for each row execute function private.apply_asset_layer_verification();
drop trigger if exists enqueue_asset_layer_verifications on public.asset_layer_verifications;
create trigger enqueue_asset_layer_verifications
  after insert on public.asset_layer_verifications
  for each row execute function private.enqueue_asset_layer_operation();

drop trigger if exists apply_asset_layer_custody on public.asset_layer_custody_events;
create trigger apply_asset_layer_custody
  after insert on public.asset_layer_custody_events
  for each row execute function private.apply_asset_layer_custody();
drop trigger if exists enqueue_asset_layer_custody on public.asset_layer_custody_events;
create trigger enqueue_asset_layer_custody
  after insert on public.asset_layer_custody_events
  for each row execute function private.enqueue_asset_layer_operation();

drop trigger if exists apply_asset_layer_transformations on public.asset_layer_transformations;
create trigger apply_asset_layer_transformations
  after insert on public.asset_layer_transformations
  for each row execute function private.apply_asset_layer_transformation();
drop trigger if exists enqueue_asset_layer_transformations on public.asset_layer_transformations;
create trigger enqueue_asset_layer_transformations
  after insert on public.asset_layer_transformations
  for each row execute function private.enqueue_asset_layer_operation();

drop trigger if exists apply_asset_layer_certificates on public.asset_layer_certificates;
create trigger apply_asset_layer_certificates
  after insert on public.asset_layer_certificates
  for each row execute function private.apply_asset_layer_certificate();
drop trigger if exists enqueue_asset_layer_certificates on public.asset_layer_certificates;
create trigger enqueue_asset_layer_certificates
  after insert on public.asset_layer_certificates
  for each row execute function private.enqueue_asset_layer_operation();

drop trigger if exists apply_asset_layer_redemptions on public.asset_layer_redemptions;
create trigger apply_asset_layer_redemptions
  after insert on public.asset_layer_redemptions
  for each row execute function private.apply_asset_layer_redemption();
drop trigger if exists enqueue_asset_layer_redemptions on public.asset_layer_redemptions;
create trigger enqueue_asset_layer_redemptions
  after insert on public.asset_layer_redemptions
  for each row execute function private.enqueue_asset_layer_operation();

alter table public.asset_layer_organizations enable row level security;
alter table public.asset_layer_members enable row level security;
alter table public.asset_layer_assets enable row level security;
alter table public.asset_layer_evidence enable row level security;
alter table public.asset_layer_passports enable row level security;
alter table public.asset_layer_verifications enable row level security;
alter table public.asset_layer_custody_events enable row level security;
alter table public.asset_layer_transformations enable row level security;
alter table public.asset_layer_certificates enable row level security;
alter table public.asset_layer_redemptions enable row level security;
alter table public.asset_layer_events enable row level security;
alter table public.asset_layer_outbox enable row level security;
alter table public.asset_layer_public_passports enable row level security;

create policy "members can read asset organizations"
  on public.asset_layer_organizations for select to authenticated
  using (private.is_asset_layer_member(id));

create policy "members can read own asset memberships"
  on public.asset_layer_members for select to authenticated
  using (user_id = (select auth.uid()));

create policy "members can read enterprise assets"
  on public.asset_layer_assets for select to authenticated
  using (private.is_asset_layer_member(organization_id));
create policy "operators can register enterprise assets"
  on public.asset_layer_assets for insert to authenticated
  with check (
    created_by = (select auth.uid())
    and private.is_asset_layer_member(organization_id, array['admin', 'operator']::text[])
  );
create policy "operators can update enterprise assets"
  on public.asset_layer_assets for update to authenticated
  using (private.is_asset_layer_member(organization_id, array['admin', 'operator', 'verifier', 'auditor']::text[]))
  with check (private.is_asset_layer_member(organization_id, array['admin', 'operator', 'verifier', 'auditor']::text[]));

create policy "members can read asset evidence"
  on public.asset_layer_evidence for select to authenticated
  using (private.is_asset_layer_member(organization_id));
create policy "operators can add asset evidence"
  on public.asset_layer_evidence for insert to authenticated
  with check (
    recorded_by = (select auth.uid())
    and private.is_asset_layer_member(organization_id, array['admin', 'operator', 'verifier', 'auditor']::text[])
  );

create policy "members can read asset passports"
  on public.asset_layer_passports for select to authenticated
  using (private.is_asset_layer_member(organization_id));
create policy "operators can issue asset passports"
  on public.asset_layer_passports for insert to authenticated
  with check (
    issued_by = (select auth.uid())
    and private.is_asset_layer_member(organization_id, array['admin', 'operator']::text[])
  );

create policy "members can read asset verifications"
  on public.asset_layer_verifications for select to authenticated
  using (private.is_asset_layer_member(organization_id));
create policy "verifiers can record asset verifications"
  on public.asset_layer_verifications for insert to authenticated
  with check (
    verified_by = (select auth.uid())
    and private.is_asset_layer_member(organization_id, array['admin', 'verifier', 'auditor']::text[])
  );

create policy "members can read custody events"
  on public.asset_layer_custody_events for select to authenticated
  using (private.is_asset_layer_member(organization_id));
create policy "operators can record custody events"
  on public.asset_layer_custody_events for insert to authenticated
  with check (
    recorded_by = (select auth.uid())
    and private.is_asset_layer_member(organization_id, array['admin', 'operator']::text[])
  );

create policy "members can read transformations"
  on public.asset_layer_transformations for select to authenticated
  using (private.is_asset_layer_member(organization_id));
create policy "operators can record transformations"
  on public.asset_layer_transformations for insert to authenticated
  with check (
    recorded_by = (select auth.uid())
    and private.is_asset_layer_member(organization_id, array['admin', 'operator']::text[])
  );

create policy "members can read certificates"
  on public.asset_layer_certificates for select to authenticated
  using (private.is_asset_layer_member(organization_id));
create policy "auditors can issue certificates"
  on public.asset_layer_certificates for insert to authenticated
  with check (
    issued_by = (select auth.uid())
    and private.is_asset_layer_member(organization_id, array['admin', 'auditor']::text[])
  );

create policy "members can read redemptions"
  on public.asset_layer_redemptions for select to authenticated
  using (private.is_asset_layer_member(organization_id));
create policy "operators can redeem assets"
  on public.asset_layer_redemptions for insert to authenticated
  with check (
    redeemed_by = (select auth.uid())
    and private.is_asset_layer_member(organization_id, array['admin', 'operator']::text[])
  );

create policy "members can read asset events"
  on public.asset_layer_events for select to authenticated
  using (private.is_asset_layer_member(organization_id));

create policy "admins can read asset outbox"
  on public.asset_layer_outbox for select to authenticated
  using (private.is_asset_layer_member(organization_id, array['admin', 'operator']::text[]));
create policy "admins can enqueue asset operations"
  on public.asset_layer_outbox for insert to authenticated
  with check (private.is_asset_layer_member(organization_id, array['admin', 'operator', 'verifier', 'auditor']::text[]));
create policy "admins can update asset outbox"
  on public.asset_layer_outbox for update to authenticated
  using (private.is_asset_layer_member(organization_id, array['admin', 'operator']::text[]))
  with check (private.is_asset_layer_member(organization_id, array['admin', 'operator']::text[]));

create policy "public can read asset passports"
  on public.asset_layer_public_passports for select to anon, authenticated
  using (true);

revoke all on public.asset_layer_organizations from anon, authenticated;
revoke all on public.asset_layer_members from anon, authenticated;
revoke all on public.asset_layer_assets from anon, authenticated;
revoke all on public.asset_layer_evidence from anon, authenticated;
revoke all on public.asset_layer_passports from anon, authenticated;
revoke all on public.asset_layer_verifications from anon, authenticated;
revoke all on public.asset_layer_custody_events from anon, authenticated;
revoke all on public.asset_layer_transformations from anon, authenticated;
revoke all on public.asset_layer_certificates from anon, authenticated;
revoke all on public.asset_layer_redemptions from anon, authenticated;
revoke all on public.asset_layer_events from anon, authenticated;
revoke all on public.asset_layer_outbox from anon, authenticated;
revoke all on public.asset_layer_public_passports from anon, authenticated;

grant select on public.asset_layer_organizations to authenticated;
grant select on public.asset_layer_members to authenticated;
grant select, insert on public.asset_layer_assets to authenticated;
grant select, insert on public.asset_layer_evidence to authenticated;
grant select, insert on public.asset_layer_passports to authenticated;
grant select, insert on public.asset_layer_verifications to authenticated;
grant select, insert on public.asset_layer_custody_events to authenticated;
grant select, insert on public.asset_layer_transformations to authenticated;
grant select, insert on public.asset_layer_certificates to authenticated;
grant select, insert on public.asset_layer_redemptions to authenticated;
grant select on public.asset_layer_events to authenticated;
grant select, insert, update on public.asset_layer_outbox to authenticated;
grant select on public.asset_layer_public_passports to anon, authenticated;
grant execute on function public.transform_asset_layer_lot(uuid, text, text, bigint, bigint, text, text, text)
  to authenticated;

revoke execute on function private.is_asset_layer_member(uuid, text[]) from public, anon;
grant execute on function private.is_asset_layer_member(uuid, text[]) to authenticated;
revoke execute on function private.asset_layer_storage_organization(text) from public, anon;
grant execute on function private.asset_layer_storage_organization(text) to authenticated;
revoke execute on function private.set_asset_layer_updated_at() from public, anon, authenticated;
revoke execute on function private.audit_asset_layer_asset() from public, anon, authenticated;
revoke execute on function private.project_asset_layer_passport() from public, anon, authenticated;
revoke execute on function private.enqueue_asset_layer_operation() from public, anon, authenticated;
revoke execute on function private.apply_asset_layer_passport() from public, anon, authenticated;
revoke execute on function private.apply_asset_layer_verification() from public, anon, authenticated;
revoke execute on function private.apply_asset_layer_custody() from public, anon, authenticated;
revoke execute on function private.apply_asset_layer_transformation() from public, anon, authenticated;
revoke execute on function private.apply_asset_layer_certificate() from public, anon, authenticated;
revoke execute on function private.apply_asset_layer_redemption() from public, anon, authenticated;

insert into public.asset_layer_organizations (
  id,
  slug,
  legal_name,
  enterprise_id,
  root_address,
  chain_id,
  priority_material,
  material_scope,
  base_unit,
  is_active
) values (
  '6dbfbbe9-d271-4c10-a1bd-2cda227d2453',
  'lazostech',
  'LazosTech',
  1,
  '0x6DbfbbE9d2719C10aA1BD2Cda227d2453E1F16F7',
  84532,
  'ALUMINUM_POST_CONSUMER',
  array[
    'ALUMINUM_POST_CONSUMER',
    'ALUMINUM_RECYCLED_INGOT',
    'PET_POST_CONSUMER',
    'PET_RECYCLED_FLAKE'
  ]::text[],
  'g',
  true
)
on conflict (id) do update set
  legal_name = excluded.legal_name,
  enterprise_id = excluded.enterprise_id,
  root_address = excluded.root_address,
  chain_id = excluded.chain_id,
  priority_material = excluded.priority_material,
  material_scope = excluded.material_scope,
  base_unit = excluded.base_unit,
  is_active = excluded.is_active,
  updated_at = now();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'asset-layer-evidence',
  'asset-layer-evidence',
  false,
  15728640,
  array['application/pdf', 'image/jpeg', 'image/png', 'text/csv', 'application/json']
)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "asset members can read evidence objects" on storage.objects;
create policy "asset members can read evidence objects"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'asset-layer-evidence'
    and private.is_asset_layer_member(private.asset_layer_storage_organization(name))
  );

drop policy if exists "asset operators can upload evidence objects" on storage.objects;
create policy "asset operators can upload evidence objects"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'asset-layer-evidence'
    and owner_id = (select auth.uid()::text)
    and private.is_asset_layer_member(
      private.asset_layer_storage_organization(name),
      array['admin', 'operator', 'verifier', 'auditor']::text[]
    )
  );

drop policy if exists "asset operators can update evidence objects" on storage.objects;
create policy "asset operators can update evidence objects"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'asset-layer-evidence'
    and owner_id = (select auth.uid()::text)
    and private.is_asset_layer_member(
      private.asset_layer_storage_organization(name),
      array['admin', 'operator', 'verifier', 'auditor']::text[]
    )
  )
  with check (
    bucket_id = 'asset-layer-evidence'
    and owner_id = (select auth.uid()::text)
    and private.is_asset_layer_member(
      private.asset_layer_storage_organization(name),
      array['admin', 'operator', 'verifier', 'auditor']::text[]
    )
  );
