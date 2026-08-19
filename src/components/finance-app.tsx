"use client";

import { useEffect, useMemo, useState } from "react";
import {
  budgetStatus,
  cloneDemoData,
  currentMonthKey,
  deriveInsights,
  forecastMonthEnd,
  getSummary,
  spendByCategory,
  uid,
  type Account,
  type Budget,
  type FinanceData,
  type Goal,
  type Transaction,
} from "@/lib/finance";
import {
  Accounts,
  Budgets,
  Goals,
  Insights,
  Overview,
  Settings,
  Transactions,
} from "@/components/finance-views";
import { TransactionModal } from "@/components/transaction-modal";

type View = "overview" | "transactions" | "budgets" | "goals" | "insights" | "accounts" | "settings";
type Props = { mode?: "demo" | "cloud"; initialData?: FinanceData; userEmail?: string };
type Toast = { id: number; text: string; tone: "good" | "bad" };

const nav: { id: View; label: string; short: string }[] = [
  { id: "overview", label: "Overview", short: "Ov" },
  { id: "transactions", label: "Transactions", short: "Tx" },
  { id: "budgets", label: "Budgets", short: "Bd" },
  { id: "goals", label: "Goals", short: "Go" },
  { id: "insights", label: "Insights", short: "In" },
  { id: "accounts", label: "Accounts", short: "Ac" },
  { id: "settings", label: "Settings", short: "Se" },
];

function applyTxBalance(accounts: Account[], tx: Transaction, direction: 1 | -1) {
  const amount = tx.amount * direction;
  return accounts.map((account) => {
    if (tx.accountId === account.id) {
      if (tx.type === "income") return { ...account, balance: account.balance + amount };
      if (tx.type === "expense" || tx.type === "transfer") return { ...account, balance: account.balance - amount };
    }
    if (tx.type === "transfer" && tx.toAccountId === account.id) {
      return { ...account, balance: account.balance + amount };
    }
    return account;
  });
}

