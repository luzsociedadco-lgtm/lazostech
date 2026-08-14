# Supabase isolated backup/restore drill

Date: 2026-08-13

Result: **PASS — database logical backup and isolated restore validated**.

## Safety boundary

The linked Supabase project remained read-only. No restore command targeted the
linked project, no production reset was attempted, and no database credential
was written to the repository or evidence files. The source password was
entered once in a visible Git Bash prompt, passed to the official PostgreSQL
client as a temporary `PGPASSWORD` environment variable, and unset when the
dump process exited.

All writes occurred only in disposable Docker containers on localhost. The
restore used PostgreSQL 17 and the project-pinned Supabase CLI `2.109.1`.

## Official procedure

The drill followed the current Supabase logical backup/restore sequence:

1. roles-only dump;
2. schema dump;
3. data-only dump, excluding vector bucket/index tables;
4. separate `supabase_migrations` schema and data dumps;
5. transactional `psql` restore with `ON_ERROR_STOP=1` and
   `session_replication_role = replica`;
6. restore and validation only on an isolated target.

Reference:
<https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore>

## Backup result

The Session Pooler on port `5432` was used because the Windows host is IPv4
only. The final five source dumps were non-empty:

| File | Bytes |
| --- | ---: |
| `roles.sql` | 359 |
| `schema.sql` | 112747 |
| `data.sql` | 129332 |
| `history_schema.sql` | 1116 |
| `history_data.sql` | 102720 |

No partial files remained. SHA-256 hashes calculated before transfer matched
the hashes inside the target container byte for byte.

The data dump warned about the intentional circular foreign keys between
`asset_layer_assets` and `asset_layer_certificates`. The restore used the
documented trigger-disable mechanism. Both foreign keys were present and
validated afterward, with zero orphaned references.

## Compatibility preparation

The first transactional restore was rolled back because the generated roles
dump attempted to alter the reserved `supabase_admin` role. A restore-only copy
commented that single statement, as described by Supabase troubleshooting; the
original backup and hash were preserved.

The next transaction exposed that a bare database container had not applied
the current managed Auth and Storage migrations. The disposable target was
reinitialized through the Supabase CLI and the services were run separately:

- Auth: 77 managed migrations; 22 dump tables; 0 column mismatches;
- Storage: 61 managed migrations; 5 dump tables; 0 column mismatches.

This preparation changed only the disposable local target.

## Restore and validation

Both restore phases completed with exit code `0`:

- roles, application schema, and data in one transaction;
- project migration history in a second transaction.

Validation results:

- project migration versions: **16**;
- dump tables compared: **52/52**;
- aggregate source rows: **307**;
- aggregate target rows: **307**;
- row-count mismatches: **0**;
- public application tables: **24**;
- private application tables: **1**;
- public functions: **9**;
- public triggers: **21**;
- invalid or unready indexes: **0**;
- public application tables without RLS: **0**;
- public RLS policies: **45**;
- validated Asset Layer foreign keys: **33**;
- Asset Layer circular-reference orphans: **0**;
- Security/Performance Advisors at `warn` or higher: **0**.

The only `NOT VALID` constraint belongs to the managed Realtime schema, not to
an application schema.

Authorization validation ran inside transactions:

- `anon` could not read the protected Asset Layer table;
- `anon` could not execute the protected lunch-turn request RPC;
- an anonymous Asset Layer transformation attempt could not write data;
- a target-only authenticated synthetic user could read the permitted active
  lunch-turn service and its assigned Asset Layer organization;
- `ROLLBACK` removed the synthetic user and membership;
- no synthetic Asset Layer record remained.

## Scope and retention

This proves the PostgreSQL logical backup/restore path, migration history,
application row snapshot, and database authorization controls. Storage object
binaries are outside a logical database dump; the snapshot contained two
bucket metadata rows and zero object rows, so no binary object restore was
required for this drill.

After this evidence and readiness result were recorded, the SQL dump bundle and
disposable local containers/volumes were removed. The linked production project
was not modified.
