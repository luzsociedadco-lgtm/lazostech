# Base Sepolia Safe 2-of-3 transaction rehearsal

Date: 2026-08-10

## Scope

This evidence records a low-value signing and execution rehearsal on Base
Sepolia. It validates that two independent owner accounts can approve a Safe
transaction and that the threshold-approved transaction can execute
successfully.

This is testnet evidence. It does not establish a production Base Mainnet Safe,
an owner-recovery test, a key-loss tabletop exercise, or production custody
approval.

## Public configuration

- Network: Base Sepolia (`84532`)
- Safe: `0x896A8fBfd7e44e3A0e628Adf633AD3a4cec7ff04`
- Owners: 3
- Threshold: 2
- Signing owners used in this rehearsal:
  - `0x1915c7eC19c8167fb3388592449A7A438d9B05BD`
  - `0xEfC99b9e1240fa74d1DC72fa0cF3f8E1eB7554D6`

## Rehearsed transaction

- Safe transaction hash: `0xd33ccec4e459f77a82996e3117444b88d23f7bdc44557b553b2b3149f6f6b50d`
- Nonce: `0`
- Operation: native transfer (`CALL`)
- Value: `0.0001 ETH` (`100000000000000` wei)
- Recipient: `0x1915c7eC19c8167fb3388592449A7A438d9B05BD`
- Confirmations required/recorded: `2/2`
- Execution transaction: `0xd5c9665e637da5b31b50fc5fc2c18275a5a777aad991a3c8858df58a7a81dc50`
- Block: `45311182`
- Receipt status: `1 (success)`
- Safe service result: `isExecuted=true`, `isSuccessful=true`

The execution transaction was submitted by the public executor address
`0xB42F812A44c22cc6b861478900401ee759EbEAD6`. The second signing owner balance
remained `0.002 ETH`, so this evidence does not claim that owner paid the
execution gas.

## Balance verification

- Safe after execution: `0.0019 ETH`
- Recipient after execution: `0.0021 ETH`
- Second signing owner after execution: `0.002 ETH`

The Safe decreased by exactly `0.0001 ETH` and the recipient increased by
exactly `0.0001 ETH`, matching the approved payload.

## Reproduction commands

```powershell
curl.exe -L --silent --show-error `
  'https://safe-transaction-base-sepolia.safe.global/api/v1/multisig-transactions/0xd33ccec4e459f77a82996e3117444b88d23f7bdc44557b553b2b3149f6f6b50d/'

cast receipt 0xd5c9665e637da5b31b50fc5fc2c18275a5a777aad991a3c8858df58a7a81dc50 `
  --rpc-url https://sepolia.base.org

cast balance 0x896A8fBfd7e44e3A0e628Adf633AD3a4cec7ff04 `
  --ether --rpc-url https://sepolia.base.org

cast balance 0x1915c7eC19c8167fb3388592449A7A438d9B05BD `
  --ether --rpc-url https://sepolia.base.org

cast balance 0xEfC99b9e1240fa74d1DC72fa0cF3f8E1eB7554D6 `
  --ether --rpc-url https://sepolia.base.org
```

## Readiness conclusion

Result: **PASS for the Base Sepolia 2-of-3 transaction rehearsal**.

The production readiness fields `safe.address`, `safe.owners`,
`safe.threshold`, and `safe.recoveryTested` remain unchanged. Closing those
gates requires a Base Mainnet Safe with approved independent custody plus a
separate recovery/key-loss rehearsal.
