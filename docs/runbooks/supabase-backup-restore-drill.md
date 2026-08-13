# Supabase isolated backup/restore drill

## Safety boundary

This drill must never restore into the linked production project. Use a fresh,
empty Supabase project or a disposable local Supabase stack. Do not place a
database password or connection URL in the repository, shell history, evidence
files, or chat.

The production source is read-only during dump. The disposable target is the
only database modified by restore and validation.

## Prerequisites

1. Docker Desktop available to Supabase CLI.
2. PostgreSQL `psql` available either on the host or inside the disposable
   Supabase database container.
3. Project-pinned Supabase CLI (`2.109.1` in this repository).
4. A fresh target with a project reference different from the linked source.
5. The source and target passwords supplied only through the interactive shell
   or a temporary secret manager.

Run the non-secret preflight:

```powershell
$env:SUPABASE_RESTORE_TARGET_DB_URL='<temporary target connection string>'
$env:SUPABASE_RESTORE_TARGET_PROJECT_REF='<temporary target project ref>'
npm.cmd run ops:supabase:restore-preflight
```

The preflight prints no URL, password, or project reference.

## Backup

Create an ignored working directory under `tmp/`. Follow the current Supabase
CLI procedure to dump roles, schema, data, and migration history:

```powershell
npx.cmd supabase db dump --linked --role-only --file tmp/supabase-restore-drill/roles.sql
npx.cmd supabase db dump --linked --file tmp/supabase-restore-drill/schema.sql
npx.cmd supabase db dump --linked --data-only --use-copy `
  --exclude storage.buckets_vectors --exclude storage.vector_indexes `
  --file tmp/supabase-restore-drill/data.sql
npx.cmd supabase db dump --linked --schema supabase_migrations `
  --file tmp/supabase-restore-drill/history_schema.sql
npx.cmd supabase db dump --linked --schema supabase_migrations --data-only --use-copy `
  --file tmp/supabase-restore-drill/history_data.sql
```

Require every dump to be non-empty before continuing. Stop if any command
fails. Storage objects are not contained in a database backup; inventory and
test them separately if the application depends on Storage.

## Restore

When `psql` is not installed on Windows, use the client inside the disposable
Supabase database container. Copy the dump files only into that target
container, then pass their container paths to `psql`. Confirm the exact target
container ID first; never select a container by an ambiguous partial match.

Before loading data, initialize the disposable target with the Supabase Auth
and Storage services so their managed schema migrations match the dump. A bare
`supabase/postgres` container is not sufficient for current Auth and Storage
tables. If the combined startup is unhealthy, initialize and verify DB + Auth,
preserve the database volume, then initialize and verify DB + Storage.

On Windows, do not rely on piping an interactive password into
`supabase db dump`: the CLI may detach the PostgreSQL container from stdin.
Prompt in Git Bash, export the value only as temporary `PGPASSWORD`, and pass
the environment variable by name to the official PostgreSQL container. Unset
it on every exit path. Never embed the password in the connection URL or
command arguments.

Restore roles, application schema, and data in one transaction. Restore the
project migration history in a second transaction, matching Supabase's current
procedure. Stop on the first error:

```powershell
psql --single-transaction --variable ON_ERROR_STOP=1 `
  --file tmp/supabase-restore-drill/roles.sql `
  --file tmp/supabase-restore-drill/schema.sql `
  --command 'SET session_replication_role = replica' `
  --file tmp/supabase-restore-drill/data.sql `
  --dbname $env:SUPABASE_RESTORE_TARGET_DB_URL

psql --single-transaction --variable ON_ERROR_STOP=1 `
  --file tmp/supabase-restore-drill/history_schema.sql `
  --file tmp/supabase-restore-drill/history_data.sql `
  --dbname $env:SUPABASE_RESTORE_TARGET_DB_URL
```

If the roles phase reports that `supabase_admin` is reserved, preserve the
original dump and create a restore-only copy that comments only the prohibited
`ALTER ROLE "supabase_admin" ...` statement, following Supabase's documented
troubleshooting. Record both hashes and never weaken another role or grant.

## Validation

The drill passes only when all checks succeed:

- all 16 source migration versions exist on the target;
- required schemas, tables, functions, triggers, RLS policies, and grants exist;
- row counts for application tables match the source snapshot;
- a target-only authenticated test user can execute the permitted lunch-turn
  and Asset Layer read paths;
- anonymous calls to protected RPCs and tables fail;
- Security and Performance Advisors are reviewed on the target;
- no writes or downtime occurred on production;
- the disposable target is removed after evidence is archived according to the
  data-retention policy.

Record only timestamps, tool versions, counts, pass/fail results, and the last
six characters of the disposable target reference. Never record credentials or
personal row data.

Reference: <https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore>
