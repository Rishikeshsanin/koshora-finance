# Koshora

[![Quality Gate](https://github.com/Rishikeshsanin/koshora-finance/actions/workflows/ci.yml/badge.svg)](https://github.com/Rishikeshsanin/koshora-finance/actions/workflows/ci.yml)

> **Clarity for every rupee.** A production-minded personal-finance workspace for transactions, budgets, savings goals, recurring commitments, and explainable cash-flow insights.

## Live experience

- **Production:** https://koshora-finance.vercel.app
- **Recruiter demo:** https://koshora-finance.vercel.app/demo
- **Cloud workspace:** `/login` → `/app` after the Project Hub backend is activated

The recruiter demo is fully interactive and works without Supabase. Demo data stays in the browser.

## Why Koshora is different

Koshora is intentionally more than CRUD. It combines a shared finance domain model with:

- income, expense, and transfer transactions
- multiple account types
- monthly category budgets and overspend warnings
- savings goals and contributions
- recurring-payment visibility
- six-month cash-flow visualization
- category spending analysis
- explainable month-end forecasting
- rule-based insights and budget-risk signals
- CSV transaction export and JSON backup
- INR-first formatting
- responsive light/dark/system themes

The forecast is deterministic and explainable rather than branded as “AI” for presentation value.

## Architecture

```text
Browser
  ├─ /demo
  │    └─ FinanceApp + localStorage
  │
  └─ /app
       ├─ Supabase Auth session
       ├─ Koshora membership bootstrap
       ├─ koshora.* read model
       └─ /api/finance mutations

Supabase Project Hub
  ├─ hub.*                 shared control plane (protected)
  ├─ koshora.*             this app only
  └─ other_app.*           protected from Koshora
```

Demo mode and cloud mode share the same UI and finance engine.

## Project Hub boundary

Koshora uses the shared Supabase **Project Hub** model.

- App slug: `koshora`
- Assigned schema: `koshora`
- `public` is **not** an application workspace
- every app-facing table uses RLS
- policies require both row ownership and active Koshora membership
- application code targets `koshora` explicitly with `supabase.schema("koshora")`
- project-level secret/service-role credentials are not used by ordinary Koshora code
- all other application schemas are treated as separate-company boundaries

Before any Supabase change, read [`AGENTS.md`](AGENTS.md) and [`SUPABASE_HUB_RULES.md`](SUPABASE_HUB_RULES.md).

## Database migration order

The database scripts are deliberately split by responsibility:

1. `database/hub_onboarding.sql` — **Hub admin only**; registers Koshora and creates the isolated schema.
2. `database/schema.sql` — normal Koshora app migration; starts with `hub.assert_app_scope('koshora', 'koshora')` and modifies only `koshora.*`.
3. `database/hub_finalize.sql` — **Hub admin only**; records the Koshora RPC/migration and marks the app active after validation.

Do not run these scripts unless the live `hub.read_me_first` notice has been reviewed first.

## Authorization model

All Hub apps share `auth.users`, so authentication alone is not Koshora authorization.

Koshora RLS requires:

```sql
(select hub.current_user_has_app('koshora'))
and (select auth.uid()) = user_id
```

A narrow `koshora.koshora_join_current_user()` security-definer RPC can enroll only the currently authenticated user into Koshora. It cannot create membership in another app and cannot reactivate a disabled membership.

Ownership-aware composite foreign keys also prevent a transaction or budget from referencing another user's account/category by UUID.

## Stack

- Next.js 16
- React 19
- TypeScript
- Supabase Auth + PostgreSQL + RLS
- Vercel
- GitHub Actions
- custom CSS/SVG visual system

## Local development

```bash
npm ci
npm run dev
```

The demo requires no environment variables.

For Hub cloud mode:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
```

Only publishable credentials belong in app environment variables.

## Quality gate

```bash
npm run test
npm run typecheck
npm run lint
npm run build
```

GitHub Actions runs the same deterministic `npm ci` release gate on pull requests and `main`.

Current verified finance tests: **6/6**.

## Project structure

```text
src/
  app/
    api/finance/                  authenticated mutations
    app/                          private cloud workspace
    auth/                         confirmation + POST sign-out
    demo/                         public recruiter demo
    login/                        auth UI and actions
  components/                     finance product views
  lib/
    finance.ts                    domain/calculation engine
    cloud-data.ts                 Koshora cloud read model
    supabase/
      koshora.ts                  schema + membership boundary
      server.ts                   SSR server client
      browser.ts                  browser client

database/
  hub_onboarding.sql              Hub-admin onboarding
  schema.sql                      isolated koshora.* migration
  hub_finalize.sql                Hub-admin registry finalization

AGENTS.md                         agent boundary
SUPABASE_HUB_RULES.md             Project Hub rules
```

## Production activation checklist

Before cloud mode is enabled in production:

1. read `hub.read_me_first`
2. verify the Koshora registry entry
3. run `hub.assert_app_scope('koshora', 'koshora')`
4. apply the three migration stages in order
5. run Supabase security and performance advisors
6. test anonymous access denial
7. test authenticated non-member denial
8. test same-user access
9. test different-user denial
10. confirm another Hub app is unaffected
11. only then connect the frontend

Project-wide changes such as adding `koshora` to the Data API exposed-schema list or changing shared Auth redirect settings require explicit impact review before execution.

## Engineering decisions worth discussing in interviews

**Why dual demo/cloud mode?** Recruiters get a zero-friction product demo while the same UI still supports a real authenticated persistence architecture.

**Why membership-gated RLS?** Shared Supabase Auth means `auth.uid()` identifies a user but does not prove that user belongs to Koshora.

**Why a dedicated application schema?** It limits accidental cross-app access and makes ownership, migrations, and security review auditable.

**Why no service-role key in the app?** RLS remains the authorization boundary instead of being bypassed by ordinary server code.

## License

MIT — see [`LICENSE`](LICENSE).
