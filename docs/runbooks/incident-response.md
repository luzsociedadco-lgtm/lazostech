# NUDOS incident-response runbook - draft for approval

Status: operational draft. It is not approved until the named incident lead,
Safe owners, application operator, privacy contact, and communications owner
accept their roles and complete a tabletop exercise.

## Severity

- **SEV-0:** confirmed key compromise, unauthorized Diamond cut/ownership
  change, material treasury loss, active personal-data breach, or widespread
  production corruption.
- **SEV-1:** failed relayer jobs blocking critical flows, RPC outage without a
  working failover, incorrect rewards, suspected unauthorized access, or a
  recoverable production-data integrity failure.
- **SEV-2:** degraded UI/API, delayed anchors, non-critical reconciliation
  mismatch, or alert noise without user loss.

## Detection and declaration

Any operator may declare an incident. Record UTC and America/Bogota time,
detector, affected chain/project, first known bad block/request, and severity.
Never copy a private key, session token, database password, personal row data,
or unredacted provider URL into the incident record.

Send security reports to `security@lazostech.org`. The approved contact roster
and out-of-band escalation channel must be stored in the team's access-
controlled operations system, not this public repository.

## First 15 minutes

1. Acknowledge the alert and open an incident record.
2. Preserve read-only evidence: transaction hashes, public addresses, block
   numbers, sanitized logs, deployment ID, release commit, and monitor output.
3. Confirm chain ID and compare primary/secondary RPC observations.
4. Determine whether the issue is onchain, application, relayer, Supabase, or a
   false positive.
5. Page the incident lead and the minimum required Safe owners for SEV-0/1.

## Containment

- **Compromised application operator:** disable the server-side signing route,
  remove the platform secret, and have the Safe execute
  `setSystemAdmin(operator, false)`. Do not rotate into another shared EOA.
- **Malicious or defective facet:** stop affected frontend/relayer actions;
  prepare a reviewed Safe proposal that restores the last verified facet and
  selector manifest. Never make an emergency EOA upgrade.
- **Treasury anomaly:** stop automated proposal preparation and reconciliation;
  Safe owners review allowances, transfers, pending Safe transactions, and
  signer integrity. The fixed NUDOS token cannot pause or seize transfers.
- **RPC failure:** activate the tested secondary, verify chain `8453`, recent
  blocks, contract bytecode, and block consistency before resuming writes.
- **Supabase incident:** disable affected write routes or roles, preserve logs,
  revoke exposed sessions/credentials, and use a verified backup only through
  the isolated restore procedure. Do not reset the linked production database.
- **Privacy incident:** restrict access, preserve evidence, notify the privacy
  lead, and obtain legal guidance on notification duties and timing.

## Recovery

Recovery requires two-person review for Safe actions and production secret
changes. Before reopening writes:

- identify and remove the root cause;
- deploy or restore from a reviewed artifact;
- run code, predeploy, and applicable postdeploy checks;
- reconcile onchain balances/events and database state;
- confirm both RPC providers and alert delivery;
- obtain incident-lead approval and record the exact recovery point.

## Post-incident

Within five business days, publish an internal postmortem containing impact,
timeline, root cause, detection gap, corrective actions, owners, and due dates.
Do not expose personal data or exploitable details before remediation. Link each
action to a test, monitor, policy, or deployment artifact.

## Tabletop acceptance criteria

The runbook can be approved only after a tabletop covers: lost Safe signer,
compromised relayer operator, RPC primary outage, bad Diamond upgrade and
rollback, reward/treasury anomaly, and Supabase restore. Capture response times,
decision owners, failed steps, and follow-up actions.
