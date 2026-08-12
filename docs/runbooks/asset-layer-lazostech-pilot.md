# LazosTech Asset Layer pilot

## Scope

LazosTech is the first enterprise root of Symmetry Asset Layer. The pilot prioritizes post-consumer aluminum and keeps PET enabled. RADIAN, financial tokenization and public token transfers remain disabled.

## Components

- Base Sepolia root: `0x6DbfbbE9d2719C10aA1BD2Cda227d2453E1F16F7`.
- Enterprise ID: `1`.
- Supabase: organizations, memberships, assets, passports, verifications, custody, transformations, certificates, redemptions, audit events and outbox.
- Private evidence bucket: `asset-layer-evidence`.
- Operator route: `/reciclaje/operacion`.
- Public passport: `/reciclaje/lotes/<ASSET_REF>`.
- Relayer route: `/api/asset-layer/relay`, protected by `CRON_SECRET`.

## Deployment order

1. Compare migrations with `npx.cmd supabase migration list --linked`.
2. Review every pending migration, then run `npx.cmd supabase db push --linked --yes`.
3. Run `npm.cmd run verify:asset-layer:remote` and require 12 tables, 12 RLS-enabled tables, a private evidence bucket and the transformation RPC.
4. Configure server-only Vercel variables from `lazos-frontend/.env.example`.
5. Set `ASSET_LAYER_ADMIN_EMAIL_SHA256` to the lowercase administrator email SHA-256. Never store the original email in source control.
6. Sign in with that account and select **Activar administración autorizada**.
7. Configure separate testnet operator and auditor relayer keys. Do not reuse them for mainnet.
8. Trigger the relayer and confirm the transaction in BaseScan.
9. Register one aluminum lot, attach evidence and execute the complete lifecycle.

## Verified remote state

On 2026-08-10, the linked Supabase project returned:

- 12 Asset Layer tables present and 12 with RLS enabled.
- Private `asset-layer-evidence` bucket present.
- Public passport projection and atomic transformation RPC present.
- LazosTech root active on Base Sepolia with aluminum priority and PET enabled.
- One member and zero pilot assets; creation and completion of the first real
  asset lifecycle remain explicit pilot handoffs.

## Required server secrets

- `SUPABASE_SECRET_KEY`
- `ASSET_LAYER_ADMIN_EMAIL_SHA256`
- `ASSET_LAYER_OPERATOR_PRIVATE_KEY`
- `ASSET_LAYER_OPERATOR_WALLET`
- `ASSET_LAYER_AUDITOR_PRIVATE_KEY`
- `ASSET_LAYER_AUDITOR_WALLET`
- `ASSET_LAYER_DEFAULT_CUSTODIAN_WALLET`
- `CRON_SECRET`

None of these variables may use the `NEXT_PUBLIC_` prefix.

The configured public signer addresses are:

- Operator: `0xB4BFd705bd44E5b6e154b55f6198c2b1F5a457eC`.
- Auditor: `0x0e34aA3dFd097Ac3a318B4832B2F094caB28220c`.

The relayer rejects a private key that does not derive the corresponding configured address.

## Stop conditions

- Do not enable the relayer if its signer lacks the corresponding enterprise role.
- Do not move a lot to transformation if output plus rejection differs from input.
- Do not publish private evidence objects; only their digest and authorized metadata are public.
- Do not deploy to mainnet until Safe custody, recovery, monitoring, backup, incident response and external security review are complete.
