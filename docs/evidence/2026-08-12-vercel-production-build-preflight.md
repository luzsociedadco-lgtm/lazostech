# Vercel production build preflight - 2026-08-12

## Outcome

The current production deployment of project `lazostech` is `READY`, and its
remote `next build` completed successfully in approximately one minute. This
narrows the earlier local build timeout to the Windows/local environment; it
does not certify the unreleased working tree.

Observed production deployment:

```text
dpl_55XfoNH9gm532JQuYy3Gu7z8GXyo
```

The deployment uses Node.js 22 because the package engine declaration
overrides the older project-level Node.js setting.

## Release difference

The deployed revision predates the new `/api/ops/chain-health` route and the
local dependency remediation. Therefore:

- the new mainnet monitor has not been deployed or exercised in production;
- its dedicated primary and secondary RPC values are not configured;
- its alert webhook and `CRON_SECRET` delivery have not been verified;
- the deployed build log still reports the older dependency audit state;
- the local lockfile currently reports zero known npm vulnerabilities, but
  that result must be repeated on the frozen release and then deployed.

No dirty-worktree deployment was attempted.

## Runtime observation

Vercel reported one runtime error group in the last 24 hours: two occurrences
of `AuthApiError: Invalid Refresh Token: Refresh Token Not Found` on
`/api/auth/session`, affecting one user. The last occurrence was
2026-08-12T05:40:25Z. This is consistent with an expired or already-cleared
Supabase refresh token; it should be handled as an unauthenticated session and
monitored after the next release, not classified as a chain-monitor failure.

## Remaining production actions

- publish a clean, reviewed release containing the monitor and dependency
  fixes;
- configure two dedicated Base Mainnet RPC endpoints and an approved alert
  webhook as protected Vercel environment variables;
- redeploy and verify the protected endpoint, failover, alert delivery, and
  scheduled invocation from production logs.

Until those observations exist, `operations.monitoringConfigured` and the
dedicated-RPC readiness field remain `false`.
