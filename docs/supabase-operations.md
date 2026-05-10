# Supabase Operations for Research Logs

## Environment Variables

Use server-side environment variables:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

Do not expose any service-role key in client bundles or route responses.

## Schema

Apply `docs/supabase-schema.sql` to create `fact_check_sessions`.

## RLS / Access Policy (Prototype)

For this research prototype, use anon-key access with shared table behavior:

1. Enable RLS on `fact_check_sessions`.
2. Allow `select`, `insert`, and `delete` for `anon` role.
3. Do not add per-user ownership filters in this phase.

## Safety Notes

- Full delete is destructive and affects all users.
- UI requires explicit `DELETE` confirmation.
- API re-validates `confirmToken` before delete.
- Keep periodic CSV backups for recovery because restore flow is out of scope.

