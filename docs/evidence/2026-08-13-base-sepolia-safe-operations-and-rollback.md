# Base Sepolia Safe operations and Diamond rollback rehearsal

Date: 2026-08-13

## Scope

This evidence records a public Base Sepolia rehearsal of two operational
controls through the NUDOS 2-of-3 Safe:

1. a reversible system-admin rotation; and
2. an EIP-2535 selector add, replace, rollback, and removal.

It also records the ownership-facet repair required before the Safe could
control both the application owner and the Diamond upgrade owner. No mainnet
transaction was executed.

## Public configuration

- Network: Base Sepolia (`84532`)
- Diamond: `0xa6181f4564d5e4318e3fab7904e9624ed0101c46`
- Safe: `0x896A8fBfd7e44e3A0e628Adf633AD3a4cec7ff04`
- Owners: 3
- Threshold: 2
- Signing owners:
  - `0x1915c7eC19c8167fb3388592449A7A438d9B05BD`
  - `0xEfC99b9e1240fa74d1DC72fa0cF3f8E1eB7554D6`

## Ownership repair

The initial Safe batch simulation reverted at the first `diamondCut` with
`LibDiamond: NOT_OWNER`. Inspection showed a split ownership state:

- the deployed legacy `owner()` read `AppStorage.owner`, which already held the
  Safe address; but
- `LibDiamond.contractOwner`, which authorizes `diamondCut`, still held the
  legacy owner `0xCa9cDD6714033a4D08e4BE479C1077E5B35f3a4B`.

The repair was rehearsed first on a local Base Sepolia fork and then executed
publicly:

| Action | Transaction | Block | Status |
| --- | --- | ---: | --- |
| Deploy corrected `OwnershipFacet` | `0xccd9784a8754d03aedbf58aee3ad0ce92423a2904aeca5f0ff80f1fb59e34706` | 45419586 | success |
| Replace `owner()` and `transferOwnership()` | `0x84b0de896f9c7371a810f1883c4f7bec45c8c3878d0fad5349083ad7d3487832` | 45419629 | success |
| Transfer unified ownership to the Safe | `0x476b0ccf8912f4e1ecc3f5afa104cc96b76fa0cbc8603bec4b1b92d4a4560d1f` | 45419676 | success |

Corrected facet:
`0x98fe7Ece24010FE2196a71880A1e19A427e5C8fD`.

Post-repair public RPC checks confirmed that both `owner()` and the
`LibDiamond.contractOwner` storage slot resolve to the Safe.

## Atomic Safe rehearsal

Safe transaction hash:
`0xa3d928f85c9ad1e1b9fbb6acf56cd49a219734b67017959b9aa36bcf9a30d677`.

The signed transaction used `MultiSendCallOnly` by delegatecall and contained
eight inner calls, all with zero value:

1. authorize fictitious operator A;
2. revoke operator A;
3. authorize fictitious operator B;
4. revoke operator B;
5. add `ping()` to test facet 1;
6. replace `ping()` with test facet 2;
7. roll `ping()` back to test facet 1; and
8. remove `ping()`.

Before execution, the complete 2-of-3 transaction estimated successfully with
`552567` gas and no revert.

- Execution transaction:
  `0xee948d5e381b42e24fb53e7c8aaa85f94c40cecc005add1f5c772c8463488a37`
- Block: `45419797`
- Receipt status: `1 (success)`
- Safe nonce: `3 -> 4`

## Final-state verification

Public RPC and application checks confirmed:

- visible Diamond owner: Safe;
- Diamond upgrade owner: Safe;
- fictitious operator A: `false`;
- fictitious operator B: `false`;
- `ping()` facet address: zero address;
- no test selector or operator privilege remained after the rehearsal.

## Readiness conclusion

Result: **PASS for `operations.operatorRotationTested` and
`operations.rollbackRehearsed` on Base Sepolia through the approved 2-of-3
Safe procedure**.

This evidence does not approve the emergency-control policy, operator custody,
or incident runbook; those fields remain false pending explicit organizational
acceptance. It also does not constitute mainnet deployment, external audit, or
TRL 9 evidence.
