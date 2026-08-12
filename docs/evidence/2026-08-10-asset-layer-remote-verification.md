# Asset Layer remote verification — 2026-08-10

Scope: read-only verification of the linked Supabase project. This evidence
confirms technical deployment; it does not establish operational adoption or
TRL 8/9.

## Verified results

- Supabase CLI: `2.109.1`.
- Local and remote migration histories match through
  `20260809035003_asset_layer_enterprise_pilot.sql` (15/15 timestamps aligned).
- LazosTech root is active on Base Sepolia (`chain_id = 84532`).
- Root address: `0x6DbfbbE9d2719C10aA1BD2Cda227d2453E1F16F7`.
- Twelve Asset Layer tables are present and all twelve report RLS enabled.
- The evidence bucket exists and is private.
- The public passport view and `transform_asset_layer_lot` RPC are present.
- Current pilot counts: 0 assets, 1 member, 0 pending outbox records.

## Commands

```powershell
npm.cmd run readiness:asset-layer
.\node_modules\.bin\supabase.cmd migration list --linked
.\node_modules\.bin\supabase.cmd db query --linked --file tools\sql\verify-asset-layer-remote.sql
```

## Result

- Local artifact readiness: `READY (16/16)`.
- Remote schema readiness: verified.
- Live role bootstrap, relayer execution, creation of the first asset, lifecycle
  transitions, evidence upload and public-passport verification remain pending.
- Security/Performance Advisors and an isolated backup-restore drill remain
  pending and are not claimed by this document.
