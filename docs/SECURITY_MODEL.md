# Security model

Koshora’s security goal is simple: a user should see and mutate only Koshora data that belongs to that user, while Koshora itself must not gain access to another Project Hub application.

## Trust boundaries

### 1. Authentication is not application authorization

All Project Hub apps share Supabase `auth.users`. A valid `auth.uid()` proves identity, not Koshora membership.

Koshora policies therefore require:

```sql
(select hub.current_user_has_app('koshora'))
and (select auth.uid()) = user_id
```

### 2. One application schema

Koshora owns `koshora.*` only. Ordinary application migrations must not create app tables in `public` or modify `auralis.*`, another app schema, `auth.*`, `storage.*`, or `realtime.*`.

### 3. Row Level Security is the data boundary

All seven user-facing Koshora tables have RLS enabled. Ordinary app code does not depend on a service-role key to bypass those policies.

### 4. Ownership-aware references

Transactions and budgets use ownership-aware foreign-key shapes so a user cannot link a row to another user’s account/category merely by providing a UUID.

## Membership bootstrap

`koshora.koshora_join_current_user()` is intentionally narrow: it can enroll only the currently authenticated user into Koshora. It cannot grant membership in another application and cannot silently reactivate a disabled membership.

## Verified checks

The production hardening pass confirmed:

- anonymous schema usage: denied
- authenticated schema usage: allowed
- service-role schema usage is not part of ordinary Koshora access
- simulated authenticated non-member: `is_koshora_member = false`
- visible Koshora rows for that simulated non-member: `0`
- forbidden cross-app foreign keys: `0`
- policies referencing Auralis: `0`
- off-scope Koshora Hub resources: `0`

## RLS performance

The first secure policies called `auth.uid()` and the Hub membership function directly. Supabase Performance Advisor correctly flagged repeated per-row evaluation. Migration `koshora__002_optimize_rls_initplans.sql` changed those expressions to scalar subqueries, preserving authorization semantics while allowing PostgreSQL to evaluate session/membership checks once per statement.

After rerunning the advisor: **0 errors / 0 warnings**.

## Shared warning ownership

Security Advisor currently reports warnings for the shared Project Hub helper `public.rls_auto_enable()`. Koshora deliberately does not modify that function because it is shared infrastructure outside App #2 ownership.

## Secrets

Browser-facing configuration may contain the Supabase project URL and publishable key. Never commit or expose database passwords, service-role keys, secret API keys, or real financial records.

Security reports should follow [`SECURITY.md`](../SECURITY.md).
