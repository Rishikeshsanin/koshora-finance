import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type Body = { action?: string; payload?: Record<string, unknown> };
const allowedAccountTypes = new Set(["cash", "bank", "credit", "wallet", "savings"]);
const allowedTxTypes = new Set(["expense", "income", "transfer"]);

function text(value: unknown, max = 180) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}
function optionalText(value: unknown, max = 500) {
  const v = text(value, max); return v || null;
}
function id(value: unknown) {
  const v = text(value, 80); return v || null;
}
function money(value: unknown) {
  const n = Number(value); return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : null;
}
function positiveMoney(value: unknown) {
  const n = money(value); return n !== null && n > 0 ? n : null;
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
    const userId = claimsData?.claims?.sub;
    if (claimsError || !userId) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

    const body = await request.json() as Body;
    const action = body.action ?? "";
    const p = body.payload ?? {};
    let query: PromiseLike<{ error: { message: string } | null }>;

    if (action === "transaction.create" || action === "transaction.update") {
      const type = text(p.type, 20);
      const amount = positiveMoney(p.amount);
      const description = text(p.description, 160);
      const rowId = id(p.id);
      const accountId = id(p.accountId);
      const toAccountId = id(p.toAccountId);
      const date = text(p.date, 10);
      if (!rowId || !allowedTxTypes.has(type) || amount === null || !description || !accountId || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return NextResponse.json({ error: "Invalid transaction data." }, { status: 400 });
      }
      if (type === "transfer" && (!toAccountId || toAccountId === accountId)) return NextResponse.json({ error: "Choose a different destination account." }, { status: 400 });
      const values = { user_id: userId, type, amount, description, note: optionalText(p.note), category_id: type === "transfer" ? null : id(p.categoryId), account_id: accountId, to_account_id: type === "transfer" ? toAccountId : null, occurred_on: date, is_recurring: Boolean(p.recurring) };
      query = action.endsWith("create")
        ? supabase.from("transactions").insert({ id: rowId, ...values })
        : supabase.from("transactions").update(values).eq("id", rowId).eq("user_id", userId);
    } else if (action === "transaction.delete") {
      const rowId = id(p.id); if (!rowId) return NextResponse.json({ error: "Invalid transaction id." }, { status: 400 });
      query = supabase.from("transactions").delete().eq("id", rowId).eq("user_id", userId);
    } else if (action === "budget.create" || action === "budget.update") {
      const rowId = id(p.id), categoryId = id(p.categoryId), limit = positiveMoney(p.limit), month = text(p.month, 7);
      if (!rowId || !categoryId || limit === null || !/^\d{4}-\d{2}$/.test(month)) return NextResponse.json({ error: "Invalid budget data." }, { status: 400 });
      const values = { user_id: userId, category_id: categoryId, amount_limit: limit, month_start: `${month}-01` };
      query = action.endsWith("create") ? supabase.from("budgets").insert({ id: rowId, ...values }) : supabase.from("budgets").update(values).eq("id", rowId).eq("user_id", userId);
    } else if (action === "budget.delete") {
      const rowId = id(p.id); if (!rowId) return NextResponse.json({ error: "Invalid budget id." }, { status: 400 });
      query = supabase.from("budgets").delete().eq("id", rowId).eq("user_id", userId);
    } else if (action === "goal.create" || action === "goal.update") {
      const rowId=id(p.id), name=text(p.name,120), current=money(p.current), target=positiveMoney(p.target), targetDate=text(p.targetDate,10);
      if(!rowId||!name||current===null||target===null||!/^\d{4}-\d{2}-\d{2}$/.test(targetDate)) return NextResponse.json({error:"Invalid goal data."},{status:400});
      const values={user_id:userId,name,current_amount:Math.min(current,target),target_amount:target,target_date:targetDate};
      query=action.endsWith("create")?supabase.from("savings_goals").insert({id:rowId,...values}):supabase.from("savings_goals").update(values).eq("id",rowId).eq("user_id",userId);
    } else if (action === "goal.delete") {
      const rowId=id(p.id); if(!rowId)return NextResponse.json({error:"Invalid goal id."},{status:400});
      query=supabase.from("savings_goals").delete().eq("id",rowId).eq("user_id",userId);
    } else if (action === "account.create") {
      const rowId=id(p.id), name=text(p.name,80), type=text(p.type,20), opening=money(p.openingBalance);
      if(!rowId||!name||!allowedAccountTypes.has(type)||opening===null)return NextResponse.json({error:"Invalid account data."},{status:400});
      query=supabase.from("accounts").insert({id:rowId,user_id:userId,name,type,opening_balance:opening});
    } else if (action === "account.delete") {
      const rowId=id(p.id); if(!rowId)return NextResponse.json({error:"Invalid account id."},{status:400});
      query=supabase.from("accounts").delete().eq("id",rowId).eq("user_id",userId);
    } else {
      return NextResponse.json({ error: "Unsupported action." }, { status: 400 });
    }

    const { error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("finance mutation failed", error);
    return NextResponse.json({ error: "Could not save this change." }, { status: 500 });
  }
}
