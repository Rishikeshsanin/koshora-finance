import { redirect } from "next/navigation";
import FinanceApp from "@/components/finance-app";
import { ensureStarterData, loadFinanceData } from "@/lib/cloud-data";
import { createClient } from "@/lib/supabase/server";

export default async function WorkspacePage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (error || !userId) redirect("/login");
  await ensureStarterData(supabase, userId);
  const financeData = await loadFinanceData(supabase, userId);
  const email = typeof data.claims.email === "string" ? data.claims.email : undefined;
  return <FinanceApp mode="cloud" initialData={financeData} userEmail={email}/>;
}
