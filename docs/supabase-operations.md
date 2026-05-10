# Supabase Operations

## Environment Variables

Use server-side environment variables:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

Do not expose any service-role key in client bundles or route responses.

## Schema

Apply `docs/supabase-schema.sql` to create:

- `fact_check_sessions` (research log persistence)
- `fact_check_evidence_sources` (user-registered evidence registry; seed catalog stays in `data/evidence-sources.ts`)

## RLS / Access Policy (Prototype)

For this research prototype, use anon-key access with shared table behavior:

1. Enable RLS on `fact_check_sessions` and `fact_check_evidence_sources`.
2. Allow `select`, `insert`, `update`, and `delete` for `anon` role.
3. Do not add per-user ownership filters in this phase.

## Safety Notes

- Full delete on `fact_check_sessions` is destructive and affects all users.
- UI requires explicit `DELETE` confirmation.
- API re-validates `confirmToken` before delete.
- Keep periodic CSV backups for recovery because restore flow is out of scope.

## Evidence Sources Notes

- `fact_check_evidence_sources.url` is uniquely indexed by `lower(url)` so duplicate registration is rejected at the DB layer (also pre-checked by the API for clearer error messaging).
- Soft-deactivation is preferred over hard deletion: flip `status` to `inactive` via `PATCH /api/evidence-sources/:id`. Deactivated rows remain queryable but are excluded from analysis matching.

