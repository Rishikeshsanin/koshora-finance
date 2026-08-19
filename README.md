# Koshora

> **Clarity for every rupee.** A production-minded personal-finance workspace for transactions, budgets, savings goals, recurring commitments, and explainable cash-flow insights.

Koshora is a final-year portfolio project designed to feel like a coherent fintech product rather than a tutorial expense tracker. It combines a fast recruiter demo with an authenticated Supabase-backed workspace, so the same interface can be explored instantly and also used with private, per-user data.

## Live experience

- **Recruiter demo:** `/demo` — interactive sample data persisted only in the browser.
- **Private workspace:** `/login` → `/app` — email/password authentication with Supabase.
- **Production URL:** added after the first Vercel production deployment.

## What makes it different

### A dashboard that explains, not just displays
Koshora computes current balance, monthly income and expenses, savings rate, month-over-month expense movement, category concentration, budget remaining, and a financial-health signal from the same underlying transaction model.

### Explainable forecasting
The month-end forecast is intentionally rule/statistics based. It projects variable spending from observed daily behavior and known recurring commitments, then exposes a confidence label instead of pretending to be AI.

### Budget risk before overspend
Category budgets calculate amount used, amount remaining, utilization percentage, and risk state. The Insights view surfaces categories approaching or exceeding their limits.

### A real recruiter demo
The public demo supports adding/editing/deleting transactions, filters, budgets, savings goals, accounts, exports, themes, and reset-to-seed behavior. It is not a screenshot-only mockup.

## Features

- Income, expense, and transfer transactions
- Edit/delete/search/filter/sort transaction history
- Category-aware spending analysis
- Multiple account types: bank, cash, wallet, credit, savings
- Monthly category budgets and overspend warnings
- Savings goals and contributions
- Recurring-payment visibility
- Six-month cash-flow visualization
- Spending-by-category visualization
- Explainable month-end spending projection
- Rule-based spending insights and budget-risk radar
- CSV and JSON export
- INR-first formatting using the Indian numbering system
- Light, dark, and system themes
- Responsive desktop/tablet/mobile layouts
- Browser-only seeded recruiter demo
- Supabase authentication and private cloud workspace
- Row Level Security plus ownership-aware foreign keys

## Architecture

```text
Browser
  ├─ /demo  ───────────────> FinanceApp + localStorage demo repository
  └─ /app (authenticated) ─> Server Components
                               │
                               ├─ Supabase SSR session / getClaims()
                               ├─ read model -> Postgres (RLS)
                               └─ /api/finance mutations
                                      │
                                      └─ validation + owner-scoped writes

Shared finance engine
  ├─ summaries
  ├─ category aggregation
  ├─ budget utilization
  ├─ cash-flow series
  ├─ insights
  └─ month-end forecast
```

The demo and cloud modes deliberately share the same UI and calculation engine. This prevents the portfolio demo from becoming a separate fake implementation and keeps product behavior consistent.

## Stack

- **Next.js 16 / React 19 / TypeScript** — App Router, Server Components, server actions, route handlers
- **Supabase** — PostgreSQL, Auth, SSR session handling, Row Level Security
- **Custom CSS design system** — no template dependency; responsive tokens, themes, motion and states are owned by the project
- **Vercel** — intended production host
- **Node test runner** — lightweight deterministic tests for the finance engine
- **ESLint + TypeScript** — static quality gates

## Security model

Koshora never requests banking passwords or direct bank credentials.

The cloud workspace uses the authenticated Supabase user ID as the ownership boundary. Every exposed table has RLS enabled. SELECT/INSERT/UPDATE/DELETE policies restrict rows to `auth.uid()`, and UPDATE policies use both `USING` and `WITH CHECK`. Finance relationships use composite ownership foreign keys such as `(account_id, user_id)` so a user cannot reference another user's account/category by guessing an ID. Server mutation routes also derive the user from the session and scope writes by owner.

Only publishable Supabase credentials belong in browser-visible environment variables. Never expose a Supabase secret/service-role key to the frontend.

## Database

The schema lives in [`database/schema.sql`](database/schema.sql).

Core tables:

- `profiles`
- `categories`
- `accounts`
- `transactions`
- `budgets`
- `recurring_transactions`
- `savings_goals`

Indexes cover common user/date/category/account and upcoming-recurring queries. Constraints enforce positive amounts, allowed types, valid transfer shape, unique monthly category budgets, and ownership-aware references.

## Local development

### 1. Install

```bash
npm install
```

### 2. Configure environment

Copy `.env.example` to `.env.local` and add your Supabase values:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
```

The `/demo` route works without Supabase configuration.

### 3. Apply database schema

Run `database/schema.sql` in the dedicated Supabase project, then verify Security and Performance advisors before production use.

### 4. Run

```bash
npm run dev
```

Open `http://localhost:3000`.

## Quality gates

```bash
npm run test
npm run typecheck
npm run lint
npm run build
```

The repository CI workflow runs the static checks and production build on pushes/PRs.

## Project structure

```text
src/
  app/
    api/finance/        authenticated mutations
    app/                private workspace
    auth/               email confirmation + signout
    demo/               public interactive demo
    login/              authentication UI/actions
  components/
    finance-app.tsx     shared product experience
  lib/
    finance.ts          calculation/domain engine
    cloud-data.ts       Supabase read model
    supabase/           browser/server/session clients
database/
  schema.sql            schema, constraints, indexes, RLS
 tests/
  finance.test.ts       domain tests
.github/workflows/
  ci.yml                quality gate
```

## Deployment

Recommended production flow:

1. Create a dedicated Supabase project in `ap-south-1`.
2. Apply `database/schema.sql` and run Supabase security/performance advisors.
3. Add the production URL to Supabase Auth redirect configuration.
4. Configure the three public environment variables in Vercel.
5. Deploy the GitHub `main` branch to Vercel.
6. Test `/`, `/demo`, `/login`, sign-up confirmation, `/app`, CRUD, logout, mobile layout, and exports against the production URL.

## Engineering decisions worth discussing in interviews

**Why no “AI” label?** The forecasting feature is deterministic and explainable. For personal-finance software, a simple model whose assumptions can be stated is more defensible than adding an LLM for branding.

**Why a dual demo/cloud mode?** Recruiters can test the product without account friction while the authenticated architecture still demonstrates real authorization and persistence.

**Why custom visualizations?** The current chart set is small enough to implement accessibly with CSS/SVG, avoiding a large charting dependency. A heavier visualization library can be added only when interaction complexity justifies it.

**How is cross-user leakage prevented?** RLS protects rows, API writes are owner-scoped, and ownership-aware composite foreign keys protect relationships.

## Roadmap

The highest-value next extensions are recurring-transaction CRUD/detection, CSV import with preview/mapping, monthly review reports, optional PWA/offline support, and richer E2E coverage once cloud deployment is live. They are intentionally secondary to correctness and cohesion of the core product.

## License

MIT — see [`LICENSE`](LICENSE).
