# NUDOS operations acceptance worksheet

Status: four role-holder wallet signatures verified on 2026-08-14 UTC. The
role, policy and custody assignments are accepted. Final operations readiness
still requires closing the missing actual-time records identified in the
tabletop section. This worksheet does not replace independent legal/security
review.

Do not store personal phone numbers, private channels, passwords, recovery
codes, signing keys, or provider credentials in this repository. Archive the
signed roster in the team's access-controlled operations system and record only
its reference below.

## Named roles

| Role | Named owner | Acceptance date (UTC) | Secure roster reference |
| --- | --- | --- | --- |
| Incident lead | `0xF8Cd6CA7E4ad04c5BF1b0F1E59AaB5fD0537604D` custodian | 2026-08-14T00:37:28.508Z | `operations-acceptance/604D.json` |
| Backup incident lead | `0xEfC99b9e1240fa74d1DC72fa0cF3f8E1eB7554D6` custodian | 2026-08-14T00:44:39.294Z | `operations-acceptance/54D6.json` |
| Application/relayer operator | `0x8Bae87ff96874175aa330dc287F412240d19Fbe9` custodian | 2026-08-14T01:16:34.329Z | `operations-acceptance/FBE9.json` |
| Safe owner 604D | `0xF8Cd6CA7E4ad04c5BF1b0F1E59AaB5fD0537604D` custodian | 2026-08-14T00:37:28.508Z | `operations-acceptance/604D.json` |
| Safe owner 54D6 | `0xEfC99b9e1240fa74d1DC72fa0cF3f8E1eB7554D6` custodian | 2026-08-14T00:44:39.294Z | `operations-acceptance/54D6.json` |
| Safe owner 05BD | `0x1915c7eC19c8167fb3388592449A7A438d9B05BD` custodian | 2026-08-14T00:55:08.652Z | `operations-acceptance/05BD.json` |
| Privacy lead | `0x1915c7eC19c8167fb3388592449A7A438d9B05BD` custodian | 2026-08-14T00:55:08.652Z | `operations-acceptance/05BD.json` |
| Communications owner | `0x1915c7eC19c8167fb3388592449A7A438d9B05BD` custodian | 2026-08-14T00:55:08.652Z | `operations-acceptance/05BD.json` |

## Decisions requiring explicit acceptance

- [x] The project lead approves that the production Diamond is owned by Safe
  `0x780811229991222a77F10895371851ca0a388364` with 3 owners and threshold 2.
- [x] The project lead approves separate, minimally funded application
  operators whose keys are never stored in frontend variables, source control,
  or chat. The accepted LuzSociedad operator is
  `0x8Bae87ff96874175aa330dc287F412240d19Fbe9`.
- [x] Safe owners understand that two approvals are required for upgrades,
  ownership changes, operator changes, and treasury emergency actions.
- [x] The project lead accepts that the fixed-supply NUDOS token has no pause,
  mint, seizure, owner, or upgrade control; frontend shutdown cannot stop direct
  token transfers.
- [x] The project lead approves the tested alert destination and the controlled
  out-of-band escalation model. Private channel details stay outside this repo.
- [x] The assigned role holders accepted the incident runbook and
  emergency-controls policy without undocumented exceptions through the four
  verified message signatures.

## Tabletop record

| Scenario | Date | Lead | Target time | Actual time | Result | Evidence reference |
| --- | --- | --- | --- | --- | --- | --- |
| Lost Safe signer | 2026-08-12 | Incident lead 604D (assigned; signature pending) | 30 min | PENDING | TECHNICAL PASS; acceptance pending | Base Mainnet Safe recovery rehearsal |
| Compromised relayer operator | 2026-08-13 | Incident lead 604D (assigned; signature pending) | 15 min | PENDING | TECHNICAL PASS; acceptance pending | Base Sepolia Safe operations rehearsal |
| Primary RPC outage/failover | 2026-08-12 | Incident lead 604D (assigned; signature pending) | 5 min | PENDING | TECHNICAL PASS; acceptance pending | Production RPC and monitoring evidence |
| Defective Diamond cut/rollback | 2026-08-13 | Incident lead 604D with backup 54D6 (signatures pending) | 30 min | PENDING | TECHNICAL PASS; acceptance pending | Base Sepolia Safe operations rehearsal |
| Reward or treasury anomaly | 2026-08-13 | Incident lead 604D with Safe quorum (signatures pending) | 15 min | PENDING | TECHNICAL PASS; acceptance pending | Technical tabletop consolidation and Foundry suites |
| Supabase isolated restore | 2026-08-13 | Application operator FBE9 (full address/signature pending) | PENDING | PENDING | TECHNICAL PASS; acceptance pending | Supabase restore drill evidence |

For each exercise record the declaration time, who made each decision, Safe or
public transaction hashes where applicable, sanitized logs, failed steps,
recovery point, and follow-up owners/dates.

The technical mapping and reward/treasury decision tree are consolidated in
`docs/evidence/2026-08-13-operations-tabletop-technical.md`. Rows remain
organizationally pending until the named lead records actual exercise timing
and accepts each procedure.

## Approval outcome

The operations gate passes only when:

1. every required role has accepted;
2. the decisions above are checked and archived;
3. every tabletop scenario passes or has remediations completed and retested;
4. production monitoring, RPC failover, and alert receipt are evidenced;
5. operator rotation and Diamond rollback are rehearsed through the production
   control model, not an EOA shortcut;
6. the incident lead dates and signs the final acceptance in the controlled
   operations system.

Cryptographic acceptance reference: **NUDOS-OPS-2026-08-13**. Public proofs
contain wallet addresses, roles, signed policy/runbook hashes and signatures,
but no email addresses, personal channels or secrets. The private contact
roster remains outside this repository.

## Network boundary

- The four role acceptances are off-chain message signatures: no gas, funds or
  contract state changed.
- The operator-rotation and Diamond rollback rehearsal ran on Base Sepolia.
- The signer-recovery rehearsal did execute two real Base Mainnet Safe owner
  transactions (remove and restore 604D). It did not deploy the NUDOS token or
  Diamond and did not move treasury funds.
- Production RPC monitoring observes Base Mainnet; the Supabase restore drill
  wrote only to disposable local targets.
