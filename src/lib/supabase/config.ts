export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://koshora-finance.vercel.app";

export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  "https://nowlwprtcnieihelqjoa.supabase.co";

export const SUPABASE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  "sb_publishable_487zTc09VarME-Fgf6EYig__47s_JTp";

export const CLOUD_CONFIGURED = Boolean(
  SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY
);
