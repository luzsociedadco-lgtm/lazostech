# Final local verification - 2026-08-10

## Smart contracts

Command:

```powershell
forge test -vv
```

Result: **PASS** — 5 suites, 27 tests passed, 0 failed, 0 skipped.

The suite includes token policy, economy critical flows, stateful invariants,
Diamond upgrade/rollback, and Base Mainnet Safe validation.

## Coverage

Command:

```powershell
forge coverage --ir-minimum --report summary
```

Result: **PASS** — 27 tests passed during instrumentation.

- Lines: 29.75% (680/2286)
- Statements: 27.66% (671/2426)
- Branches: 3.90% (26/667)
- Functions: 29.52% (93/315)

## Frontend and Asset Layer

Commands:

```powershell
cd lazos-frontend
npm run check-types
npm run build
cd ..
npm run readiness:asset-layer
```

Results:

- TypeScript: **PASS**, no type errors.
- Next.js 15.5.22 production build: **PASS**, 32 static pages generated and
  dynamic API routes compiled.
- Asset Layer code integration: **READY (16/16)**.

The build emitted two non-blocking dependency warnings:

- a dynamic dependency expression inside `viem`/`ox` Tempo code reached through
  the public `wagmi/chains` export;
- `@supabase/supabase-js` references `process.version` while bundled for the
  Edge middleware path.

Both warnings originate in installed dependency code. The build completed with
exit code 0 after running outside the restricted process sandbox. They should
be reviewed during dependency maintenance, but are not represented as a failed
build.

## Operational self-test

Command:

```powershell
npm run ops:rpc:self-test
```

Result: **PASS** for primary-to-secondary failover, stale-block alert, and
missing-contract-code alert.

## Readiness ledgers

- Code: **READY (9/9)**.
- Predeploy: **NOT READY (14/22)**.
- Production: **NOT READY (14/26)**.

No Base Mainnet deployment, external audit, legal approval, production Safe,
production recovery drill, production monitoring service, or real-use evidence
is claimed by this local verification.
