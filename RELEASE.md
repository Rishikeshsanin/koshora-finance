# Koshora release readiness

Koshora is deployed at **https://koshora-finance.vercel.app** with both a public recruiter demo and an authenticated private workspace.

## Release gate

Every pull request and push to `main` runs:

```bash
npm ci
npm run test
npm run typecheck
npm run lint
npm run build
```

## Database / security checkpoint

- App #2: `koshora`
- isolated schema: `koshora.*`
- 7 user-facing finance tables
- RLS enabled on all 7
- 28 membership + ownership policies
- non-member visibility test: 0 rows
- forbidden cross-app foreign keys: 0
- policies referencing Auralis: 0
- off-scope Hub resources: 0
- Performance Advisor: 0 errors / 0 warnings after InitPlan optimization

The shared Project Hub `public.rls_auto_enable()` Security Advisor warnings are outside Koshora scope and are intentionally not modified by this application.

## Production smoke checklist

Before calling a release healthy, verify:

- `/` loads
- `/demo` loads and remains interactive
- `/login` loads with sign-in and create-account flows
- signup exposes the Name field and stores `full_name` in Auth metadata
- auth submissions show loading feedback
- unauthenticated `/app` fails closed to `/login`
- authenticated `/app` loads the private workspace
- home navigation recognizes an existing session
- transaction create/update/delete persists in cloud mode
- logout clears the session
- no new Vercel runtime error clusters appear

## Supabase boundary

Before any database change, read `hub.read_me_first`, `AGENTS.md`, and `SUPABASE_HUB_RULES.md`, then require:

```sql
select hub.assert_app_scope('koshora', 'koshora');
```

Do not modify Auralis, another app schema, or shared project-wide settings as part of ordinary Koshora maintenance.
