# Security Policy

Koshora is a portfolio personal-finance application and does not connect directly to banks or request banking credentials.

## Reporting

Please report a security issue privately to the repository owner rather than opening a public issue containing exploit details or user data.

## Security boundaries

- Supabase Auth establishes identity.
- Public finance tables use Row Level Security.
- Every finance write is owner-scoped.
- Ownership-aware foreign keys prevent cross-user relationship references.
- Only Supabase publishable keys may be exposed to the browser.
- `.env*` files are ignored except `.env.example`.
- Inputs are validated again at the server mutation boundary.

Never commit a database password, JWT secret, Supabase secret/service-role key, OAuth client secret, or Vercel token.
