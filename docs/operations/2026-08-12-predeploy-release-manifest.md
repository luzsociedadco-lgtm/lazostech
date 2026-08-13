# NUDOS predeploy release manifest - 2026-08-12

Status: prepared for isolated alternate-index staging; not a Mainnet deployment
authorization.

This manifest isolates the NUDOS Mainnet-predeploy and LazosTech Asset Layer
work from unrelated changes currently present in the mixed worktree. It is the
authoritative staging scope once GitHub authentication is restored.

## Release scope

- Mainnet readiness checker, configuration, CI checks, and cutover runbook;
- fixed-supply NUDOS token, allocation policy, deployment scripts, and tests;
- Diamond deployment-size remediation and production-readiness tests;
- Base Mainnet Safe and recovery evidence;
- RPC failover checks, chain-health monitor, cron, and operational runbooks;
- audit handoff/outreach, legal checklist and draft public review pages,
  emergency policy, technical tabletop and acceptance worksheet;
- Asset Layer migration, API, operator UI, public passport, relayer, role
  bootstrap, remote verifier, and readiness checker;
- Supabase advisor remediation and the matching remote migration;
- frontend dependency lockfile remediation and Vercel configuration.

## Explicit staging paths

The release may stage only reviewed changes under these paths:

```text
.github/workflows/ci.yml
.gitignore
TOKENOMICS.md
config/mainnet-readiness.json
docs/audits/
docs/evidence/
docs/legal/
docs/operations/
docs/policies/
docs/runbooks/asset-layer-lazostech-pilot.md
docs/runbooks/chain-health-monitor.md
docs/runbooks/incident-response.md
docs/runbooks/mainnet-cutover.md
docs/runbooks/supabase-backup-restore-drill.md
foundry.toml
lazos-frontend/.env.example
lazos-frontend/app/api/asset-layer/
lazos-frontend/app/api/ops/
lazos-frontend/app/components/AppAuthGate.tsx
lazos-frontend/app/components/FooterNav.tsx
lazos-frontend/app/globals.css
lazos-frontend/app/legal/
lazos-frontend/app/lib/asset-layer/
lazos-frontend/app/lib/ops/
lazos-frontend/app/reciclaje/lotes/
lazos-frontend/app/reciclaje/operacion/
lazos-frontend/app/reciclaje/page.tsx
lazos-frontend/package-lock.json
lazos-frontend/package.json
lazos-frontend/src/config/network.ts
lazos-frontend/vercel.json
package.json
script/DeployMainnetDiamond.s.sol
script/DeployNudosToken.s.sol
script/DeployPilotDiamond.s.sol
script/DeployPilotNudosToken.s.sol
script/NudosDeploymentBase.s.sol
script/ValidateMainnetDeployment.s.sol
src/diamond/NudosFacetCutFactory.sol
src/diamond/SelectorLib.sol
src/facets/core/OwnershipFacet.sol
src/facets/economy/RewardFacet.sol
src/facets/economy/TreasuryFacet.sol
src/facets/governance/university-governance/UniversityGovernanceFacet.sol
src/facets/recycling/RecycleFacet.sol
src/init/DiamondInit.sol
src/interfaces/core/IERC20Minimal.sol
src/interfaces/core/INudosToken.sol
src/libraries/AppStorage.sol
src/token/
supabase/migrations/20260809035003_asset_layer_enterprise_pilot.sql
supabase/migrations/20260812143318_asset_layer_fk_indexes.sql
test/DiamondProductionReadiness.t.sol
test/MainnetSafeValidation.t.sol
test/NudosEconomyCriticalFlows.t.sol
test/NudosToken.t.sol
tools/asset-layer-role-setup.html
tools/check-asset-layer-integration.mjs
tools/check-mainnet-readiness.mjs
tools/check-rpc-operations.mjs
tools/preflight-supabase-restore-drill.mjs
tools/serve-asset-layer-role-setup.mjs
tools/sql/
tools/test-chain-health-monitor.mjs
```

Before staging, each tracked file must be reviewed again for overlap with user
changes. Globs are documentation shorthand only; the actual `git add` command
must enumerate resolved files and must not use `git add -A`.

## Explicit exclusions

The following paths are unrelated to this release and must remain unstaged:

```text
datahub-campus-agent/
shipaton-unimarket-public/
tmp/datahub-agent-video/
tmp/render_datahub_agent_video.mjs
tmp/render_shipaton_video.mjs
tmp/shipaton-video/
lazos-frontend/app/marketplace/page.tsx
ROADMAP.md
lazos-frontend/app/providers/WagmiWrapper.tsx
lazos-frontend/supabase/.temp/
```

Any line-ending-only change must also be excluded after checking its actual
diff. `lazos-frontend/src/config/network.ts` is included only if its reviewed
Mainnet RPC policy diff is substantive.

## Required publish sequence

1. Restore GitHub CLI authentication for the intended repository account.
2. Recheck every included diff and all exclusions.
3. Stage only the resolved manifest paths and inspect `git diff --staged`.
4. Run the complete validation suite from the staged/frozen state.
5. Commit on a dedicated predeploy branch and push it.
6. Open a draft pull request and require review before merging or deploying.

Publication of this release is not authorization to deploy contracts to Base
Mainnet. Mainnet deployment retains its separate explicit `GO MAINNET` gate.
