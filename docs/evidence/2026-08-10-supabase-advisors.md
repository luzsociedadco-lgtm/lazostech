# Supabase Advisors review — 2026-08-10

The linked production project was checked read-only with Supabase CLI 2.109.1.
The advisor returned four warnings and no error-level finding.

## SECURITY DEFINER warnings

The following authenticated RPCs were reported:

- `request_lunch_turn(text, text, text, text)`
- `assign_special_lunch_turn(text)`
- `call_next_lunch_turn()`

Review result:

- `PUBLIC` and `anon` execution are revoked.
- Access is intentionally limited to `authenticated`.
- Every function rejects a missing `auth.uid()`.
- The two monitor functions also call `private.is_ticket_turn_monitor(...)`.
- The hardened request function derives student identity from `user_profiles`
  and the signed JWT; its legacy identity parameters are not trusted.
- The active functions use a fixed empty `search_path` and schema-qualified
  references.

These warnings are accepted as intentional privileged RPC boundaries, not
silently treated as absent. They remain in the external-audit scope.

## Auth warning

Leaked-password protection is disabled. Enabling it in Supabase Auth remains a
deployment action and may depend on the selected project plan. This warning is
not closed by this review.
