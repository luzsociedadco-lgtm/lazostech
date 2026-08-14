# Base Mainnet deployment dry-run

Date: 2026-08-14 UTC

Result: **PASS for the non-broadcast Diamond and fixed-supply token deployment
simulation**. This is predeploy evidence only; it is not a Mainnet deployment,
transaction, contract address, audit approval, legal approval, or production
GO decision.

## Reproducible boundary

- Source commit: `76fa8a186` (`Record mainnet recovery timing gap`).
- Network state: Base Mainnet chain `8453`, fixed block `49942092`.
- RPC mode: official public Base endpoint, simulation only. Base documents this
  endpoint as rate limited and unsuitable for production systems. The existing
  dedicated Alchemy/Chainstack production configuration remains separate and
  was not exported to the local process.
- Simulation sender:
  `0xCa9cDD6714033a4D08e4BE479c1077e5B35f3a4B`. This public address was used
  only to satisfy deterministic sender guards and is not designated as the
  production deployer.
- Final Diamond owner:
  `0x780811229991222a77F10895371851ca0a388364`.
- Broadcast: `false` for both scripts. No signer, keystore, private key or gas
  funding was used.

Official Base network reference:
<https://docs.base.org/base-chain/quickstart/connecting-to-base>.

## Diamond simulation

The canonical `DeployMainnetDiamond` script compiled and ran successfully
against the fixed fork. Its on-chain Safe validation accepted the configured
three-owner, threshold-two Safe and final ownership resolved to that Safe.

- Simulated Diamond address:
  `0xd4A7AfD1f031f2fc11b9651D784f197DE5b25607`.
- Generated operations: 24 contract creations and 2 calls.
- Estimated gas: `38,730,482`.
- Estimated amount at the simulated gas price: `0.0003873067565241 ETH`.

The address above exists only inside the ephemeral simulation and must never
be used as a production address. The accompanying clean Foundry run passed all
27 tests. `DiamondProductionReadinessTest` independently verifies that the
canonical cut installs 22 facet addresses and exactly 149 selectors, preserves
initial defaults, denies unauthorized upgrades, transfers both business and
Diamond-cut authority together, and supports a reviewed rollback.

## Token simulation

The canonical `DeployNudosToken` script then ran successfully against the same
fixed Mainnet block and the simulated Diamond allocation address.

- Simulated token address:
  `0x8bA1f463bA03086ed0b430fbc26b31E8C09f4130`.
- Safe allocation: `900,000 NUDOS`.
- Diamond allocation: `100,000 NUDOS`.
- Estimated gas: `762,804`.
- Estimated amount at the simulated gas price: `0.00000763566804 ETH`.

The combined script estimate was `39,493,286` gas and approximately
`0.0003949424245641 ETH` at the two observed simulated gas prices. This is not
a funding quote; real gas and verification costs can change before broadcast.

## Remaining release boundary

This dry-run does not close any postdeploy field in
`config/mainnet-readiness.json`. Before a broadcast, predeploy still requires:

1. an independent audit of the frozen commit with zero unresolved critical or
   high findings;
2. an operations timing retest, including the missed 30-minute Safe recovery
   target and accepted Supabase RPO/RTO;
3. qualified token/privacy legal approval and publication of approved terms
   and privacy notices; and
4. confirmation that the 2-of-3 Safe owners represent independent custodians,
   rather than several keys available to one operator/device.

After a permitted deployment, the Safe must separately review and execute
`setRewardToken(tokenAddress)`, contracts must be verified, production
addresses and transaction hashes must be recorded, and the chain-8453 E2E and
final production readiness checks must pass.
