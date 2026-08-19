export type TxType = "expense" | "income" | "transfer";
export type AccountType = "cash" | "bank" | "credit" | "wallet" | "savings";

export type Category = {
  id: string;
  name: string;
  kind: "expense" | "income";
  icon: string;
  accent: string;
};

export type Account = {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
};

export type Transaction = {
  id: string;
  type: TxType;
  amount: number;
  description: string;
  note?: string;
  categoryId?: string;
  accountId?: string;
  toAccountId?: string;
  date: string;
  recurring?: boolean;
};

export type Budget = {
  id: string;
  categoryId: string;
  month: string;
  limit: number;
};

export type Goal = {
  id: string;
  name: string;
  current: number;
  target: number;
  targetDate: string;
};

export type Recurring = {
  id: string;
  name: string;
  amount: number;
  type: "expense" | "income";
  categoryId?: string;
  accountId?: string;
  nextDate: string;
  frequency: "monthly" | "weekly" | "yearly";
};

export type FinanceData = {
  categories: Category[];
  accounts: Account[];
  transactions: Transaction[];
  budgets: Budget[];
  goals: Goal[];
  recurring: Recurring[];
};

export const DEFAULT_CATEGORIES: Category[] = [
  { id: "food", name: "Food", kind: "expense", icon: "Fd", accent: "#d9f8b8" },
  { id: "shopping", name: "Shopping", kind: "expense", icon: "Sh", accent: "#ffd7aa" },
  { id: "transport", name: "Transport", kind: "expense", icon: "Tr", accent: "#bdd8ff" },
  { id: "entertainment", name: "Entertainment", kind: "expense", icon: "En", accent: "#e6c8ff" },
  { id: "rent", name: "Rent", kind: "expense", icon: "Rt", accent: "#ffc7c7" },
  { id: "bills", name: "Bills", kind: "expense", icon: "Bi", accent: "#c6f1e7" },
  { id: "education", name: "Education", kind: "expense", icon: "Ed", accent: "#f6e3a5" },
  { id: "health", name: "Health", kind: "expense", icon: "He", accent: "#ffcadc" },
  { id: "travel", name: "Travel", kind: "expense", icon: "Tv", accent: "#c9e8ff" },
  { id: "subscriptions", name: "Subscriptions", kind: "expense", icon: "Su", accent: "#d8d0ff" },
  { id: "salary", name: "Salary", kind: "income", icon: "Sa", accent: "#bdeccb" },
  { id: "freelancing", name: "Freelancing", kind: "income", icon: "Fr", accent: "#b7e9e0" },
  { id: "investments", name: "Investments", kind: "income", icon: "In", accent: "#d6e6ff" },
  { id: "other", name: "Other", kind: "expense", icon: "Ot", accent: "#dedede" },
];

function monthStart(offset = 0) {
  const d = new Date();
  d.setMonth(d.getMonth() + offset, 1);
  return d;
}

function isoDay(day: number, monthOffset = 0) {
  const d = monthStart(monthOffset);
  const max = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(day, max));
  return d.toISOString().slice(0, 10);
}

