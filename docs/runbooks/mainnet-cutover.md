# NUDOS Base Mainnet Cutover

This runbook is the authoritative path from the current Base Sepolia pilot to a production release on Base Mainnet.

## Release rule

Do not broadcast `DeployMainnetDiamond` until both commands return `READY`:

```powershell
npm.cmd run readiness:code
npm.cmd run readiness:predeploy
```

After deployment, production is not approved until this command returns `READY`:

```powershell
npm.cmd run readiness:mainnet
```

The non-secret evidence ledger is `config/mainnet-readiness.json`. Update it only when the corresponding evidence has been verified.

## 1. Freeze and verify the code

Run:

```powershell
forge build
forge test -vv
Set-Location lazos-frontend
npm.cmd audit --omit=dev --audit-level=moderate
npm.cmd run check-types
npm.cmd run build
npm.cmd run e2e:contracts
Set-Location ..
```

Required result:

- all Solidity tests pass;
- CI detects at least one executable `.t.sol` file;
- frontend audit and typecheck pass;
- the Sepolia E2E smoke test reports chain `84532`;
- release worktree is clean and the release commit is protected on `main`.

Archive a coverage report and document which critical flows and invariants are covered. The current deployment/ownership suite is a necessary baseline, not complete behavioral coverage of every facet.

The 2026-07-22 baseline, measured with `forge coverage --ir-minimum --report summary`, was 17.18% lines, 14.58% statements, 0.65% branches and 18.27% functions. Increase coverage around economy, rewards/tickets/treasury, recycling, governance, marketplace, access control and upgrade/storage invariants before requesting the audit. Because `--ir-minimum` can make source mappings less precise, use the figures as a risk signal and archive the final auditor-approved report separately.

## 2. Decide and implement the NUDOS token policy

The canonical implementation is `src/token/NudosToken.sol`. It has no owner,
mint, upgrade, or pause authority and allocates the complete supply in its
constructor. Before deployment, approve and archive:

1. maximum or fixed supply;
2. whether minting remains possible after launch;
3. mint authority and whether it is the Diamond, the Safe, or governance;
4. genesis allocations and treasury percentage;
5. vesting/lockups;
6. burn and upgrade policy;
7. how the reward treasury is funded and replenished.

Record the approved policy in `TOKENOMICS.md`, keep the unit/fuzz/invariant
tests green, include the token in the external audit, and then update the
`token` section of `config/mainnet-readiness.json` only after on-chain evidence
exists.

Deploy the Diamond first, then deploy the fixed-supply token with:

```powershell
$env:DIAMOND_OWNER="0xSAFE_ADDRESS"
$env:DIAMOND_ADDRESS="0xDIAMOND_ADDRESS"
forge script script/DeployNudosToken.s.sol:DeployNudosToken `
  --rpc-url $env:BASE_MAINNET_RPC_URL `
  --account nudos-deployer `
  --sender $env:DEPLOYER_ADDRESS `
  --broadcast `
  --verify `
  -vvv
```

The final Safe owner must then execute `setRewardToken(tokenAddress)` on the
Diamond. This is a Safe transaction and must be proposed, reviewed, signed by
two owners, and verified before the reward flows are enabled.

## 3. Create the production Safe

Create a Safe on Base Mainnet with at least three independent owners and a threshold of at least two. Prefer hardware-backed signers controlled by different people/devices.

Perform a rehearsal transaction and a recovery/key-loss tabletop exercise. Record only these public facts in the evidence ledger:

- Safe address;
- number of owners;
- threshold;
- whether the rehearsal succeeded.

Never place seed phrases or private keys in this repository, a ticket, email, or chat.

## 4. Configure infrastructure

Obtain a dedicated Base Mainnet RPC endpoint and a secondary/failover provider. Base's public RPC is rate limited and is not accepted by the frontend's production configuration.

Set secrets directly in the local environment and Vercel dashboard:

```text
NEXT_PUBLIC_CHAIN_ID=8453
NEXT_PUBLIC_RPC_URL=<dedicated Base Mainnet RPC>
NEXT_PUBLIC_NUDOS_DIAMOND_ADDRESS=<after deployment>
NEXT_PUBLIC_NUDOS_TOKEN_ADDRESS=<after deployment>
DIAMOND=<after deployment; server only>
RPC_URL=<dedicated Base Mainnet RPC; server only>
```

