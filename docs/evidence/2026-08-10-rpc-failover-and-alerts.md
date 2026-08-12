# RPC failover and alert-engine evidence - 2026-08-10

## Scope

This evidence validates the non-secret RPC health checker and failover logic in
`tools/check-rpc-operations.mjs`. It does not claim that a dedicated production
provider, deployed mainnet contracts, a scheduler, or an alert-delivery channel
has been configured.

## Automated alert self-test

Command:

```powershell
npm.cmd run ops:rpc:self-test
```

Result: `PASS`.

Verified cases:

- the primary returned HTTP 503 and the secondary was selected;
- the `rpc_failover_used` warning was emitted;
- a block 600 seconds old emitted `stale_block`;
- an address returning empty bytecode emitted `missing_contract_code`.

The fixture servers bind only to `127.0.0.1`, use no credentials, and are
closed by the test.

## Live Base Mainnet failover

The primary was deliberately set to an unavailable localhost endpoint. The
secondary was Base's public Mainnet RPC.

Verified result:

- selected provider: `secondary`;
- `failoverUsed`: `true`;
- chain ID: `8453`;
- observed block: `49805735`;
- block age: 1 second;
- secondary latency: 829 ms;
- primary failure was captured without exposing an endpoint or credential;
- process exited successfully with `--expect-failover`.

Base documents `https://mainnet.base.org` as rate limited and not suitable for
production systems. It was used only as a public validation target. A dedicated
primary and independent production secondary are still required.

## Readiness decision

- `rpc.failoverTested`: **true**. The fallback path was tested against chain
  `8453` and the monitor detects failover.
- `operations.alertsTested`: **true**. Three alert rules were exercised.
- `rpc.dedicatedEndpointConfigured`: remains **false**.
- `operations.monitoringConfigured`: remains **false** until production RPCs,
  contract addresses, scheduling, persistence, and delivery/escalation are live.

Reference: <https://docs.base.org/base-chain/quickstart/connecting-to-base>