export function currentMonthKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export const DEMO_DATA: FinanceData = {
  categories: DEFAULT_CATEGORIES,
  accounts: [
    { id: "acc-bank", name: "Main Bank", type: "bank", balance: 62450 },
    { id: "acc-wallet", name: "UPI Wallet", type: "wallet", balance: 4280 },
    { id: "acc-cash", name: "Cash", type: "cash", balance: 2350 },
    { id: "acc-save", name: "Savings", type: "savings", balance: 84000 },
  ],
  transactions: [
    { id: "tx-1", type: "income", amount: 72000, description: "Monthly salary", categoryId: "salary", accountId: "acc-bank", date: isoDay(1) },
    { id: "tx-2", type: "expense", amount: 18000, description: "PG rent", categoryId: "rent", accountId: "acc-bank", date: isoDay(2), recurring: true },
    { id: "tx-3", type: "expense", amount: 899, description: "Mobile + data plan", categoryId: "bills", accountId: "acc-bank", date: isoDay(4), recurring: true },
    { id: "tx-4", type: "expense", amount: 1270, description: "Groceries", categoryId: "food", accountId: "acc-wallet", date: isoDay(5) },
    { id: "tx-5", type: "expense", amount: 480, description: "Metro + cab", categoryId: "transport", accountId: "acc-wallet", date: isoDay(6) },
    { id: "tx-6", type: "expense", amount: 1299, description: "Cloud tools", categoryId: "subscriptions", accountId: "acc-bank", date: isoDay(7), recurring: true },
    { id: "tx-7", type: "expense", amount: 820, description: "Dinner with friends", categoryId: "food", accountId: "acc-wallet", date: isoDay(8) },
    { id: "tx-8", type: "expense", amount: 2490, description: "Headphones", categoryId: "shopping", accountId: "acc-bank", date: isoDay(10) },
    { id: "tx-9", type: "income", amount: 9500, description: "Freelance landing page", categoryId: "freelancing", accountId: "acc-bank", date: isoDay(11) },
    { id: "tx-10", type: "expense", amount: 650, description: "Movie + snacks", categoryId: "entertainment", accountId: "acc-wallet", date: isoDay(12) },
    { id: "tx-11", type: "expense", amount: 2100, description: "Course fee", categoryId: "education", accountId: "acc-bank", date: isoDay(13) },
    { id: "tx-12", type: "expense", amount: 360, description: "Breakfasts", categoryId: "food", accountId: "acc-wallet", date: isoDay(14) },
    { id: "tx-13", type: "expense", amount: 740, description: "Pharmacy", categoryId: "health", accountId: "acc-bank", date: isoDay(15) },
    { id: "tx-14", type: "expense", amount: 560, description: "Fuel split", categoryId: "transport", accountId: "acc-wallet", date: isoDay(16) },
    { id: "tx-15", type: "expense", amount: 1199, description: "Sneakers", categoryId: "shopping", accountId: "acc-bank", date: isoDay(18) },
    { id: "tx-prev-1", type: "income", amount: 72000, description: "Monthly salary", categoryId: "salary", accountId: "acc-bank", date: isoDay(1, -1) },
    { id: "tx-prev-2", type: "expense", amount: 18000, description: "PG rent", categoryId: "rent", accountId: "acc-bank", date: isoDay(2, -1) },
    { id: "tx-prev-3", type: "expense", amount: 7900, description: "Food total", categoryId: "food", accountId: "acc-wallet", date: isoDay(15, -1) },
    { id: "tx-prev-4", type: "expense", amount: 1850, description: "Transport total", categoryId: "transport", accountId: "acc-wallet", date: isoDay(12, -1) },
    { id: "tx-prev-5", type: "expense", amount: 4100, description: "Shopping total", categoryId: "shopping", accountId: "acc-bank", date: isoDay(10, -1) },
  ],
  budgets: [
    { id: "bud-food", categoryId: "food", month: currentMonthKey(), limit: 10000 },
    { id: "bud-shop", categoryId: "shopping", month: currentMonthKey(), limit: 6000 },
    { id: "bud-transport", categoryId: "transport", month: currentMonthKey(), limit: 4000 },
    { id: "bud-ent", categoryId: "entertainment", month: currentMonthKey(), limit: 3000 },
  ],
  goals: [
    { id: "goal-laptop", name: "Laptop upgrade", current: 43000, target: 80000, targetDate: isoDay(28, 3) },
    { id: "goal-emergency", name: "Emergency fund", current: 84000, target: 200000, targetDate: isoDay(20, 7) },
  ],
  recurring: [
    { id: "rec-rent", name: "PG rent", amount: 18000, type: "expense", categoryId: "rent", accountId: "acc-bank", nextDate: isoDay(2, 1), frequency: "monthly" },
    { id: "rec-cloud", name: "Cloud tools", amount: 1299, type: "expense", categoryId: "subscriptions", accountId: "acc-bank", nextDate: isoDay(7, 1), frequency: "monthly" },
    { id: "rec-mobile", name: "Mobile plan", amount: 899, type: "expense", categoryId: "bills", accountId: "acc-bank", nextDate: isoDay(4, 1), frequency: "monthly" },
  ],
};

export function cloneDemoData(): FinanceData {
  return JSON.parse(JSON.stringify(DEMO_DATA)) as FinanceData;
}

export function formatINR(value: number, compact = false) {
  if (compact) {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", notation: "compact", maximumFractionDigits: 1 }).format(value);
  }
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
}

export function inMonth(date: string, monthKey = currentMonthKey()) {
  return date.slice(0, 7) === monthKey;
}

export function previousMonthKey() {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  return currentMonthKey(d);
}

export function getSummary(data: FinanceData) {
  const month = currentMonthKey();
  const previous = previousMonthKey();
  const now = data.transactions.filter((t) => inMonth(t.date, month));
  const prev = data.transactions.filter((t) => inMonth(t.date, previous));
  const income = now.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0);
  const expenses = now.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount, 0);
  const prevExpenses = prev.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount, 0);
  const savings = income - expenses;
  const savingsRate = income > 0 ? (savings / income) * 100 : 0;
  const balance = data.accounts.reduce((sum, a) => sum + a.balance, 0);
  const change = prevExpenses > 0 ? ((expenses - prevExpenses) / prevExpenses) * 100 : 0;
  return { income, expenses, savings, savingsRate, balance, expenseChange: change };
}

export function spendByCategory(data: FinanceData, monthKey = currentMonthKey()) {
  const map = new Map<string, number>();
  for (const tx of data.transactions) {
    if (tx.type !== "expense" || !inMonth(tx.date, monthKey) || !tx.categoryId) continue;
    map.set(tx.categoryId, (map.get(tx.categoryId) ?? 0) + tx.amount);
  }
  return [...map.entries()]
    .map(([categoryId, amount]) => ({
      categoryId,
      amount,
      category: data.categories.find((c) => c.id === categoryId),
    }))
    .sort((a, b) => b.amount - a.amount);
}

