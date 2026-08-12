# Base Mainnet Safe signer-recovery rehearsal

Date: 2026-08-12

## Scope

This evidence records a controlled signer-recovery rehearsal on the production
Safe on Base Mainnet. The exercise removed one signer with the two remaining
owners, verified the intentional temporary `2-of-2` state, and restored the
removed signer through a second threshold-approved Safe transaction.

This closes the custody gate for a production-scoped Safe recovery rehearsal.
It does not approve operator custody, incident response, audit, legal review,
RPC operations, or deployment of the NUDOS token or Diamond.

## Initial configuration

- Network: Base Mainnet (`8453`)
- Safe: `0x780811229991222a77F10895371851ca0a388364`
- Owners: `3`
- Threshold: `2`
- Simulated lost signer:
  `0xF8Cd6CA7E4ad04c5BF1b0F1E59AaB5fD0537604D`
- Recovery signers:
  - `0x1915c7eC19c8167fb3388592449A7A438d9B05BD`
  - `0xEfC99b9e1240fa74d1DC72fa0cF3f8E1eB7554D6`

## Step 1: remove the simulated lost signer

- Method: `removeOwner`
- Safe transaction hash:
  `0x698179011519416d2332d90c2da9c2b695a80cfb019d4e3e2adabe9610824fe9`
- Nonce: `0`
- Removed owner: `0xF8Cd6CA7E4ad04c5BF1b0F1E59AaB5fD0537604D`
- Resulting threshold: `2`
- Confirmations recorded: `2/2`
- Execution transaction:
  `0x330a412728f9fa6200ab57adb272d374ac07154d6aa88ad6f8e187d758f0e1e6`
- Block: `49864260`
- Execution timestamp: `2026-08-12T06:57:47Z`
- Receipt result: success
- Safe service result: `isExecuted=true`, `isSuccessful=true`
- Executor: `0x1915c7eC19c8167fb3388592449A7A438d9B05BD`
- Gas used: `95383`
- Fee: `572298000000 wei`

The intermediate public state was verified as:

- Owners:
  - `0xEfC99b9e1240fa74d1DC72fa0cF3f8E1eB7554D6`
  - `0x1915c7eC19c8167fb3388592449A7A438d9B05BD`
- Threshold: `2`
- Nonce: `1`

This was an intentional temporary `2-of-2` state. The Safe remained usable,
but had no signer redundancy until the restoration transaction completed.

## Step 2: restore the removed signer

- Method: `addOwnerWithThreshold`
- Safe transaction hash:
  `0xcdcfd8a4c78bf15a3a246c9294b902a07ef6ef4ab3180ff298bc34b4bfce6988`
- Nonce: `1`
- Restored owner: `0xF8Cd6CA7E4ad04c5BF1b0F1E59AaB5fD0537604D`
- Resulting threshold: `2`
- Confirmations recorded: `2/2`
- Signers:
  - `0x1915c7eC19c8167fb3388592449A7A438d9B05BD`
  - `0xEfC99b9e1240fa74d1DC72fa0cF3f8E1eB7554D6`
- Execution transaction:
  `0xb0f83d99bfa239192a96eae2f5778606bcfea0d0f449a7400e9c25db808b8668`
- Block: `49865501`
- Execution timestamp: `2026-08-12T07:39:09Z`
- Receipt result: success
- Safe service result: `isExecuted=true`, `isSuccessful=true`
- Executor: `0x1915c7eC19c8167fb3388592449A7A438d9B05BD`
- Gas used: `101363`
- Fee: `608178000000 wei`

The final public Safe configuration was verified as:

- Owners:
  - `0xF8Cd6CA7E4ad04c5BF1b0F1E59AaB5fD0537604D`
  - `0xEfC99b9e1240fa74d1DC72fa0cF3f8E1eB7554D6`
  - `0x1915c7eC19c8167fb3388592449A7A438d9B05BD`
- Threshold: `2`
- Nonce: `2`
- Safe version: `1.4.1+L2`
- Guard: zero address
- Modules: none

## Public verification

```powershell
curl.exe -L --silent --show-error `
  'https://safe-transaction-base.safe.global/api/v1/multisig-transactions/0x698179011519416d2332d90c2da9c2b695a80cfb019d4e3e2adabe9610824fe9/'

curl.exe -L --silent --show-error `
  'https://safe-transaction-base.safe.global/api/v1/multisig-transactions/0xcdcfd8a4c78bf15a3a246c9294b902a07ef6ef4ab3180ff298bc34b4bfce6988/'

curl.exe -L --silent --show-error `
  'https://safe-transaction-base.safe.global/api/v1/safes/0x780811229991222a77F10895371851ca0a388364/'
```

BaseScan execution links:

- Removal:
  `https://basescan.org/tx/0x330a412728f9fa6200ab57adb272d374ac07154d6aa88ad6f8e187d758f0e1e6`
- Restoration:
  `https://basescan.org/tx/0xb0f83d99bfa239192a96eae2f5778606bcfea0d0f449a7400e9c25db808b8668`

## Readiness conclusion

Result: **PASS for `safe-recovery-tested`**.

The rehearsal started and ended with the intended production configuration of
three owners and a threshold of two. No NUDOS token or Diamond deployment was
performed during this exercise.
