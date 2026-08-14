# NUDOS external security audit handoff - 2026-08-12

Status: **PREPARATION COMPLETE; INDEPENDENT AUDIT NOT STARTED**.

This document is an audit request package, not an audit report or approval. An
independent reviewer must receive a frozen, clean commit and issue the final
report.

## Candidate release

- Repository: `luzsociedadco-lgtm/lazostech`
- Release branch: `agent/nudos-pre-mainnet-gates`
- Frozen audit code/review commit:
  `9bfd866d1947acd6f8147ce3d886353bc7dc9eee`
- Local release-evidence head verified on 2026-08-14 UTC:
  `eb97d1802` (documentation/configuration/evidence only after the frozen code
  commit; publication to the remote branch remains pending explicit approval).
- Parent `origin/main`:
  `bcceb496b38dbd0ffad1264cb7fd2a08c5e1d653`
- Frozen validation worktree: **CLEAN**

The audit scope is the frozen commit above. Later documentation-only commits
may link this identifier but do not change the audited code tree. Any source,
configuration or deployment-script change requires a new frozen commit and an
auditor-approved delta/retest.

## Required smart-contract scope

- `src/diamond/Diamond.sol`
- `src/diamond/NudosFacetCutFactory.sol`
- `src/diamond/SelectorLib.sol`
- `src/facets/core/`
- `src/facets/economy/`
- `src/facets/governance/`
- `src/facets/impact/`
- `src/facets/machines/`
- `src/facets/marketplace/`
- `src/facets/profile/`
- `src/facets/recycling/`
- `src/init/DiamondInit.sol`
- `src/interfaces/`
- `src/libraries/`
- `src/storage/`
- `src/token/NudosToken.sol`
- `script/DeployMainnetDiamond.s.sol`
- `script/DeployNudosToken.s.sol`
- `script/NudosDeploymentBase.s.sol`
- `script/ValidateMainnetDeployment.s.sol`
- all Foundry tests used by the frozen release

Files ending in `.bak` are legacy artifacts and must not be compiled or treated
as deployment authority. The auditor should confirm the compiler input and
deployed bytecode manifest exclude them.

## Offchain integration review

Review the frontend/server surfaces that can propose or relay privileged
actions, including wallet chain selection, contract ABI/address configuration,
server-side operator custody, Asset Layer relaying, cron authorization, and the
chain-health monitor. Confirm that no signing key or RPC/database credential is
client-visible or committed.

## Priority threat model

1. Unauthorized Diamond cuts, selector collisions, ownership transfer, or
   storage-layout corruption.
2. Privilege escalation through `systemAdmin`, university, corporate,
   treasury, reward, machine, recycling, or governance roles.
3. Reentrancy, incorrect accounting, double rewards, replay, rounding, and
   denial-of-service across economic flows.
4. Token supply/distribution divergence from the fixed-supply policy.
5. Unsafe initialization, partial deployment, incorrect Safe ownership, or
   chain/address confusion.
6. Server-side signer compromise, secret exposure, relayer abuse, and failure
   to stop offchain writes during an incident.
7. Event/indexing or database reconciliation assumptions that could present
   incorrect state as final.

## Evidence available to the auditor

- Base Mainnet 2-of-3 Safe creation and recovery rehearsal evidence.
- Base Sepolia 2-of-3 Safe operator rotation and atomic Diamond
  add/replace/rollback/removal evidence.
- 27 passing Foundry tests across 5 suites on 2026-08-12.
- Stateful invariant and critical-flow coverage, with the limitations recorded
  in `docs/evidence/2026-08-10-foundry-coverage.md`.
- Post-fix EIP-170 size report with all deployable contracts under the runtime
  limit; the previously oversized facet factory is now an internal library.
- Production RPC failover, authenticated monitoring and observed alert
  delivery.
- Isolated Supabase roles, schema, data and migration-history restore drill.
- TypeScript verification and dependency audit results recorded in
  `docs/evidence/2026-08-12-local-predeploy-verification.md`.
- Token policy and approved economic schedule documentation.
- Four cryptographically verified operations-role acceptances and the recorded
  41-minute-22-second Safe recovery timing gap.
- Base Mainnet block `49942092` non-broadcast deployment dry-run for the
  canonical Diamond and fixed-supply token scripts.

## Known limitations to report, not suppress

- Overall coverage remains low: 29.75% lines, 27.66% statements, 3.90%
  branches, and 29.52% functions in the last measured report.
- Operations roles are accepted, but the timed incident retest, legal review,
  Mainnet deployment, explorer verification, and Mainnet E2E are incomplete.
- The latest production build attempt timed out locally and is inconclusive;
  the last recorded successful build predates the new monitoring route.
- Foundry emits existing lint/compiler warnings for unused return names,
  restrictable mutability, unwrapped modifier logic, hashing efficiency, and
  test naming/casts; the independent review should classify each warning.

## Required audit deliverables

- auditor identity, independence statement, dates, frozen commit hash, compiler
  and tool versions, and exact in-scope files;
- architecture and privilege assessment;
- findings with severity, exploit scenario, affected code, remediation, and
  retest status;
- storage-layout and selector-collision review;
- deployment/initialization and Safe ownership review;
- final report with zero unresolved critical or high findings.

Only after the independent final report is archived may
`audit.status`, `audit.reportPath`, and finding counts be updated. Internal
testing cannot close the external-audit gate.
