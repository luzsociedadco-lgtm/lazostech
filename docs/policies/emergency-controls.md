# NUDOS emergency-controls policy - draft for approval

## Current control model

- Diamond cuts and ownership changes are restricted to the contract owner,
  which must be the approved production Safe.
- Application operators are separate, minimally funded addresses. The Safe can
  grant or revoke `systemAdmin` through `setSystemAdmin`.
- The fixed-supply NUDOS token has no owner, mint, pause, burn, seizure, or
  upgrade authority. This reduces privileged attack surface but means token
  transfers cannot be frozen during an incident.
- Frontend, API, relayer, and proposal automation may be stopped operationally;
  stopping them does not stop direct onchain calls.

## Authorized emergency actions

Only the Safe may:

- revoke or replace a compromised system administrator;
- replace or remove a defective Diamond selector;
- restore the last reviewed facet implementation;
- move treasury assets according to the approved incident decision.

Platform operators may disable application writes, relayer execution, alert
automation, and affected deployments. They may not bypass the Safe threshold,
change onchain ownership, or use a private key supplied through chat or source
control.

## Required evidence for every emergency change

- incident ID and severity;
- public Safe transaction hash and execution transaction;
- reviewed selector/facet diff or operator-address change;
- two independent approvals meeting the Safe threshold;
- pre- and post-action owner, selector, balance, and chain checks;
- rollback plan and validation result;
- follow-up external-audit review for any code change.

## Prohibited actions

- deploying unaudited mainnet code merely to save time;
- signing from a Safe owner key on an application server;
- committing RPC credentials, database URLs, passwords, or signing keys;
- representing frontend shutdown as an onchain pause;
- marking the incident resolved before reconciliation and monitoring recover.

## Approval gate

This policy remains unapproved until the founding team confirms the Safe owner
roles, operator custody model, incident lead, privacy lead, alert channel, and
the accepted absence of a token pause. Approval must be dated and archived.
