# Koshora — Supabase Project Hub Rules

Koshora shares one Supabase Project Hub with independent applications. Treat every other app as a separate company.

## Assigned scope

- App slug: `koshora`
- App schema: `koshora`
- Allowed database scope: `koshora.*`
- Storage buckets, RPCs, Edge Functions, Realtime channels, and external resources must be Koshora-prefixed and registered to Koshora before use.

## Mandatory preflight

Before any Supabase write, run and review:

```sql
select * from hub.read_me_first;

select slug, display_name, schema_name, status
from hub.apps
where slug = 'koshora';

select hub.assert_app_scope('koshora', 'koshora');
```

If Koshora is not registered, the normal app migration must not run. Hub onboarding is a separate Hub-admin operation.

## Protected scope

Do not modify:

- `hub.*` except an explicitly approved Koshora onboarding/control-plane operation
- `public.*`
- `auth.*`
- `storage.*`
- `realtime.*`
- any other application schema
- project keys, region, plan, compute, billing, pause/delete state, or shared project settings

## Database rules

- No Koshora application table belongs in `public`.
- Use fully-qualified names such as `koshora.transactions`.
- Keep RLS enabled on every user-facing table.
- Authorization must require both the authenticated owner and active Koshora membership.
- Do not rely on frontend checks for authorization.
- Never run unscoped `DROP`, `TRUNCATE`, `DELETE`, or major `ALTER` operations.
- Never run `DROP SCHEMA ... CASCADE`.
- Never add cross-app foreign keys or dependencies without explicit approval.

## Shared Auth boundary

All Hub applications share `auth.users`. An Auth user is not automatically a Koshora member.

Koshora data policies must require:

```sql
(select auth.uid()) = user_id
and (select hub.current_user_has_app('koshora'))
```

Profiles use the same rule with the profile `id` as the owner ID.

Any mechanism that creates Koshora membership must be narrowly scoped to Koshora and must never grant membership to another app.

## Secrets

Koshora uses only Supabase publishable credentials in ordinary application code. The project-level secret/service-role credential is Hub-admin only and must never be committed to GitHub, exposed to the browser, or used as the normal Koshora server credential.

## Shared setting changes

Adding `koshora` to a project-wide exposed-schema list, modifying Auth redirect settings, rotating project keys, or making any other project-wide configuration change requires an impact review and explicit user approval before execution.

## Validation after structural changes

1. Run Koshora migration checks.
2. Run Supabase security advisor.
3. Run Supabase performance advisor.
4. Verify anonymous users cannot read/write Koshora data.
5. Verify an authenticated non-member cannot read/write Koshora data.
6. Verify a Koshora member can access only their own rows.
7. Verify a different Koshora user cannot access another user's rows.
8. Verify another Hub app remains unaffected.

When isolation and convenience conflict, choose isolation.
