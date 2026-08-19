"use client";

import type { CSSProperties } from "react";
import { cashflowSeries, formatINR, spendByCategory, type FinanceData, type Transaction } from "@/lib/finance";
import { PanelHead, TransactionRow } from "@/components/finance-primitives";

function Sparkline({ values }: { values: number[] }) {
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = Math.max(max - min, 1);
  const points = values.map((value, index) => `${(index / Math.max(values.length - 1, 1)) * 100},${36 - ((value - min) / range) * 30}`).join(" ");
  return (
    <svg className="spark" viewBox="0 0 100 40" preserveAspectRatio="none" aria-hidden="true">
      <polyline points={points} fill="none" stroke="currentColor" strokeWidth="2.2" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function CashflowChart({ data }: { data: FinanceData }) {
  const series = cashflowSeries(data);
  const max = Math.max(...series.flatMap((point) => [point.income, point.expense]), 1);
  return (
    <div className="cashflow-chart" role="img" aria-label="Six month income versus expense chart">
      {series.map((point) => (
        <div className="cashflow-col" key={point.label}>
          <div className="bars">
            <span className="bar income" style={{ height: `${Math.max((point.income / max) * 100, point.income ? 5 : 0)}%` }} title={`${point.label} income ${formatINR(point.income)}`} />
            <span className="bar expense" style={{ height: `${Math.max((point.expense / max) * 100, point.expense ? 5 : 0)}%` }} title={`${point.label} expenses ${formatINR(point.expense)}`} />
          </div>
          <span>{point.label}</span>
        </div>
      ))}
    </div>
  );
}

function Donut({ data }: { data: FinanceData }) {
  const spend = spendByCategory(data).slice(0, 5);
  const total = spend.reduce((sum, item) => sum + item.amount, 0) || 1;
  let running = 0;
  const parts = spend.map((item) => {
    const start = running;
    running += (item.amount / total) * 100;
    return `${item.category?.accent ?? "#ddd"} ${start}% ${running}%`;
  });
  return (
    <div className="donut-wrap">
      <div className="donut" style={{ background: `conic-gradient(${parts.join(",") || "var(--line) 0 100%"})` }} aria-label="Spending by category donut chart">
        <div className="donut-hole"><strong>{formatINR(total, true)}</strong><span>spent</span></div>
      </div>
      <div className="donut-legend">
        {spend.map((item) => (
          <div key={item.categoryId}><i style={{ background: item.category?.accent }} /><span>{item.category?.name ?? "Other"}</span><strong>{formatINR(item.amount, true)}</strong></div>
        ))}
      </div>
    </div>
  );
}
export function Overview({ data, summary, budgets, forecast, topCategory, monthlyBudget, monthlyBudgetUsed, setView, onEdit }: any) {
  const recent = [...data.transactions].sort((a: Transaction, b: Transaction) => b.date.localeCompare(a.date)).slice(0, 6);
  const budgetRemaining = monthlyBudget - monthlyBudgetUsed;
  const score = Math.max(0, Math.min(100, Math.round(58 + Math.min(summary.savingsRate, 30) - Math.max(0, budgetRemaining < 0 ? 18 : 0))));
  return <div className="view-stack">
    <section className="hero-grid">
      <article className="balance-card">
        <div><span className="eyebrow">Total balance</span><h2>{formatINR(summary.balance)}</h2><p><b>{summary.savings >= 0 ? "+" : ""}{formatINR(summary.savings)}</b> net cash flow this month</p></div>
        <Sparkline values={[31, 34, 33, 38, 41, 44, 47, 46, 51, 55]} />
      </article>
      <article className="health-card"><span className="eyebrow">Financial health</span><div className="score-ring" style={{ "--score": `${score * 3.6}deg` } as CSSProperties}><strong>{score}</strong><span>/100</span></div><p>{score >= 75 ? "Strong month. Keep your budget discipline." : "Stable, with room to improve savings."}</p></article>
    </section>
    <section className="metric-grid">
      <Metric label="Income" value={formatINR(summary.income)} delta="This month" tone="good" />
      <Metric label="Expenses" value={formatINR(summary.expenses)} delta={`${Math.abs(summary.expenseChange).toFixed(0)}% ${summary.expenseChange <= 0 ? "less" : "more"} vs last month`} tone={summary.expenseChange <= 0 ? "good" : "warn"} />
      <Metric label="Savings rate" value={`${summary.savingsRate.toFixed(1)}%`} delta={summary.savingsRate >= 20 ? "Healthy buffer" : "Below 20% target"} tone={summary.savingsRate >= 20 ? "good" : "neutral"} />
      <Metric label="Budget remaining" value={formatINR(budgetRemaining)} delta={`${monthlyBudget ? Math.min(100, monthlyBudgetUsed / monthlyBudget * 100).toFixed(0) : 0}% allocated spend used`} tone={budgetRemaining >= 0 ? "neutral" : "warn"} />
    </section>
    <section className="two-col">
      <article className="panel chart-panel"><PanelHead title="Cash flow" detail="Last six months" /><div className="chart-legend"><span><i className="income-dot"/>Income</span><span><i className="expense-dot"/>Expenses</span></div><CashflowChart data={data}/></article>
      <article className="panel"><PanelHead title="Spending mix" detail={topCategory?.category ? `${topCategory.category.name} leads this month` : "No expenses yet"} /><Donut data={data}/></article>
    </section>
    <section className="two-col lower">
      <article className="panel"><PanelHead title="Budget pulse" detail="Category limits" action={<button className="text-link" onClick={() => setView("budgets")}>Manage</button>} />
        <div className="budget-list">{budgets.slice(0,4).map((b: any) => <div className="budget-row" key={b.id}><div><span>{b.category?.name}</span><strong>{formatINR(b.used)} / {formatINR(b.limit)}</strong></div><div className="progress"><i className={b.percent > 100 ? "over" : b.percent > 80 ? "risk" : ""} style={{ width: `${Math.min(b.percent,100)}%` }}/></div><small>{b.remaining >= 0 ? `${formatINR(b.remaining)} left` : `${formatINR(Math.abs(b.remaining))} over`}</small></div>)}</div>
      </article>
      <article className="panel"><PanelHead title="Recent activity" detail="Latest transactions" action={<button className="text-link" onClick={() => setView("transactions")}>View all</button>} />
        <div className="recent-list">{recent.map((tx: Transaction) => <TransactionRow key={tx.id} tx={tx} data={data} onClick={() => onEdit(tx)} compact />)}</div>
      </article>
    </section>
    <section className="forecast-strip"><div><span className="eyebrow">Month-end projection</span><h3>{formatINR(forecast.projectedExpenses)} expected spend</h3><p>Based on current daily variable spend plus known recurring costs. Confidence: {forecast.confidence}.</p></div><div><span>Projected savings</span><strong>{formatINR(forecast.projectedSavings)}</strong></div></section>
  </div>;
}

function Metric({ label, value, delta, tone }: { label: string; value: string; delta: string; tone: string }) { return <article className="metric"><span>{label}</span><strong>{value}</strong><small className={tone}>{delta}</small></article>; }
