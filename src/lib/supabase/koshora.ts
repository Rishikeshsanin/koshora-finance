import type { SupabaseClient } from "@supabase/supabase-js";

export const KOSHORA_SCHEMA = "koshora" as const;

export function koshoraDb(supabase: SupabaseClient) {
  return supabase.schema(KOSHORA_SCHEMA);
}

export async function ensureKoshoraMembership(supabase: SupabaseClient) {
  const db = koshoraDb(supabase);
  const { data, error } = await db.rpc("koshora_join_current_user");
  if (error) throw error;
  if (data !== true) throw new Error("Koshora membership is not active for this account.");
}
