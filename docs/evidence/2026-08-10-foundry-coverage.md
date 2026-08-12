# Foundry testing and coverage evidence - 2026-08-10

Command:

```powershell
forge coverage --ir-minimum --report summary
```

Verified result:

- Test suites: 5.
- Tests: 27 passed, 0 failed, 0 skipped.
- Lines: 29.75% (680/2286).
- Statements: 27.66% (671/2426).
- Branches: 3.90% (26/667).
- Functions: 29.52% (93/315).

## Critical-flow evidence

The local suite now exercises the main onchain authority and economy paths:

- canonical Diamond facet installation and selector mapping;
- initialization, ownership transfer, and fail-closed upgrade authority;
- fixed 1,000,000 NUDOS supply, genesis allocations, standard transfers, and
  Safe-to-Diamond replenishment without changing supply;
- absence of exposed privileged mint, burn, pause, ownership, or upgrade
  functions on the token;
- profile, machine, oracle, recycling, credential issuance, bounded reward,
  and duplicate-recycling rejection;
- reward and treasury authorization failures;
- ticket redemption returning NUDOS to the Diamond and replay rejection;
- marketplace seller settlement, 2.5% protocol fee, replay rejection, and
  same-block repeat-purchase rejection;
- transfer of treasury authority with Diamond ownership.
- authorized Diamond selector replacement and restoration to the exact original
  facet implementation.
- rejection of an EOA, a non-Safe contract, fewer than three owners, and unsafe
  thresholds as the production owner; a Safe-compatible 3-owner, 2-of-3 mock
  passes the deployment guard.

## Invariant evidence

Foundry executed three stateful invariants with 64 runs and 32 calls per run:

- fixed total supply and conservation across all tracked balances;
- reward accounting equals successful grants;
- reward-token configuration and Diamond ownership remain stable.

That is 6,144 randomized handler calls in total, with zero unexpected reverts.

## Decision and limitations

Result: **PASS for the local `testing-evidence` readiness gate**. The critical
onchain flows above are covered and the new stateful invariant suite is
approved as a reproducible internal control.

Foundry warns that `--ir-minimum` can make source mapping less precise. This
report remains a risk baseline, not auditor approval. Global branch coverage is
still low, and the suite is not comprehensive across every facet and frontend,
relayer, Supabase, or production integration path. External audit, production
monitoring, incident response, mainnet deployment, and real-use evidence remain
separate open gates.
