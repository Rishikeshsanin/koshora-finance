# Supabase Project Hub Boundary

This application uses a shared Supabase Project Hub.

Application: Koshora
Assigned app slug/schema: `koshora`
Repository: `Rishikeshsanin/koshora-finance`

Before any Supabase change:
1. read `hub.read_me_first`,
2. read `SUPABASE_HUB_RULES.md`,
3. verify the `hub.apps` registry entry for `koshora`,
4. run `select hub.assert_app_scope('koshora', 'koshora');`,
5. inspect only `koshora.*` and Koshora-registered resources.

Modify only `koshora.*` plus explicitly approved Koshora resources.

Treat `hub.*`, `public.*`, `auth.*`, `storage.*`, `realtime.*`, and every other application schema as protected.

Never run unscoped destructive SQL.
Never use `DROP SCHEMA ... CASCADE`.
Never disable RLS as a shortcut.
Never create Koshora application tables in `public`.
Never expose a project-level secret/service-role key to Koshora code, GitHub, or browser clients.
Never change shared Auth, API exposure, project keys, billing, region, compute, pause/delete state, or another app resource without explicit impact review and user approval.

When speed and isolation conflict, choose isolation.
