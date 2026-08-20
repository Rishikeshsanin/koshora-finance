# Changelog

All notable Koshora changes are documented here. Dates use UTC deployment dates.

## 2026-08-20 — Production Hub release

### Added

- Supabase Project Hub registration as **App #2** with schema `koshora`
- seven isolated finance tables with membership-gated Row Level Security
- private cloud workspace with Supabase Auth
- recruiter demo with browser-local persistence
- exact production Auth confirmation redirect
- Koshora Data API exposure
- signup display-name capture in Supabase Auth metadata
- session-aware home navigation for signed-in users
- auth loading state with spinner, disabled submit controls, and progress shimmer
- dedicated Project Hub safety files: `AGENTS.md` and `SUPABASE_HUB_RULES.md`

### Security / performance

- verified anonymous and non-member access denial
- verified zero forbidden cross-app foreign keys
- verified zero Koshora RLS references to Auralis
- optimized all 28 Koshora RLS policies with scalar InitPlans
- reran Supabase Performance Advisor: **0 errors / 0 warnings**

### Deployment

- GitHub Actions quality gate
- Vercel production deployment at `https://koshora-finance.vercel.app`
- runtime fixes for blank Supabase environment variables and unauthenticated `/app` routing

### Documentation

- portfolio-grade README
- architecture and security documentation
- reviewer demo guide
- interview discussion guide
- contributor and community templates