export function budgetStatus(data: FinanceData) {
  const spend = new Map(spendByCategory(data).map((s) => [s.categoryId, s.amount]));
  return data.budgets
    .filter((b) => b.month === currentMonthKey())
    .map((budget) => {
      const used = spend.get(budget.categoryId) ?? 0;
      const percent = budget.limit > 0 ? (used / budget.limit) * 100 : 0;
      return {
        ...budget,
        used,
        remaining: budget.limit - used,
        percent,
        category: data.categories.find((c) => c.id === budget.categoryId),
      };
    })
    .sort((a, b) => b.percent - a.percent);
}

export function dailyExpenseSeries(data: FinanceData) {
  const now = new Date();
  const days = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const values = Array.from({ length: days }, () => 0);
  for (const tx of data.transactions) {
    if (tx.type !== "expense" || !inMonth(tx.date)) continue;
    const day = Number(tx.date.slice(8, 10));
    values[day - 1] += tx.amount;
  }
  return values;
}

export function cashflowSeries(data: FinanceData) {
  const now = new Date();
  const points: { label: string; income: number; expense: number }[] = [];
  for (let offset = -5; offset <= 0; offset += 1) {
    const d = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    const key = currentMonthKey(d);
    const monthTx = data.transactions.filter((t) => inMonth(t.date, key));
    points.push({
      label: d.toLocaleDateString("en-IN", { month: "short" }),
      income: monthTx.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0),
      expense: monthTx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0),
    });
  }
  return points;
}

export function forecastMonthEnd(data: FinanceData) {
  const now = new Date();
  const day = Math.max(now.getDate(), 1);
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const { expenses, income } = getSummary(data);
  const variableSpend = data.transactions
    .filter((t) => t.type === "expense" && inMonth(t.date) && !t.recurring)
    .reduce((s, t) => s + t.amount, 0);
  const recurringSpent = expenses - variableSpend;
  const variableProjection = (variableSpend / day) * daysInMonth;
  const projectedExpenses = Math.max(expenses, recurringSpent + variableProjection);
  return {
    projectedExpenses,
    projectedSavings: income - projectedExpenses,
    confidence: day > 14 ? "high" : day > 7 ? "medium" : "early",
  } as const;
}

export function deriveInsights(data: FinanceData) {
  const current = spendByCategory(data);
  const prev = spendByCategory(data, previousMonthKey());
  const prevMap = new Map(prev.map((s) => [s.categoryId, s.amount]));
  const summary = getSummary(data);
  const budgets = budgetStatus(data);
  const insights: { tone: "good" | "warn" | "neutral"; title: string; detail: string }[] = [];

  for (const item of current.slice(0, 3)) {
    const old = prevMap.get(item.categoryId) ?? 0;
    if (old <= 0 || !item.category) continue;
    const diff = item.amount - old;
    const pct = Math.abs((diff / old) * 100);
    insights.push({
      tone: diff <= 0 ? "good" : "warn",
      title: `${item.category.name} is ${diff <= 0 ? "down" : "up"} ${pct.toFixed(0)}%`,
      detail: `${diff <= 0 ? "You saved" : "You spent"} ${formatINR(Math.abs(diff))} ${diff <= 0 ? "compared with" : "more than"} last month.`,
    });
  }

  const risk = budgets.find((b) => b.percent >= 75);
  if (risk?.category) {
    insights.push({
      tone: risk.percent > 100 ? "warn" : "neutral",
      title: `${risk.category.name} budget at ${risk.percent.toFixed(0)}%`,
      detail: risk.remaining >= 0 ? `${formatINR(risk.remaining)} remains for this month.` : `${formatINR(Math.abs(risk.remaining))} over budget already.`,
    });
  }

  insights.push({
    tone: summary.savingsRate >= 20 ? "good" : "neutral",
    title: `Savings rate ${summary.savingsRate.toFixed(1)}%`,
    detail: summary.savingsRate >= 20 ? "Your current month is tracking above a 20% savings rate." : "A little more headroom this month would improve your savings rate.",
  });

  return insights.slice(0, 5);
}

export function uid(_prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function toCsv(data: FinanceData) {
  const header = ["date", "type", "description", "category", "account", "amount"];
  const rows = data.transactions.map((tx) => {
    const category = data.categories.find((c) => c.id === tx.categoryId)?.name ?? "";
    const account = data.accounts.find((a) => a.id === tx.accountId)?.name ?? "";
    return [tx.date, tx.type, tx.description, category, account, tx.amount];
  });
  return [
    header.join(","),
    ...rows.map((row) => row.map((v) => `"${String(v).replaceAll('"', '""')}"`).join(",")),
  ].join("\n");
}
