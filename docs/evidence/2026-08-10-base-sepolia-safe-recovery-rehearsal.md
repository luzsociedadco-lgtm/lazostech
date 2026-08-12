# Base Sepolia Safe signer-recovery rehearsal

Date: 2026-08-10

## Scope

This evidence records a controlled signer-recovery rehearsal on Base Sepolia.
The exercise simulated loss of one signer by removing it with the two remaining
owners, verified the temporary two-owner state, and restored the removed signer
with a second threshold-approved Safe transaction.

This is testnet evidence. It proves the recovery procedure was rehearsed for
this Base Sepolia Safe, but it does not establish a Base Mainnet Safe, approved
production custody, production incident response, or TRL 9.

## Public configuration before the rehearsal

- Network: Base Sepolia (`84532`)
- Safe: `0x896A8fBfd7e44e3A0e628Adf633AD3a4cec7ff04`
- Owners: 3
- Threshold: 2
- Simulated lost signer: `0xF8Cd6CA7E4ad04c5BF1b0F1E59AaB5fD0537604D`
- Recovery signers:
  - `0x1915c7eC19c8167fb3388592449A7A438d9B05BD`
  - `0xEfC99b9e1240fa74d1DC72fa0cF3f8E1eB7554D6`

## Step 1: remove the simulated lost signer

- Method: `removeOwner`
- Safe transaction hash: `0xccd865d95757354c9cbe7d5539e1761bbf3f19b58b6cbfdfa5af24cd1d4d09a5`
- Nonce: `1`
- Previous owner pointer: `0xEfC99b9e1240fa74d1DC72fa0cF3f8E1eB7554D6`
- Removed owner: `0xF8Cd6CA7E4ad04c5BF1b0F1E59AaB5fD0537604D`
- Resulting threshold: `2`
- Confirmations recorded: `2/2`
- Execution transaction: `0x3b75d9560c0d4bc08067e793cdbbabf1ac9eb8807029ec53ecd80774b31f2067`
- Block: `45312669`
- Receipt status: `1 (success)`
- Safe service result: `isExecuted=true`, `isSuccessful=true`
- Executor: `0xC066ac5D385419B1A8c43A0E146fA439837a8B8c`

The intermediate on-chain state was verified as:

- Owners:
  - `0x1915c7eC19c8167fb3388592449A7A438d9B05BD`
  - `0xEfC99b9e1240fa74d1DC72fa0cF3f8E1eB7554D6`
- Threshold: `2`
- Nonce: `2`

This was an intentional temporary `2-of-2` state. The Safe remained functional,
but it had no signer redundancy until restoration completed.

## Step 2: restore the removed signer

- Method: `addOwnerWithThreshold`
- Safe transaction hash: `0xdd16ae90ab6b08a616c9abbe8d06b0b6ca5fc38f7d4c1665d5717e4080bfde25`
- Nonce: `2`
- Restored owner: `0xF8Cd6CA7E4ad04c5BF1b0F1E59AaB5fD0537604D`
- Resulting threshold: `2`
- Confirmations recorded: `2/2`
- Execution transaction: `0x77d2760af844731f166ce9ac3822c94688638fd09875fbd61d0e82f2a77d4b7d`
- Block: `45313595`
- Receipt status: `1 (success)`
- Safe service result: `isExecuted=true`, `isSuccessful=true`
- Executor: `0xC066ac5D385419B1A8c43A0E146fA439837a8B8c`

The final on-chain state was verified as:

- Owners:
  - `0xF8Cd6CA7E4ad04c5BF1b0F1E59AaB5fD0537604D`
  - `0x1915c7eC19c8167fb3388592449A7A438d9B05BD`
  - `0xEfC99b9e1240fa74d1DC72fa0cF3f8E1eB7554D6`
- Threshold: `2`
- Nonce: `3`

The Safe web interface also displayed `Success`, `2/3`, and the restoration
execution transaction after the Safe service had indexed it.

## Reproduction commands

```powershell
curl.exe -L --silent --show-error `
  'https://safe-transaction-base-sepolia.safe.global/api/v1/multisig-transactions/0xccd865d95757354c9cbe7d5539e1761bbf3f19b58b6cbfdfa5af24cd1d4d09a5/'

curl.exe -L --silent --show-error `
  'https://safe-transaction-base-sepolia.safe.global/api/v1/multisig-transactions/0xdd16ae90ab6b08a616c9abbe8d06b0b6ca5fc38f7d4c1665d5717e4080bfde25/'

cast receipt 0x3b75d9560c0d4bc08067e793cdbbabf1ac9eb8807029ec53ecd80774b31f2067 `
  --rpc-url https://sepolia.base.org

cast receipt 0x77d2760af844731f166ce9ac3822c94688638fd09875fbd61d0e82f2a77d4b7d `
  --rpc-url https://sepolia.base.org

cast call 0x896A8fBfd7e44e3A0e628Adf633AD3a4cec7ff04 `
  'getOwners()(address[])' --rpc-url https://sepolia.base.org

cast call 0x896A8fBfd7e44e3A0e628Adf633AD3a4cec7ff04 `
  'getThreshold()(uint256)' --rpc-url https://sepolia.base.org

cast call 0x896A8fBfd7e44e3A0e628Adf633AD3a4cec7ff04 `
  'nonce()(uint256)' --rpc-url https://sepolia.base.org
```

## Readiness conclusion

Result: **PASS for the Base Sepolia signer-recovery rehearsal**.

The production readiness field `safe.recoveryTested` remains unchanged. The
mainnet gate requires the approved Base Mainnet Safe and a production-scoped
recovery rehearsal under the production custody and incident-response process.