Also preserve the existing Supabase and WalletConnect production values. Do not expose a Supabase secret/service-role key through a `NEXT_PUBLIC_` variable.

The server-side wallet-sync route signs affiliation transactions with the server-only `DIAMOND_OPERATOR_PRIVATE_KEY` secret. For production, this must be a dedicated, minimally funded operator address added as `systemAdmin` by the Safe. It must not be the deployer, a Safe owner key, or the treasury key. Store it only in the deployment platform's encrypted secret store, document rotation/revocation, monitor every transaction, and test revocation through `setSystemAdmin`. If this custody model is not approved, replace it with an audited KMS/relayer design before launch.

## 5. Close Supabase operations

Using the linked production project:

1. compare remote migration history with `supabase/migrations`;
2. resolve whether the untracked monitor-assignment migration belongs in the canonical history;
3. review Security and Performance Advisors;
4. verify every Data API table has explicit grants and RLS policies;
5. test a backup restore into an isolated project;
6. verify production redirect URLs, email provider and rate limits;
7. decide whether to upgrade the plan for leaked-password protection/PITR requirements.

Mark the Supabase evidence complete only after the checks are captured.

## 6. External audit and remediation

Freeze a commit and send the active contracts, deployment scripts, tests, storage layout and token contract to an independent smart-contract auditor.

Required evidence:

- final report stored under `docs/audits/` or another approved immutable location;
- audited commit hash;
- zero open critical or high findings;
- remediation transactions/tests linked to each resolved finding.

## 7. Operations and legal approval

Before deployment, configure and test:

- RPC and application health monitoring;
- alerts for Diamond cuts, ownership changes, treasury movements and failed jobs;
- an approved emergency-control policy (pause capability, Safe-only upgrade response, or another audited control);
- incident contacts and a response runbook;
- rollback/upgrade rehearsal through the Safe;
- privacy policy and terms;
- legal review of token utility, distribution, consumer/data obligations and jurisdiction.

## 8. Mainnet rehearsal

Fork Base Mainnet at a fixed block and run the deployment without broadcasting. Confirm:

- chain ID is `8453`;
- all 149 selectors are installed;
- owner ends as the configured Safe;
- old deployer cannot call `diamondCut`;
- Safe can execute an authorized upgrade rehearsal;
- token treasury and reward/ticket paths work with realistic balances;
- estimated deployment and operational gas are funded.

## 9. Broadcast deployment

Import the deployer into Foundry's encrypted keystore interactively. Do not use a raw key in `.env`:

```powershell
cast wallet import nudos-deployer --interactive
```

Set the public controls:

```powershell
$env:DEPLOYER_ADDRESS="0xDEPLOYER_PUBLIC_ADDRESS"
$env:DIAMOND_OWNER="0xSAFE_ADDRESS"
$env:CONFIRM_MAINNET="true"
```

Simulate first by omitting `--broadcast`, then broadcast only after the Safe, audit and operations approvals are complete:

```powershell
forge script script/DeployMainnetDiamond.s.sol:DeployMainnetDiamond `
  --rpc-url $env:BASE_MAINNET_RPC_URL `
  --account nudos-deployer `
  --sender $env:DEPLOYER_ADDRESS `
  --broadcast `
  --verify `
  -vvv
```

## 10. Post-deployment approval

1. record Diamond/token addresses and deployment transaction in `config/mainnet-readiness.json`;
2. verify every contract/facet on the explorer;
3. configure the token address and fund the reward treasury according to the approved policy;
4. run the read-only on-chain validator:

   ```powershell
   $env:DIAMOND="0xDIAMOND_ADDRESS"
   $env:NUDOS_TOKEN="0xTOKEN_ADDRESS"
   forge script script/ValidateMainnetDeployment.s.sol:ValidateMainnetDeployment `
     --rpc-url $env:BASE_MAINNET_RPC_URL -vv
   ```

5. deploy the frontend with mainnet environment variables;
6. run `npm.cmd run e2e:contracts` against chain `8453`;
7. test a low-value end-to-end user flow;
8. confirm monitoring and alerts received the deployment events;
9. run `npm.cmd run readiness:mainnet` and archive its JSON output with the release evidence.

No public launch occurs while that final gate reports `NOT READY`.
