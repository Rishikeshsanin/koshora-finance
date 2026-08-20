# Architecture

Koshora is designed as one product with two persistence modes: a zero-friction recruiter demo and a real authenticated cloud workspace.

## Request flow

### Demo mode

`/demo` renders the same `FinanceApp` product shell used by cloud mode, but persists data in browser `localStorage`. It requires no Supabase configuration and is safe to open during portfolio reviews.

### Cloud mode

`/login` uses Supabase Auth server actions. Confirmed users enter `/app`, where the server validates the session, ensures Koshora membership, seeds starter categories/accounts when needed, and loads user-owned records from `koshora.*`.

Mutations go through `/api/finance`, which operates with the signed-in session and remains subject to RLS.

## Project Hub

Koshora shares a Supabase project with other applications through a control-plane architecture:

```text
hub.*       application registry, membership, migration metadata, audit

auralis.*   App #1 — protected from Koshora
koshora.*   App #2 — Koshora-owned application schema
other.*     protected application schemas
```

The application explicitly targets `koshora` using `supabase.schema("koshora")`; it never treats `public` as its workspace.

## Domain model

The seven Koshora tables are:

- `profiles`
- `categories`
- `accounts`
- `transactions`
- `budgets`
- `recurring_transactions`
- `savings_goals`

`auth.users` is shared identity infrastructure. Koshora authorization additionally requires an active app membership.

## Finance engine

`src/lib/finance.ts` contains deterministic domain logic for summaries, budget status, cash-flow projections, category spend, insights, and reusable demo data. Keeping this logic outside database/UI code makes demo and cloud modes behave consistently and keeps tests deterministic.

## Deployment path

```text
GitHub main
  → GitHub Actions Quality Gate
  → Vercel production build
  → https://koshora-finance.vercel.app
```

Database migrations are separate, app-scoped, and recorded in Project Hub metadata.
