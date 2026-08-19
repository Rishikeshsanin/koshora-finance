# Koshora

[![Quality Gate](https://github.com/Rishikeshsanin/koshora-finance/actions/workflows/ci.yml/badge.svg)](https://github.com/Rishikeshsanin/koshora-finance/actions/workflows/ci.yml)

> **Clarity for every rupee.** A production-minded personal-finance workspace for transactions, budgets, savings goals, recurring commitments, and explainable cash-flow insights.

Koshora is built to feel like a coherent fintech product rather than a tutorial expense tracker. It combines a zero-friction recruiter demo with a secure Supabase cloud architecture, so the same interface can be explored instantly and can also operate as a private per-user finance workspace when a dedicated backend is configured.

## Experience

- **Live production:** https://koshora-finance.vercel.app
- **Recruiter demo:** https://koshora-finance.vercel.app/demo — fully interactive sample data persisted only in the browser.
- **Cloud workspace:** `/login` → `/app` — Supabase email/password authentication and private Postgres persistence when a dedicated backend is configured.
- **Landing page:** `/` — product positioning, feature story, and direct demo entry.

The demo does **not** require Supabase, a bank connection, or an account. Cloud authentication is intentionally disabled on the current production deployment until Koshora receives its own isolated Supabase project.

## Why Koshora is different

### A dashboard that explains, not just displays
Koshora computes current balance, monthly income and expenses, savings rate, month-over-month expense movement, category concentration, budget remaining, and a financial-health signal from one shared transaction model.

### Explainable forecasting
The month-end forecast is intentionally deterministic. It projects variable spending from observed daily behavior plus known recurring commitments and exposes a confidence label instead of branding ordinary arithmetic as “AI.”

### Budget risk before overspend
Category budgets calculate utilization, remaining allowance, overspend, and risk state. The Insights view surfaces categories approaching or crossing their limits.

### A real recruiter demo
The public demo supports transaction CRUD, search/filter/sort, budgets, savings goals, accounts, exports, themes, responsive layouts, and reset-to-seed behavior. It is an interactive product surface—not a screenshot-only mockup.

## Core features

- Income, expense, and account-transfer transactions
- Add, edit, delete, search, filter, and sort transaction history
- Category-aware spending analysis
- Bank, cash, wallet, credit, and savings accounts
- Monthly category budgets with overspend warnings
- Savings goals and contributions
- Recurring-payment visibility
- Six-month cash-flow visualization
- Spending-by-category visualization
- Explainable month-end spending forecast
- Rule-based spending insights and budget-risk radar
- CSV transaction export and JSON backup export
- INR-first formatting with Indian digit grouping
- Light, dark, and system themes
- Responsive desktop, tablet, and mobile layouts
- Browser-only recruiter demo using `localStorage`
- Supabase SSR authentication architecture
- PostgreSQL Row Level Security and ownership-aware foreign keys
- Server-side mutation validation and owner-scoped writes

## Architecture

```text
Browser
  ├─ /demo
  │    └─ shared FinanceApp + localStorage demo repository
  │
  └─ /app (authenticated)
       ├─ Next.js Server Component
       ├─ Supabase SSR session / getClaims()
       ├─ cloud read model -> Postgres + RLS
       └─ /api/finance mutations
            └─ validation + authenticated owner-scoped writes

Shared finance domain engine
  ├─ summary metrics
  ├─ category aggregation
  ├─ budget utilization
  ├─ account cash flow
  ├─ insight generation
  ├─ month-end forecast
  └─ CSV export
```

Demo mode and cloud mode deliberately share the same product UI and finance engine. That keeps recruiter-visible behavior aligned with the real authenticated implementation instead of maintaining a separate fake demo.

## Stack

- **Next.js 16 / React 19 / TypeScript** — App Router, Server Components, Server Actions, Proxy, Route Handlers
- **Supabase** — PostgreSQL, Auth, SSR cookie sessions, Row Level Security
- **Custom CSS design system** — responsive tokens, light/dark themes, motion, visualizations, and states without a UI-template dependency
- **Vercel** — production hosting
- **Node test runner** — deterministic finance-domain tests
- **ESLint + TypeScript** — static quality gates
- **GitHub Actions** — reproducible `npm ci` release gate

## Security model

Koshora never requests banking passwords or direct banking credentials.

The cloud workspace uses the authenticated Supabase user ID as the ownership boundary. Every exposed finance table has RLS enabled. SELECT/INSERT/UPDATE/DELETE policies restrict access to `auth.uid()`, and UPDATE policies use both `USING` and `WITH CHECK`.

Relationships are protected too: composite ownership foreign keys such as `(account_id, user_id)` prevent a user from referencing another user's account or category even if an unrelated UUID becomes known. Server mutation routes derive identity from verified Supabase claims and scope writes by both row ID and owner.

The SSR proxy propagates Supabase session cookies **and cache-control headers** during token refreshes, and authenticated API routes return JSON authorization errors instead of HTML redirects. Sign-out is POST-only.

Only Supabase **publishable** credentials belong in browser-visible environment variables. A secret/service-role key must never be exposed to the frontend.

## Database

The production schema lives in [`database/schema.sql`](database/schema.sql).

Core tables:

- `profiles`
- `categories`
- `accounts`
- `transactions`
- `budgets`
- `recurring_transactions`
- `savings_goals`

The schema includes indexes, amount/type constraints, valid-transfer constraints, unique monthly category budgets, RLS policies, and ownership-aware relationships.

## Local development

### 1. Install the locked dependency graph

```bash
npm ci
```

### 2. Optional cloud configuration

Copy `.env.example` to `.env.local` and add values from a **dedicated** Supabase project:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
```

The `/demo` route works without these variables.

### 3. Apply the database schema for cloud mode

Run `database/schema.sql` in the dedicated Supabase project, then review Supabase Security and Performance advisors before production use.

### 4. Run the app

```bash
npm run dev
```

Open `http://localhost:3000`.

## Quality gate

```bash
npm run test
npm run typecheck
npm run lint
npm run build
```

GitHub Actions runs the same sequence from the committed lockfile using `npm ci` on pull requests and pushes to `main`.

The release-hardening gate has verified:

- dependency installation from the lockfile
- all 6 finance-domain tests
- strict TypeScript compilation
- ESLint / Next.js core-vitals rules
- optimized Next.js 16 production build

## Project structure

```text
src/
  app/
    api/finance/                  authenticated finance mutations
    app/                          private cloud workspace
    auth/                         confirmation + POST sign-out routes
    demo/                         public recruiter demo
    login/                        authentication UI and actions
    styles/                       split global design system
    globals.css                   ordered style-module imports
  components/
    finance-app.tsx               shared product orchestration
    finance-overview.tsx          dashboard + visualizations
    finance-transactions.tsx      history/search/filter/sort
    finance-planning.tsx          budgets + savings goals
    finance-insights.tsx          derived insights + risk radar
    finance-accounts-settings.tsx accounts + export/settings
    finance-primitives.tsx        shared finance UI primitives
    finance-views.tsx             view exports
    transaction-modal.tsx         transaction create/edit flow
  lib/
    finance.ts                    finance domain/calculation engine
    cloud-data.ts                 Supabase read model + starter data
    supabase/                     browser/server/session utilities

database/
  schema.sql                      schema, constraints, indexes, RLS

tests/
  finance.test.ts                 deterministic domain tests

.github/workflows/
  ci.yml                          read-only npm-ci release gate
```

## Deployment model

1. `main` deploys to Vercel; `/` and `/demo` work without a database.
2. Create a **dedicated** Supabase project—never reuse another application's database.
3. Apply `database/schema.sql` and review security/performance advisors.
4. Add the Supabase URL and publishable key to Vercel.
5. Configure the production site URL / allowed redirect URLs in Supabase Auth.
6. Verify `/login`, email confirmation, `/app`, CRUD, logout, exports, and responsive layouts against production.

## Engineering decisions worth discussing in interviews

**Why no “AI” label?** The forecast is deterministic and explainable. For personal-finance software, assumptions that can be stated and audited are more defensible than adding an LLM purely for branding.

**Why dual demo/cloud mode?** Recruiters can test the product immediately while the same UI still demonstrates a real authenticated persistence architecture.

**Why custom visualizations?** The current chart set is compact enough to implement accessibly with CSS/SVG without shipping a large chart dependency. A chart library should be introduced only when interaction complexity justifies it.

**How is cross-user leakage prevented?** RLS protects rows, API writes are owner-scoped, verified claims protect server routes, and ownership-aware composite foreign keys protect relationships.

**Why a committed lockfile?** Production, CI, and local development resolve the same dependency graph, making builds reproducible and making `npm ci` a reliable quality gate.

## Roadmap

High-value extensions after the production cloud deployment are recurring-transaction CRUD/detection, CSV import with preview/mapping, monthly review reports, optional PWA/offline support, and richer browser-level E2E coverage.

## License

MIT — see [`LICENSE`](LICENSE).
