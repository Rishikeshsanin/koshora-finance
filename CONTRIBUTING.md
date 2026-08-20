# Contributing to Koshora

Thanks for improving Koshora. The project is intentionally small enough to understand end-to-end, but production-minded enough that changes should preserve its data boundary and release quality.

## Before you change code

1. Read [`AGENTS.md`](AGENTS.md).
2. Read [`SUPABASE_HUB_RULES.md`](SUPABASE_HUB_RULES.md) before any Supabase work.
3. Never assume `public` is a Koshora workspace.
4. Never modify `auralis.*`, another app schema, or shared Project Hub settings as part of an ordinary Koshora change.

## Local setup

```bash
git clone https://github.com/Rishikeshsanin/koshora-finance.git
cd koshora-finance
npm ci
npm run dev
```

The `/demo` route requires no backend configuration.

## Branch naming

Use short, descriptive branches:

```text
feat/budget-alerts
fix/auth-loading
refactor/finance-engine
docs/security-model
```

## Required checks

Before opening a pull request:

```bash
npm run test
npm run typecheck
npm run lint
npm run build
```

A PR should not merge while the GitHub Actions **Quality Gate** is failing.

## Database changes

Koshora is App #2 in Supabase Project Hub and owns only `koshora.*`.

Database changes must:

- start by reviewing `hub.read_me_first`
- pass `hub.assert_app_scope('koshora', 'koshora')`
- use an app-prefixed migration key such as `koshora__003_...`
- stay inside `koshora.*`, except narrow Koshora-owned metadata/audit writes in `hub.*`
- preserve RLS before client access
- preserve Koshora membership + ownership authorization
- avoid destructive or project-wide changes unless explicitly reviewed

## Pull requests

A strong PR explains:

- what changed
- why it is needed
- how it was tested
- whether data/schema/RLS behavior changed
- whether another Hub app could be affected
- screenshots for visible UI changes

Keep changes focused. Separate unrelated refactors from product fixes when possible.
