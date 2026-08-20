import type { SupabaseClient } from "@supabase/supabase-js";
import { DEFAULT_CATEGORIES, type FinanceData } from "@/lib/finance";
import { koshoraDb } from "@/lib/supabase/koshora";

function num(value: unknown) {
  return typeof value === "number" ? value : Number(value ?? 0);
}

export async function ensureStarterData(supabase: SupabaseClient, userId: string) {
  const db = koshoraDb(supabase);
  const [{ count: categoryCount }, { count: accountCount }] = await Promise.all([
    db.from("categories").select("id", { count: "exact", head: true }).eq("user_id", userId),
    db.from("accounts").select("id", { count: "exact", head: true }).eq("user_id", userId),
  ]);

  if (!categoryCount) {
    const { error } = await db.from("categories").insert(
      DEFAULT_CATEGORIES.map((c) => ({
        id: crypto.randomUUID(),
        user_id: userId,
        slug: c.id,
        name: c.name,
        kind: c.kind,
        icon: c.icon,
        accent: c.accent,
      })),
    );
    if (error) throw error;
  }

  if (!accountCount) {
    const { error } = await db.from("accounts").insert([
      { user_id: userId, name: "Main Bank", type: "bank", opening_balance: 0 },
      { user_id: userId, name: "Cash", type: "cash", opening_balance: 0 },
    ]);
    if (error) throw error;
  }
}

export async function loadFinanceData(supabase: SupabaseClient, userId: string): Promise<FinanceData> {
  const db = koshoraDb(supabase);
  const [categoriesR, accountsR, txR, budgetsR, goalsR, recurringR] = await Promise.all([
    db.from("categories").select("id,slug,name,kind,icon,accent").eq("user_id", userId).order("name"),
    db.from("accounts").select("id,name,type,opening_balance").eq("user_id", userId).order("created_at"),
    db.from("transactions").select("id,type,amount,description,note,category_id,account_id,to_account_id,occurred_on,is_recurring").eq("user_id", userId).order("occurred_on", { ascending: false }).limit(500),
    db.from("budgets").select("id,category_id,month_start,amount_limit").eq("user_id", userId).order("month_start", { ascending: false }),
    db.from("savings_goals").select("id,name,current_amount,target_amount,target_date").eq("user_id", userId).order("created_at"),
    db.from("recurring_transactions").select("id,name,amount,type,category_id,account_id,next_date,frequency").eq("user_id", userId).eq("active", true).order("next_date"),
  ]);

  const firstError = [categoriesR.error, accountsR.error, txR.error, budgetsR.error, goalsR.error, recurringR.error].find(Boolean);
  if (firstError) throw firstError;

  const accountRows = accountsR.data ?? [];
  const txRows = txR.data ?? [];
  const balances = new Map<string, number>(accountRows.map((a) => [a.id, num(a.opening_balance)]));
  for (const tx of txRows) {
    if (tx.account_id) {
      const current = balances.get(tx.account_id) ?? 0;
      if (tx.type === "income") balances.set(tx.account_id, current + num(tx.amount));
      if (tx.type === "expense") balances.set(tx.account_id, current - num(tx.amount));
      if (tx.type === "transfer") balances.set(tx.account_id, current - num(tx.amount));
    }
    if (tx.type === "transfer" && tx.to_account_id) {
      balances.set(tx.to_account_id, (balances.get(tx.to_account_id) ?? 0) + num(tx.amount));
    }
  }

  return {
    categories: (categoriesR.data ?? []).map((c) => ({ id: c.id, name: c.name, kind: c.kind, icon: c.icon, accent: c.accent })),
    accounts: accountRows.map((a) => ({ id: a.id, name: a.name, type: a.type, balance: balances.get(a.id) ?? 0 })),
    transactions: txRows.map((t) => ({
      id: t.id,
      type: t.type,
      amount: num(t.amount),
      description: t.description,
      note: t.note ?? undefined,
      categoryId: t.category_id ?? undefined,
      accountId: t.account_id ?? undefined,
      toAccountId: t.to_account_id ?? undefined,
      date: t.occurred_on,
      recurring: Boolean(t.is_recurring),
    })),
    budgets: (budgetsR.data ?? []).map((b) => ({ id: b.id, categoryId: b.category_id, month: String(b.month_start).slice(0, 7), limit: num(b.amount_limit) })),
    goals: (goalsR.data ?? []).map((g) => ({ id: g.id, name: g.name, current: num(g.current_amount), target: num(g.target_amount), targetDate: g.target_date })),
    recurring: (recurringR.data ?? []).map((r) => ({ id: r.id, name: r.name, amount: num(r.amount), type: r.type, categoryId: r.category_id ?? undefined, accountId: r.account_id ?? undefined, nextDate: r.next_date, frequency: r.frequency })),
  };
}
