"use client";

import type { ReactNode } from "react";
import { formatINR, type FinanceData, type Transaction } from "@/lib/finance";

export function download(name: string, body: string, type: string) {
  const blob = new Blob([body], { type });
  const href = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.download = name;
  anchor.click();
  URL.revokeObjectURL(href);
}
export function Empty({ title, detail, action }: { title: string; detail: string; action?: ReactNode }) {
  return <div className="empty"><div className="empty-mark">K</div><h3>{title}</h3><p>{detail}</p>{action}</div>;
}
export function PanelHead({ title, detail, action }: { title: string; detail: string; action?: ReactNode }) { return <div className="panel-head"><div><h3>{title}</h3><p>{detail}</p></div>{action}</div>; }
export function TransactionRow({ tx, data, onClick, compact = false }: { tx: Transaction; data: FinanceData; onClick?: () => void; compact?: boolean }) {
  const category = data.categories.find((c) => c.id === tx.categoryId);
  const account = data.accounts.find((a) => a.id === tx.accountId);
  return <button className={`transaction-row ${compact ? "compact" : ""}`} onClick={onClick}>
    <span className="category-icon" style={{ background: category?.accent }}>{category?.icon ?? "Tx"}</span>
    <span className="tx-main"><strong>{tx.description}</strong><small>{category?.name ?? tx.type} · {account?.name ?? "No account"}</small></span>
    <span className="tx-date">{new Date(`${tx.date}T00:00:00`).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}</span>
    <strong className={`tx-amount ${tx.type}`}>{tx.type === "expense" ? "−" : tx.type === "income" ? "+" : "↔"}{formatINR(tx.amount)}</strong>
  </button>;
}
