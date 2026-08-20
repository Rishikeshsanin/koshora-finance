# Interview guide

Use these notes to explain Koshora clearly in a technical interview without overselling it.

## 30-second summary

> Koshora is a Next.js personal-finance workspace with a zero-friction recruiter demo and a real authenticated cloud mode. The interesting engineering part is the data boundary: it shares a Supabase Project Hub with another app, so authentication alone is not enough. Every finance table lives in `koshora.*` and RLS requires both Koshora membership and row ownership.

## Strong discussion topics

### Why two modes?

The demo proves product behavior immediately without forcing an interviewer to create an account. The private mode proves the same UI can run against real Auth/Postgres persistence.

### Why not put tables in `public`?

Koshora is one application in a shared Supabase Project Hub. A dedicated schema makes ownership explicit, makes migrations auditable, and reduces accidental cross-app access.

### Why `auth.uid()` was not enough

All Hub apps share `auth.users`. A person can exist in shared Auth without belonging to Koshora. RLS therefore combines app membership with row ownership.

### What did the performance advisor teach you?

The first RLS policies were secure but called `auth.uid()` and the membership helper per row. Supabase flagged 28 warnings. I changed them to scalar subqueries/InitPlans, reran the advisor, and got 0 warnings without weakening authorization.

### Why deterministic forecasting?

The forecast is derived from real transaction behavior and is explainable. Calling that “AI” would make the project sound less rigorous, not more.

### How do you protect account/category references?

Transactions and budgets use ownership-aware foreign-key shapes, not only RLS, so a user cannot point a valid row at another user’s account/category UUID.

### What would you build next?

Good answers include recurring-transaction automation, better import workflows, richer audit history, accessibility testing, Playwright end-to-end tests, and privacy-preserving analytics. Keep future work inside the same Koshora boundary.

## Useful numbers to remember

- App #2 in Project Hub
- 7 finance tables
- 28 optimized RLS policies
- 9 registered Koshora Hub resources at the core-backend checkpoint
- 3 Koshora migrations through the RLS optimization
- 6 deterministic finance tests
- 0 Performance Advisor errors/warnings after optimization

## Avoid saying

- “AI-powered” unless describing a real AI feature
- “bank-grade security” or other unsupported security claims
- “zero vulnerabilities”
- “fully tested” when discussing flows that were only smoke-tested

Prefer concrete facts: RLS, app membership, isolation tests, CI, advisor results, and the deployed demo.
