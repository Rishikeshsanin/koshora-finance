# Koshora

[![Quality Gate](https://github.com/Rishikeshsanin/koshora-finance/actions/workflows/ci.yml/badge.svg)](https://github.com/Rishikeshsanin/koshora-finance/actions/workflows/ci.yml)

> **Clarity for every rupee.** A production-minded personal-finance workspace for transactions, budgets, savings goals, recurring commitments, and explainable cash-flow insights.

## Live experience

- **Production:** https://koshora-finance.vercel.app
- **Recruiter demo:** https://koshora-finance.vercel.app/demo
- **Cloud workspace:** `/login` → `/app` after the final Data API/Auth/Vercel activation steps

The recruiter demo is fully interactive and works without Supabase. Demo data stays in the browser.

## Current backend status

Koshora is registered in Supabase Project Hub as **App #2** with schema `koshora`.

Verified database checkpoint:

- app status: `active`
- 7 Koshora finance tables
- RLS enabled on all 7 user-facing tables
- 28 Koshora RLS policies
- 9 registered Koshora resources
- 2 recorded Koshora migrations
- Auralis remains App #1 on `auralis.*`

The remaining production activation work is API exposure, Auth redirect configuration, Vercel environment variables, and end-to-end authenticated QA.

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
  ├─ auralis.*             App #1 (protected from Koshora)
  ├─ koshora.*             App #2 / this app only
  └─ other_app.*           protected from Koshora
```

Demo mode and cloud mode share the same UI and finance engine.

## Project Hub boundary

Koshora uses the shared Supabase **Project Hub** model.

- App number: `2`
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

Project Hub architecture v2 uses two Koshora migrations:

1. `database/koshora__000_register_app.sql` — Hub-admin registration; records App #2, acknowledges the repository safety contract, asserts scope, and creates only the empty isolated `koshora` schema.
2. `database/koshora__001_core_finance_backend.sql` — normal App #2 backend migration; creates the finance tables/functions, enables membership-gated RLS, registers Koshora resources/version metadata, and marks Koshora active.

The older `database/hub_onboarding.sql`, `database/schema.sql`, and `database/hub_finalize.sql` files are intentionally deprecated stubs and must not be used.

Do not run any Koshora migration unless the live `hub.read_me_first` notice has been reviewed first.

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
  koshora__000_register_app.sql           App #2 registration / empty schema
  koshora__001_core_finance_backend.sql   isolated finance backend + RLS
  hub_onboarding.sql                      deprecated guard stub
  schema.sql                              deprecated guard stub
  hub_finalize.sql                        deprecated guard stub

AGENTS.md                         agent boundary
SUPABASE_HUB_RULES.md             Project Hub rules
```

## Production activation checklist

Completed:

1. read `hub.read_me_first`
2. verify the Koshora registry entry
3. run `hub.assert_app_scope('koshora', 'koshora')`
4. register App #2 and apply the isolated finance backend
5. verify 7/7 tables have RLS and all 28 policies exist
6. verify Auralis remains App #1 and Koshora has no cross-app ownership

Remaining before cloud mode is considered production-ready:

7. run rollback-only anonymous/non-member/cross-app isolation checks
8. run Supabase Security and Performance Advisors
9. expose only `koshora` through the Data API
10. add only the Koshora production Auth redirect
11. configure the project URL + publishable key in Vercel
12. test signup, membership bootstrap, same-user CRUD, different-user denial, and logout

Project-wide changes remain limited to the explicitly reviewed Koshora Data API exposure and Koshora Auth redirect. No other Hub app settings are changed.

## Engineering decisions worth discussing in interviews

**Why dual demo/cloud mode?** Recruiters get a zero-friction product demo while the same UI still supports a real authenticated persistence architecture.

**Why membership-gated RLS?** Shared Supabase Auth means `auth.uid()` identifies a user but does not prove that user belongs to Koshora.

**Why a dedicated application schema?** It limits accidental cross-app access and makes ownership, migrations, and security review auditable.

**Why no service-role key in the app?** RLS remains the authorization boundary instead of being bypassed by ordinary server code.

## License

MIT — see [`LICENSE`](LICENSE).
