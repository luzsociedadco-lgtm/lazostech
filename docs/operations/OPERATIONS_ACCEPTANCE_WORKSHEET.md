# NUDOS operations acceptance worksheet

Status: unsigned worksheet. Completing it does not replace the required
tabletop evidence or independent legal/security review.

Do not store personal phone numbers, private channels, passwords, recovery
codes, signing keys, or provider credentials in this repository. Archive the
signed roster in the team's access-controlled operations system and record only
its reference below.

## Named roles

| Role | Named owner | Acceptance date (UTC) | Secure roster reference |
| --- | --- | --- | --- |
| Incident lead | PENDING | PENDING | PENDING |
| Backup incident lead | PENDING | PENDING | PENDING |
| Application/relayer operator | PENDING | PENDING | PENDING |
| Safe owner 604D | PENDING | PENDING | PENDING |
| Safe owner 54D6 | PENDING | PENDING | PENDING |
| Safe owner 05BD | PENDING | PENDING | PENDING |
| Privacy lead | PENDING | PENDING | PENDING |
| Communications owner | PENDING | PENDING | PENDING |

## Decisions requiring explicit acceptance

- [ ] The production Diamond is owned by Safe
  `0x780811229991222a77F10895371851ca0a388364` with 3 owners and threshold 2.
- [ ] Application operators are separate, minimally funded accounts and their
  keys are never stored in frontend variables, source control, or chat.
- [ ] Safe owners understand that two approvals are required for upgrades,
  ownership changes, operator changes, and treasury emergency actions.
- [ ] The fixed-supply NUDOS token has no pause, mint, seizure, owner, or
  upgrade control; frontend shutdown cannot stop direct token transfers.
- [ ] The alert destination and out-of-band escalation channel are approved and
  tested.
- [ ] The incident runbook and emergency-controls policy are accepted without
  undocumented exceptions.

## Tabletop record

| Scenario | Date | Lead | Target time | Actual time | Result | Evidence reference |
| --- | --- | --- | --- | --- | --- | --- |
| Lost Safe signer | PENDING | PENDING | 30 min | PENDING | PENDING | Mainnet rehearsal available |
| Compromised relayer operator | PENDING | PENDING | 15 min | PENDING | PENDING | PENDING |
| Primary RPC outage/failover | PENDING | PENDING | 5 min | PENDING | PENDING | Local rules tested; delivery pending |
| Defective Diamond cut/rollback | PENDING | PENDING | 30 min | PENDING | PENDING | Local rollback only |
| Reward or treasury anomaly | PENDING | PENDING | 15 min | PENDING | PENDING | PENDING |
| Supabase isolated restore | PENDING | PENDING | Defined before drill | PENDING | PENDING | PENDING |

For each exercise record the declaration time, who made each decision, Safe or
public transaction hashes where applicable, sanitized logs, failed steps,
recovery point, and follow-up owners/dates.

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

Controlled acceptance reference: **PENDING**
