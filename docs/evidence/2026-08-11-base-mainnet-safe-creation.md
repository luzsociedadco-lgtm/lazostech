# Base Mainnet production Safe creation - 2026-08-11

## Result

The `NUDOS Production Safe` was created successfully on Base Mainnet and is
visible in the Safe dashboard.

- Network: Base Mainnet (`8453`)
- Safe: `0x780811229991222a77F10895371851ca0a388364`
- Owners: 3
- Threshold: 2
- Creation transaction:
  `0xa5fa8558cd61a5e7c2963d284ab49bbff9ee1813cfde6ec7539209aa29f2a7a6`
- Creation block: `49860160`
- Receipt status: `1 (success)`
- Factory: `0x4e1DCf7AD4e460CfD30791CCC4F9c8a4f820ec67`
- Master copy: `0x41675C099F32341bf84BFc5382aF534df5C7461a`
- Activation: sponsored by Safe
- Safe service creation timestamp: `2026-08-12T04:41:07Z`

## Onchain verification

The address has deployed proxy bytecode. Direct Base Mainnet calls returned:

```text
getThreshold() = 2
getOwners() = [
  0xEfC99b9e1240fa74d1DC72fa0cF3f8E1eB7554D6,
  0x1915c7eC19c8167fb3388592449A7A438d9B05BD,
  0xF8Cd6CA7E4ad04c5BF1b0F1E59AaB5fD0537604D
]
```

The Safe creation service decoded the same three owners and threshold from the
setup calldata. The Safe dashboard displayed `NUDOS Production Safe`, `2/3`,
successful activation, and no pending transactions.

## Evidence boundaries

Result: **PASS for `safe-configured`**.

This creation does not close `safe-recovery-tested`, custody approval, operator
rotation, rollback, audit, legal, dedicated RPC, Supabase restore, monitoring,
or production deployment gates. No NUDOS token or Diamond contract was deployed
by this transaction.
