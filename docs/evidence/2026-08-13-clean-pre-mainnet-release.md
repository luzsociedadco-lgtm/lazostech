# NUDOS clean pre-Mainnet release verification

Date: 2026-08-13

## Frozen release

- Code and review-surface commit:
  `9bfd866d1947acd6f8147ce3d886353bc7dc9eee`
- Parent `origin/main`:
  `bcceb496b38dbd0ffad1264cb7fd2a08c5e1d653`
- Release branch: `agent/nudos-pre-mainnet-gates`
- Isolation method: alternate Git index followed by a detached clean worktree.
- Diff from parent: 23 files, with the manifest exclusions absent.

No NUDOS contract was deployed to Base Mainnet and no Safe transaction was
proposed or signed as part of this verification.

## Results from the clean worktree

| Check | Result |
| --- | --- |
| Git worktree | PASS, clean after refreshing a CRLF-only stat entry whose blob hash matched the index |
| Asset Layer readiness | READY 16/16 |
| NUDOS code readiness | READY 9/9 |
| Predeploy readiness | NOT READY 19/22 |
| Production readiness | NOT READY 19/26 |
| Foundry tests | PASS 27/27, 0 failed, 0 skipped |
| Stateful invariants | PASS, 3 invariants x 64 runs x 32 calls = 6,144 calls, 0 reverts |
| Contract sizes | PASS, every reported runtime below EIP-170 |
| TypeScript | PASS, `tsc --noEmit` |
| Operations monitor self-test | PASS, failover/stale-block/missing-code cases |
| Dependency audit | PASS, 0 vulnerabilities at moderate threshold |
| Next.js production build | INCONCLUSIVE on this Windows runner: no error output before a 304-second timeout |
| Local HTTP/visual verification | INCONCLUSIVE: the in-app browser connection failed before opening a tab and route requests timed out during Next compilation |

The dependency folder used for frontend checks was an ignored local junction to
the already installed dependency tree; it was not added to Git. The Next.js
build must be repeated by GitHub/Vercel from the pushed commit and must not be
reported as passing until that independent build completes.

The temporary local server was stopped after the route requests timed out. No
visual PASS is claimed.

## Remaining predeploy gates

Exactly three predeploy gates remain:

1. independent external security audit with zero unresolved critical/high
   findings;
2. named organizational acceptance of emergency controls, operator custody and
   incident response;
3. qualified legal review, completed entity/controller details and publication
   of effective terms/privacy notices.

Only after those three close do the four Mainnet gates begin: record deployed
addresses, archive the deployment transaction, verify contracts on an explorer,
and pass the chain-8453 E2E flow.
