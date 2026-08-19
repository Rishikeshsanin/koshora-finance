# Koshora release readiness

## Public demo

The landing page and `/demo` experience are deployment-ready without a database. Demo data is browser-local and no banking credentials are requested.

## Cloud workspace

`/login` and `/app` are implemented for a dedicated Supabase project. Until Supabase environment variables are configured, cloud routes fail closed into the login/demo experience rather than exposing a backend configuration error.

A Koshora deployment must use its **own Supabase project**. Do not point the application at an unrelated project's database simply to avoid provisioning a dedicated backend.

## Release gate

Every pull request and push to `main` runs the following read-only GitHub Actions gate from the committed dependency lockfile:

```bash
npm ci
npm run test
npm run typecheck
npm run lint
npm run build
```

The production deployment should be promoted only after this gate passes and the live `/`, `/demo`, `/login`, mobile layout, exports, and authenticated flows have been smoke-tested.
