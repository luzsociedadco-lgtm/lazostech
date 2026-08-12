# Base Mainnet Safe preflight - 2026-08-10

## Scope

This evidence records the furthest safe preparation completed before accepting
third-party legal terms or submitting a production deployment transaction. It
does not claim that a Safe exists on Base Mainnet.

## Verified current state

- The rehearsed Base Sepolia Safe is
  `0x896A8fBfd7e44e3A0e628Adf633AD3a4cec7ff04`.
- The address has no deployed code on Base Mainnet, so it cannot be reused as a
  production Safe merely because the address exists on Base Sepolia.
- The three intended production signer addresses were checked on Base Mainnet
  and each had `0 ETH` at the time of the preflight:
  - `0x1915c7eC19c8167fb3388592449A7A438d9B05BD`
  - `0xEfC99b9e1240fa74d1DC72fa0cF3f8E1eB7554D6`
  - `0xF8Cd6CA7E4ad04c5BF1b0F1E59AaB5fD0537604D`

## Prepared browser handoff

The Safe creation flow is open on network `Base` with:

- name: `NUDOS Production Safe`;
- owners: the three addresses listed above;
- threshold: `2 of 3`.

The flow remains before the step that accepts Safe Terms and Privacy and before
any deployment/signature/transaction. The tab is intentionally preserved for
the user handoff.

## Deployment guard added to the repository

`DeployMainnetDiamond.s.sol` now rejects a proposed final owner unless it:

- has deployed code;
- implements the Safe-compatible `getOwners()` and `getThreshold()` calls;
- reports at least three owners;
- reports a threshold of at least two and no greater than the owner count.

The focused Foundry suite passed all five validation cases, and the complete
suite passed 27 of 27 tests.

## Readiness conclusion

Result: **PREPARED, NOT DEPLOYED**.

The production readiness fields `safe.address`, `safe.owners`,
`safe.threshold`, and `safe.recoveryTested` correctly remain empty or false.
Closing the gate requires explicit acceptance of the Safe legal terms, enough
Base Mainnet ETH for deployment, successful creation, public onchain
verification, approved independent custody, and a production recovery drill.
