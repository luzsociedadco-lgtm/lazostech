# Diamond rollback local rehearsal - 2026-08-10

Command:

```powershell
forge test --match-path test/DiamondProductionReadiness.t.sol -vv
```

Verified result: 7 passed, 0 failed, 0 skipped.

`testOwnerCanReplaceAndRollBackSelector` performed this sequence:

1. the authorized owner added `ping()` from an original facet;
2. the owner replaced the selector with a second facet;
3. the owner replaced the selector back with the original facet;
4. the call result returned to its original value;
5. Diamond Loupe mapped the selector back to the exact original address.

The suite also confirms that a non-owner cannot call `diamondCut` and that
business ownership and upgrade ownership move together.

This is reproducible local code evidence, not the required operational
multisig rehearsal. `operations.rollbackRehearsed` remains false until an
upgrade and rollback are executed through the approved Safe procedure and the
corresponding public transactions are archived.
