# Demo guide

This is the fastest way to review Koshora as a recruiter, interviewer, or collaborator.

## 60-second path

1. Open **https://koshora-finance.vercel.app/demo**.
2. Check the overview balance, monthly cash flow, budget pulse, and recent transactions.
3. Add a transaction and watch derived values update.
4. Open **Budgets** and adjust a category limit.
5. Open **Goals** and add/contribute to a savings goal.
6. Open **Insights** to see deterministic explanations and month-end projection.
7. Resize to mobile or switch theme.

The recruiter demo stores its sample state only in your browser.

## Cloud path

Open **https://koshora-finance.vercel.app/login** to try the real persistence architecture.

- **Create account** switches the form to signup mode and asks for Name, Email, and Password.
- Name is saved as Supabase Auth `full_name` metadata.
- Auth submissions show loading feedback while the request is processing.
- Email confirmation returns through `/auth/confirm`.
- `/app` loads Koshora-owned cloud data under RLS.
- Returning to the public home page while signed in shows **Open workspace** instead of pretending the session was lost.

## What to inspect in source

- `src/lib/finance.ts` — deterministic finance engine
- `src/components/finance-app.tsx` — shared demo/cloud product shell
- `src/app/api/finance/` — authenticated cloud mutations
- `src/lib/supabase/koshora.ts` — schema + app membership boundary
- `database/koshora__001_core_finance_backend.sql` — RLS/data model
- `database/koshora__002_optimize_rls_initplans.sql` — policy optimization

## What makes it portfolio-worthy

Koshora combines product design, finance-domain logic, responsive UI, deployment, CI, authentication, PostgreSQL modeling, Row Level Security, multi-app database isolation, performance review, and a frictionless demo path in one project.