export default function FinanceApp({ mode = "demo", initialData, userEmail }: Props) {
  const [view, setView] = useState<View>("overview");
  const [data, setData] = useState<FinanceData>(initialData ?? cloneDemoData());
  const [ready, setReady] = useState(mode === "cloud");
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system");
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [txModal, setTxModal] = useState<{ open: boolean; tx?: Transaction }>({ open: false });
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "expense" | "income" | "transfer">("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sort, setSort] = useState<"newest" | "oldest" | "high" | "low">("newest");

  useEffect(() => {
    if (mode !== "demo") return;
    try {
      const saved = localStorage.getItem("koshora-demo-data");
      if (saved) setData(JSON.parse(saved));
      const storedTheme = localStorage.getItem("koshora-theme") as typeof theme | null;
      if (storedTheme) setTheme(storedTheme);
    } catch {}
    setReady(true);
  }, [mode]);

  useEffect(() => {
    if (!ready || mode !== "demo") return;
    localStorage.setItem("koshora-demo-data", JSON.stringify(data));
  }, [data, mode, ready]);

  useEffect(() => {
    const root = document.documentElement;
    const resolved = theme === "system" ? (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light") : theme;
    root.dataset.theme = resolved;
    localStorage.setItem("koshora-theme", theme);
  }, [theme]);

  const summary = useMemo(() => getSummary(data), [data]);
  const budgets = useMemo(() => budgetStatus(data), [data]);
  const insights = useMemo(() => deriveInsights(data), [data]);
  const forecast = useMemo(() => forecastMonthEnd(data), [data]);
  const topCategory = spendByCategory(data)[0];
  const monthlyBudget = budgets.reduce((s, b) => s + b.limit, 0);
  const monthlyBudgetUsed = budgets.reduce((s, b) => s + b.used, 0);

  function toast(text: string, tone: Toast["tone"] = "good") {
    const item = { id: Date.now() + Math.random(), text, tone };
    setToasts((v) => [...v, item]);
    setTimeout(() => setToasts((v) => v.filter((x) => x.id !== item.id)), 3200);
  }

  async function persist(action: string, payload: unknown, next: FinanceData, success: string) {
    const previous = data;
    setData(next);
    if (mode === "cloud") {
      try {
        const response = await fetch("/api/finance", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, payload }) });
        const result = await response.json().catch(() => ({ error: "Unexpected server response." }));
        if (!response.ok) throw new Error(result.error ?? "Save failed");
      } catch (error) {
        setData(previous);
        toast(error instanceof Error ? error.message : "Could not save change", "bad");
        return false;
      }
    }
    toast(success);
    return true;
  }

  async function saveTransaction(tx: Transaction) {
    const editing = data.transactions.find((t) => t.id === tx.id);
    let accounts = data.accounts;
    if (editing) accounts = applyTxBalance(accounts, editing, -1);
    accounts = applyTxBalance(accounts, tx, 1);
    const transactions = editing ? data.transactions.map((t) => t.id === tx.id ? tx : t) : [tx, ...data.transactions];
    const next = { ...data, accounts, transactions };
    const ok = await persist(editing ? "transaction.update" : "transaction.create", tx, next, editing ? "Transaction updated" : "Transaction added");
    if (ok) setTxModal({ open: false });
  }

  function removeTransaction(tx: Transaction) {
    const next = { ...data, accounts: applyTxBalance(data.accounts, tx, -1), transactions: data.transactions.filter((t) => t.id !== tx.id) };
    void persist("transaction.delete", { id: tx.id }, next, "Transaction removed");
  }

  function upsertBudget(categoryId: string, limit: number) {
    const existing = data.budgets.find((b) => b.categoryId === categoryId && b.month === currentMonthKey());
    const budget: Budget = existing ? { ...existing, limit } : { id: uid("budget"), categoryId, month: currentMonthKey(), limit };
    const next = { ...data, budgets: existing ? data.budgets.map((b) => b.id === existing.id ? budget : b) : [...data.budgets, budget] };
    void persist(existing ? "budget.update" : "budget.create", budget, next, existing ? "Budget updated" : "Budget created");
  }

  function removeBudget(budget: Budget) {
    void persist("budget.delete", { id: budget.id }, { ...data, budgets: data.budgets.filter((b) => b.id !== budget.id) }, "Budget removed");
  }

  function createGoal(name: string, target: number, targetDate: string) {
    const goal: Goal = { id: uid("goal"), name, current: 0, target, targetDate };
    void persist("goal.create", goal, { ...data, goals: [...data.goals, goal] }, "Savings goal created");
  }

  function contributeGoal(goal: Goal, amount: number) {
    const updated = { ...goal, current: Math.min(goal.target, Math.max(0, goal.current + amount)) };
    void persist("goal.update", updated, { ...data, goals: data.goals.map((g) => g.id === goal.id ? updated : g) }, "Goal progress updated");
  }

  function removeGoal(goal: Goal) {
    void persist("goal.delete", { id: goal.id }, { ...data, goals: data.goals.filter((g) => g.id !== goal.id) }, "Goal removed");
  }

  function createAccount(name: string, type: Account["type"], balance: number) {
    const account: Account = { id: uid("account"), name, type, balance };
    void persist("account.create", { ...account, openingBalance: balance }, { ...data, accounts: [...data.accounts, account] }, "Account created");
  }

  function removeAccount(account: Account) {
    if (data.transactions.some((t) => t.accountId === account.id || t.toAccountId === account.id)) {
      toast("Move or delete linked transactions before removing this account", "bad");
      return;
    }
    void persist("account.delete", { id: account.id }, { ...data, accounts: data.accounts.filter((a) => a.id !== account.id) }, "Account removed");
  }

  const filteredTx = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = data.transactions.filter((tx) => {
      const category = data.categories.find((c) => c.id === tx.categoryId)?.name ?? "";
      return (!q || `${tx.description} ${tx.note ?? ""} ${category}`.toLowerCase().includes(q)) &&
        (typeFilter === "all" || tx.type === typeFilter) &&
        (categoryFilter === "all" || tx.categoryId === categoryFilter);
    });
    return [...list].sort((a, b) => sort === "newest" ? b.date.localeCompare(a.date) : sort === "oldest" ? a.date.localeCompare(b.date) : sort === "high" ? b.amount - a.amount : a.amount - b.amount);
  }, [data.transactions, data.categories, search, typeFilter, categoryFilter, sort]);

  if (!ready) return <div className="app-loading"><div className="skeleton wide" /><div className="skeleton-grid"><i/><i/><i/></div></div>;

  return (
    <div className="finance-shell">
      <aside className="sidebar">
        <a className="brand" href="/"><span className="brand-mark">K</span><span>Koshora</span></a>
        <nav>
          {nav.map((item) => <button key={item.id} className={view === item.id ? "active" : ""} onClick={() => setView(item.id)}><span>{item.short}</span>{item.label}</button>)}
        </nav>
        <div className="side-foot">
          <div className="demo-chip">{mode === "demo" ? "Recruiter demo" : "Private workspace"}</div>
          <p>{mode === "demo" ? "Sample data stays in this browser." : userEmail}</p>
          {mode === "cloud" && <form action="/auth/signout" method="post"><button type="submit" className="text-link">Sign out</button></form>}
        </div>
      </aside>

      <main className="workspace">
        <header className="topbar">
          <div><span className="eyebrow">{mode === "demo" ? "Demo workspace" : "Personal workspace"}</span><h1>{nav.find((n) => n.id === view)?.label}</h1></div>
          <div className="top-actions">
            <button className="icon-btn" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} aria-label="Toggle theme">{theme === "dark" ? "☀" : "◐"}</button>
            <button className="primary" onClick={() => setTxModal({ open: true })}>+ Add transaction</button>
          </div>
        </header>

        {view === "overview" && <Overview data={data} summary={summary} budgets={budgets} forecast={forecast} topCategory={topCategory} monthlyBudget={monthlyBudget} monthlyBudgetUsed={monthlyBudgetUsed} setView={setView} onEdit={(tx) => setTxModal({ open: true, tx })} />}
        {view === "transactions" && <Transactions data={data} transactions={filteredTx} search={search} setSearch={setSearch} typeFilter={typeFilter} setTypeFilter={setTypeFilter} categoryFilter={categoryFilter} setCategoryFilter={setCategoryFilter} sort={sort} setSort={setSort} onAdd={() => setTxModal({ open: true })} onEdit={(tx) => setTxModal({ open: true, tx })} onDelete={removeTransaction} />}
        {view === "budgets" && <Budgets data={data} statuses={budgets} onSave={upsertBudget} onDelete={removeBudget} />}
        {view === "goals" && <Goals data={data} onCreate={createGoal} onContribute={contributeGoal} onDelete={removeGoal} />}
        {view === "insights" && <Insights data={data} insights={insights} forecast={forecast} />}
        {view === "accounts" && <Accounts data={data} onCreate={createAccount} onDelete={removeAccount} />}
        {view === "settings" && <Settings mode={mode} theme={theme} setTheme={setTheme} data={data} reset={() => { const fresh = cloneDemoData(); setData(fresh); localStorage.setItem("koshora-demo-data", JSON.stringify(fresh)); toast("Demo data reset"); }} />}
      </main>

      <nav className="mobile-nav">
        {nav.slice(0, 5).map((item) => <button key={item.id} className={view === item.id ? "active" : ""} onClick={() => setView(item.id)}><span>{item.short}</span><small>{item.label}</small></button>)}
      </nav>

      {txModal.open && <TransactionModal data={data} existing={txModal.tx} onClose={() => setTxModal({ open: false })} onSave={saveTransaction} />}
      <div className="toasts" aria-live="polite">{toasts.map((t) => <div key={t.id} className={`toast ${t.tone}`}>{t.text}</div>)}</div>
    </div>
  );
}
