# Local predeploy verification - 2026-08-12

## Outcome

The local contract and frontend checks below passed, and a deployable protected
chain-health endpoint was added. This evidence does **not** claim a clean
release, independent audit, production monitoring, Supabase disaster-recovery
test, legal approval, or Mainnet deployment.

## Smart contracts

Command:

```powershell
forge test -vv
```

Result: **PASS** - 5 suites, 27 tests passed, 0 failed, 0 skipped.

### Deployment-size blocker found and fixed

The first `forge build --sizes` run failed because
`NudosFacetCutFactory` compiled as a 71,510-byte deployable contract, above the
24,576-byte EIP-170 runtime limit. The canonical Mainnet script instantiated
that contract while broadcasting, so the deployment would have reverted before
installing the facets.

The factory was converted to an internal Solidity library and its deployment
and test callers were updated. This keeps facet creation inside Foundry's
offchain script execution and broadcasts only the individual deployments.

Post-fix verification:

- `forge fmt --check` on the four changed Solidity files: **PASS**;
- `forge test -vv`: **PASS**, 27/27 tests;
- `forge build --sizes`: **PASS**, exit 0;
- `NudosFacetCutFactory`: 112-byte runtime library artifact;
- largest observed deployable application component: `DiamondInit` at 13,702
  bytes, with a 10,874-byte runtime margin.

The compiler still reports pre-existing unused-parameter, mutability, modifier,
hashing, and test-style warnings. They are audit inputs, not size blockers.

`forge fmt --check` did not pass against the mixed worktree. The reported
formatting changes span existing and unrelated files, so no repository-wide
rewrite was applied.

## Frontend and monitoring

Commands:

```powershell
cd lazos-frontend
npm.cmd run test:ops-monitor
npm.cmd run check-types
```

Results:

- chain-health monitor self-test: **PASS** for primary-to-secondary failover,
  stale-block alert, and missing-contract-code alert;
- TypeScript: **PASS** after the monitoring route was added.

The route is protected by `CRON_SECRET`, uses server-only RPC configuration,
emits structured logs, avoids returning RPC URLs, and can send sanitized alerts
to an approved webhook. `vercel.json` schedules it daily as the second Hobby-
compatible cron. Production configuration and delivery have not been tested.

Three `npm.cmd run build` attempts remained in Next.js optimized-production-
build processing until their 5-minute, 8-minute, and 10-minute limits. They
were terminated with no compiler error. The `.next/trace` showed ongoing SSR
module compilation dominated by WalletConnect/Reown, `viem/ox`, and
`es-toolkit`; it did not identify a thrown error or unresolved application
promise. The current build result is therefore **INCONCLUSIVE**, not pass or
fail. An experimental narrow-chain import did not improve the result enough and
was removed to preserve the known wallet configuration.

## Dependency audit

The direct unused `@react-native-async-storage/async-storage` dependency was
removed, the PostCSS floor/override was updated to `8.5.26`, and the lockfile
was regenerated with the non-forced npm remediation path.

Current commands:

```powershell
npm.cmd audit --omit=dev --audit-level=moderate --json
npm.cmd audit --audit-level=moderate --json
```

Result for both: **0 known vulnerabilities** (0 critical, high, moderate, low,
or informational) at the time of this check. This is a time-bound registry
result and must be rerun on the frozen release.

## Operational blockers observed

- Base Mainnet dedicated RPC authentication was not available; the public Base
  endpoint is not accepted as a production provider.
- Base Sepolia Diamond
  `0xa6181f4564d5e4318e3fab7904e9624ed0101c46` is owned by EOA
  `0xCa9cDD6714033a4D08e4BE479c1077e5B35f3a4B`, not by the production Safe.
- The deployed Sepolia interface did not expose a `getSystemAdmins()` selector,
  so no complete current-admin inventory was obtained from it.
- No valid Supabase backup was restored into an isolated target. PostgreSQL
  client installation did not complete, Docker is unavailable, and creating a
  temporary Supabase branch still requires informed cost approval.
- The worktree had 64 porcelain entries at observed HEAD
  `3c94e14aab2483d24f3be2094dcc84ee94f7f3f7`; it is not a frozen release.

All associated readiness fields remain false or pending until their required
external/production evidence exists.
