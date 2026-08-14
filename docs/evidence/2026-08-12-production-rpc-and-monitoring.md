# Production RPC and monitoring evidence - 2026-08-12

## Scope

This evidence records the production RPC and external monitoring configuration
completed for NUDOS on Base Mainnet. No RPC credential, bearer token, wallet
secret, or private key is included.

## Providers and secret handling

- Alchemy is configured as the primary Base Mainnet RPC provider in Vercel
  Production through the sensitive `OPS_PRIMARY_RPC_URL` variable.
- Chainstack node `NUDOS Base Mainnet Failover` is running as an Elastic Base
  Mainnet node and is configured through the sensitive
  `OPS_FAILOVER_RPC_URL` variable.
- `CRON_SECRET` is stored as a sensitive Vercel Production variable and the
  same bearer value is stored in the Better Stack monitor request header.
- Secret values were transferred through one-time local memory bridges, were
  never printed, and are not present in repository files.

## Production deployment

The approved deployment `dpl_3smERjHYKy6ectDjh7PdHeVYp1WR` was redeployed to
Production so it would receive the new environment variables. Vercel created:

- deployment: `dpl_AY6AKk7AxmYDU584Azk8rfxxLv6B`;
- status: `Ready`;
- production alias: `https://www.lazostech.com`;
- stable monitor target: `https://lazostech.vercel.app/api/ops/chain-health`.

The redeploy reused the approved artifact and did not upload the dirty local
worktree.

## Authenticated health observation

An authenticated production request returned HTTP 200 with:

- status: `OK`;
- provider: `primary`;
- `failoverUsed`: `false`;
- chain ID: `8453`;
- block: `49903623`;
- block age: 1 second;
- provider latency: 54 ms;
- no alerts and no provider failures.

An unauthenticated request remains rejected by the route's bearer check.

## Failover evidence

The production secondary endpoint was exercised through a controlled probe in
which the primary endpoint was deliberately set to an unavailable localhost
address. The result was:

- status: `DEGRADED`;
- provider: `secondary`;
- `failoverUsed`: `true`;
- chain ID: `8453`;
- the primary failure was recorded without exposing an endpoint.

The repository self-test also passed the primary-to-secondary failover,
stale-block alert, and missing-contract-code alert cases.

## Better Stack observation and alert delivery

Monitor `NUDOS Base Mainnet Chain Health` (`4806741`) checks every three
minutes for the authenticated response keyword `"status":"OK"`. Email is the
enabled notification channel.

The monitor initially detected HTTP 401 while the redeploy was still using the
previous environment, opened one incident, sent an email to the LazosTech
account, and automatically resolved the incident after the redeploy. The
monitor subsequently displayed `Up` with a recent successful check.

## Readiness boundary

This closes the dedicated production RPC, independent failover provider,
production monitor, and observed alert-delivery evidence. It does not close the
remaining mainnet gates: external audit, emergency/operator policy approvals,
operator rotation rehearsal, incident-runbook approval, rollback rehearsal,
Supabase restore evidence, legal sign-off, contract deployment, or postdeploy
contract verification.
