# Backup/restore attempt — 2026-08-10

Supabase CLI 2.109.1 reached the linked project, but `db dump` requires Docker
Desktop for its bundled Postgres tooling. Docker is not installed or available
on this workstation. Both generated placeholder files were empty and were
removed; no valid backup or restore is claimed.

The production database was not modified. The readiness field
`backupRestoreTested` remains `false` until a non-empty backup is restored into
an isolated Postgres/Supabase project and validated.
