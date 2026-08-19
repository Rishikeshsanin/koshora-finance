"use client";

import { type FinanceData, type Transaction } from "@/lib/finance";
import { Empty, PanelHead, TransactionRow } from "@/components/finance-primitives";

type TransactionsProps = {
  data: FinanceData;
  transactions: Transaction[];
  search: string;
  setSearch: (value: string) => void;
  typeFilter: "all" | "expense" | "income" | "transfer";
  setTypeFilter: (value: "all" | "expense" | "income" | "transfer") => void;
  categoryFilter: string;
  setCategoryFilter: (value: string) => void;
  sort: "newest" | "oldest" | "high" | "low";
  setSort: (value: "newest" | "oldest" | "high" | "low") => void;
  onAdd: () => void;
  onEdit: (tx: Transaction) => void;
  onDelete: (tx: Transaction) => void;
};

export function Transactions({ data, transactions, search, setSearch, typeFilter, setTypeFilter, categoryFilter, setCategoryFilter, sort, setSort, onAdd, onEdit, onDelete }: TransactionsProps) {
  return <div className="view-stack">
    <section className="panel toolbar-panel"><div className="search-box"><span>⌕</span><input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Search transactions, notes or categories" aria-label="Search transactions" /></div><select value={typeFilter} onChange={(e)=>setTypeFilter(e.target.value as TransactionsProps["typeFilter"])}><option value="all">All types</option><option value="expense">Expenses</option><option value="income">Income</option><option value="transfer">Transfers</option></select><select value={categoryFilter} onChange={(e)=>setCategoryFilter(e.target.value)}><option value="all">All categories</option>{data.categories.map((c)=><option key={c.id} value={c.id}>{c.name}</option>)}</select><select value={sort} onChange={(e)=>setSort(e.target.value as TransactionsProps["sort"])}><option value="newest">Newest</option><option value="oldest">Oldest</option><option value="high">Highest amount</option><option value="low">Lowest amount</option></select></section>
    <section className="panel transactions-panel"><PanelHead title="Transaction history" detail={`${transactions.length} matching records`} action={<button className="primary small" onClick={onAdd}>+ Add</button>} />
      {transactions.length ? <div className="transaction-table">{transactions.map((tx)=><div className="tx-line" key={tx.id}><TransactionRow tx={tx} data={data} onClick={()=>onEdit(tx)}/><button className="ghost danger" onClick={()=>onDelete(tx)} aria-label={`Delete ${tx.description}`}>Delete</button></div>)}</div> : <Empty title="No transactions match" detail="Try changing your filters or add a new transaction." action={<button className="primary" onClick={onAdd}>Add transaction</button>} />}
    </section>
  </div>;
}
