# NUDOS technical operations tabletop consolidation

Date: 2026-08-13

Result: **TECHNICAL EVIDENCE COMPLETE; ORGANIZATIONAL ACCEPTANCE PENDING**.

This record maps completed drills to the six scenarios required by the
incident-response runbook. It does not name decision owners, approve custody,
or substitute the incident lead and Safe-owner acceptance.

## Scenario matrix

| Scenario | Technical result | Evidence | Remaining acceptance |
| --- | --- | --- | --- |
| Lost Safe signer | PASS | `2026-08-12-base-mainnet-safe-recovery-rehearsal.md` | Incident lead records response-time target and owners accept the temporary 2-of-2 risk. |
| Compromised relayer operator | PASS | `2026-08-13-base-sepolia-safe-operations-and-rollback.md` | Operator and Safe owners accept the revoke/replace procedure and custody boundary. |
| Primary RPC outage/failover | PASS | `2026-08-12-production-rpc-and-monitoring.md` | Incident lead accepts the escalation channel and five-minute target. |
| Defective Diamond cut/rollback | PASS | `2026-08-13-base-sepolia-safe-operations-and-rollback.md` | Safe owners accept selector review and rollback decision roles. |
| Reward or treasury anomaly | PASS for technical controls | `NudosEconomyCriticalFlows.t.sol`, `NudosToken.t.sol`, and this record | Incident lead and Safe owners accept the containment and reconciliation decision tree. |
| Supabase isolated restore | PASS | `2026-08-13-supabase-restore-drill-attempt.md` | Backup owner accepts RPO/RTO targets and controlled restore responsibility. |

## Reward or treasury anomaly exercise

The dry-run begins when monitoring or reconciliation reports an unexpected
reward, balance, allowance, or Safe proposal. The technical response is:

1. stop application relaying and automated proposal preparation;
2. preserve transaction hashes, balances, allowances, pending Safe
   transactions, release commit and sanitized logs;
3. independently compare fixed total supply, known allocations, reward
   accounting and treasury movements;
4. revoke a compromised application operator through the Safe where needed;
5. do not claim that the immutable token can pause, seize, mint or reverse a
   transfer;
6. resume only after two-person review, reconciliation, root-cause removal and
   incident-lead acceptance.

The Foundry critical-flow suite exercises reward funding/exhaustion, duplicate
recycling prevention, ticket and marketplace settlement, conserved total
supply and reward-accounting invariants. The token suite validates the fixed
supply and allocation constraints. The exact rerun output must be attached to
the frozen release verification.

## Closure boundary

All six scenarios now have a reproducible technical control and evidence
reference. The operations readiness gate remains open until the named roster,
policy decisions, target times and final acceptance are dated and archived in
the controlled operations system.
