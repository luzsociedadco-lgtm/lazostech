# NUDOS external security audit handoff - 2026-08-12

Status: **PREPARATION COMPLETE; INDEPENDENT AUDIT NOT STARTED**.

This document is an audit request package, not an audit report or approval. An
independent reviewer must receive a frozen, clean commit and issue the final
report.

## Candidate release

- Repository worktree: `C:\Users\INICIO\lazos-dapp\NUDOS`
- Current branch: `shipaton/unimarket`
- Observed HEAD: `3c94e14aab2483d24f3be2094dcc84ee94f7f3f7`
- Frozen audit commit: **PENDING**
- Worktree state at preparation: **DIRTY (64 porcelain entries)**

The observed HEAD is not declared to be the audit commit. Freeze only the
intended Mainnet sources, deployment inputs, tests, and documentation after
unrelated worktree changes are separated.

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
- 27 passing Foundry tests across 5 suites on 2026-08-12.
- Stateful invariant and critical-flow coverage, with the limitations recorded
  in `docs/evidence/2026-08-10-foundry-coverage.md`.
- Post-fix EIP-170 size report with all deployable contracts under the runtime
  limit; the previously oversized facet factory is now an internal library.
- Local Diamond rollback rehearsal.
- RPC failover and alert-rule self-tests.
- TypeScript verification and dependency audit results recorded in
  `docs/evidence/2026-08-12-local-predeploy-verification.md`.
- Token policy and approved economic schedule documentation.

## Known limitations to report, not suppress

- Overall coverage remains low: 29.75% lines, 27.66% statements, 3.90%
  branches, and 29.52% functions in the last measured report.
- The current Base Sepolia Diamond owner is an EOA, so the pilot does not prove
  Safe-governed operator rotation or Safe-governed rollback.
- Production RPCs, alert delivery, Supabase restore, operations approvals,
  legal review, Mainnet deployment, explorer verification, and Mainnet E2E are
  incomplete.
- The current worktree is not a clean, frozen release.
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
