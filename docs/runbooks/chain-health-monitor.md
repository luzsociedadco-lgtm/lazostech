# NUDOS chain-health monitor runbook

Status: deployable implementation; production activation and alert delivery are
not yet evidenced.

## Purpose

The protected `GET /api/ops/chain-health` route checks the production chain
without exposing RPC URLs or credentials. It verifies:

- expected chain ID;
- current block and block age;
- primary-to-secondary RPC failover;
- deployed bytecode at the configured Diamond and token addresses;
- optional delivery of a sanitized alert to an approved HTTPS webhook.

Vercel invokes the route using `CRON_SECRET`. Requests without the exact bearer
token return HTTP 401. The implementation logs structured start, completion,
and failure events to Vercel runtime logs.

## Required production configuration

Set these as server-only production environment variables. Never prefix them
with `NEXT_PUBLIC_`.

| Variable | Requirement |
| --- | --- |
| `CRON_SECRET` | Random secret used by Vercel Cron authorization. |
| `OPS_PRIMARY_RPC_URL` | Dedicated Base Mainnet RPC endpoint. |
| `OPS_FAILOVER_RPC_URL` | Independent Base Mainnet RPC endpoint. |
| `OPS_EXPECTED_CHAIN_ID` | `8453`. |
| `OPS_RPC_TIMEOUT_MS` | Recommended initial value: `8000`. |
| `OPS_MAX_BLOCK_AGE_SECONDS` | Recommended initial value: `120`. |
| `OPS_DIAMOND_ADDRESS` | Set only after the Mainnet Diamond is deployed. |
| `OPS_NUDOS_TOKEN_ADDRESS` | Set only after the Mainnet token is deployed. |
| `OPS_ALERT_WEBHOOK_URL` | Approved operations alert destination. |
| `OPS_ALERT_WEBHOOK_BEARER_TOKEN` | Optional destination credential. |

The public Base endpoint may be used for diagnosis, but it is not a dedicated
production provider. Primary and failover endpoints must be operationally
independent.

## Schedule

`lazos-frontend/vercel.json` registers the route as the project's second daily
cron at 12:10 UTC. This remains compatible with Vercel Hobby's two-job and
daily-frequency limits. Before Mainnet, the operations owner must choose one of
these production controls:

1. upgrade the schedule to at least every five minutes on a compatible plan; or
2. run the same protected endpoint from an approved external scheduler.

Cron execution occurs only on production deployments. Preview success is not
production evidence.

## Local verification

From `lazos-frontend`:

```powershell
npm.cmd run test:ops-monitor
npm.cmd run check-types
```

The self-test uses localhost fixtures and proves primary failure, secondary
selection, stale-block detection, and missing-bytecode detection. It does not
send an external alert.

## Activation and evidence procedure

1. Add the production variables in Vercel without copying secret values into a
   ticket, chat, screenshot, or repository.
2. deploy a reviewed, clean release commit;
3. invoke the protected endpoint through the Vercel Cron dashboard;
4. verify `chain_health_done` in runtime logs and record only sanitized output;
5. make the primary endpoint temporarily unavailable through the provider's
   approved test procedure;
6. confirm the secondary is selected and the approved alert destination
   receives `rpc_failover_used`;
7. restore the primary and confirm the next result is `OK`;
8. archive timestamps, deployment ID, release commit, alert receipt, and
   sanitized monitor output in `docs/evidence`.

Do not deliberately disrupt a production provider without the operations
owner's approval and a rollback window.

## Readiness decision

`operations.monitoringConfigured` remains `false` until the route is deployed,
both production providers are configured, Mainnet contract addresses are set,
the schedule is appropriate for the accepted service level, and an alert is
observed at the approved destination.
