# Supabase branch, migration, and advisors - 2026-08-12

## Outcome

The Asset Layer foreign-key indexes were applied to the linked production
project and verified both directly and with the Supabase performance advisor.
This evidence does **not** claim that disaster recovery has been tested.

## Temporary branch attempt

The organization was confirmed as being on the Free plan. After the disclosed
branch price of USD 0.01344 per hour was accepted, creation of a temporary
branch was attempted through Supabase. Supabase rejected it because database
branching requires the Pro plan or above.

No branch was created and no branch billing started.

The alternative portable PostgreSQL 17 client was also preflighted, but no
database export was attempted because the production database password was not
available to the process. No secret was requested or stored. A real restore
test still requires either:

- upgrading the Supabase organization and creating an isolated branch; or
- the authorized operator entering the database password directly into a local
  terminal so a dump can be restored into an isolated PostgreSQL 17 target.

`supabase.backupRestoreTested` therefore remains `false`.

## Applied migration

Remote migration:

```text
20260812143318_asset_layer_fk_indexes
```

The migration adds indexes for the four foreign-key columns previously
reported by the advisor:

- `asset_layer_custody_events.asset_id`;
- `asset_layer_outbox.asset_id`;
- `asset_layer_transformations.output_asset_id`;
- `asset_layer_verifications.asset_id`.

Direct inspection of `pg_indexes` returned all four expected indexes. The
post-migration performance advisor returned no `unindexed_foreign_keys`
findings. Its remaining 38 informational findings are all `unused_index`; this
is expected for the new and mostly empty Asset Layer tables and is not a reason
to remove constraints or indexes before observing production workload.

## Security advisor

The post-migration security advisor still reports four warnings:

- three authenticated `SECURITY DEFINER` RPCs used by the ticket-turn flow;
- leaked-password protection disabled in Supabase Auth.

The three RPC warnings were reviewed previously: anonymous and public execute
access is revoked, each function requires `auth.uid()`, privileged monitor
operations check the monitor role, and the request RPC derives identity from
the authenticated profile/JWT rather than trusting its legacy identity
parameters. They remain explicit external-audit items, not ignored findings.

Leaked-password protection must be enabled and verified by an authorized Auth
administrator before production readiness can treat that warning as closed.
