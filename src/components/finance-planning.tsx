"use client";

import { useState } from "react";
import { formatINR, type Goal } from "@/lib/finance";
import { Empty } from "@/components/finance-primitives";

export function Budgets({ data, statuses, onSave, onDelete }: any) {
  const [categoryId, setCategoryId] = useState(data.categories.find((c: any)=>c.kind==="expense")?.id ?? "");
  const [limit, setLimit] = useState("10000");
  return <div className="view-stack"><section className="intro-card"><div><span className="eyebrow">Monthly control</span><h2>Spend with boundaries, not guilt.</h2><p>Budgets recalculate instantly from your stored transactions.</p></div><div className="inline-form"><select value={categoryId} onChange={(e)=>setCategoryId(e.target.value)}>{data.categories.filter((c:any)=>c.kind==="expense").map((c:any)=><option key={c.id} value={c.id}>{c.name}</option>)}</select><input type="number" min="1" value={limit} onChange={(e)=>setLimit(e.target.value)} aria-label="Monthly budget limit"/><button className="primary" onClick={()=>onSave(categoryId, Number(limit))}>Set budget</button></div></section>
    <section className="budget-grid">{statuses.length ? statuses.map((b:any)=><BudgetCard key={b.id} budget={b} onSave={onSave} onDelete={onDelete}/>) : <div className="panel"><Empty title="No budgets yet" detail="Add category limits above to unlock budget risk and remaining-spend insights."/></div>}</section>
  </div>;
}

export function Goals({ data, onCreate, onContribute, onDelete }: any) {
  const [name,setName]=useState(""); const [target,setTarget]=useState("50000"); const [date,setDate]=useState(()=>{const d=new Date();d.setMonth(d.getMonth()+6);return d.toISOString().slice(0,10)});
  return <div className="view-stack"><section className="intro-card"><div><span className="eyebrow">Future money</span><h2>Turn savings into visible progress.</h2><p>Track goals without mixing them into day-to-day spending.</p></div><div className="goal-form"><input placeholder="Goal name" value={name} onChange={(e)=>setName(e.target.value)}/><input type="number" value={target} onChange={(e)=>setTarget(e.target.value)} aria-label="Target amount"/><input type="date" value={date} onChange={(e)=>setDate(e.target.value)}/><button className="primary" onClick={()=>{if(name.trim()&&Number(target)>0){onCreate(name.trim(),Number(target),date);setName("");}}}>Create goal</button></div></section>
    <section className="goal-grid">{data.goals.map((g:Goal)=><GoalCard key={g.id} goal={g} onContribute={onContribute} onDelete={onDelete}/>)}</section></div>;
}

function BudgetCard({ budget: b, onSave, onDelete }: any) {
  const [editing,setEditing]=useState(false);
  const [value,setValue]=useState(String(b.limit));
  function save(){const next=Number(value);if(next>0){onSave(b.categoryId,next);setEditing(false);}}
  return <article className="budget-card"><div className="budget-card-top"><span className="category-icon" style={{background:b.category?.accent}}>{b.category?.icon}</span><button className="ghost danger" onClick={()=>onDelete(b)}>Remove</button></div><h3>{b.category?.name}</h3><div className="budget-big"><strong>{formatINR(b.used)}</strong><span>of {formatINR(b.limit)}</span></div><div className="progress large"><i className={b.percent > 100 ? "over" : b.percent > 80 ? "risk" : ""} style={{width:`${Math.min(b.percent,100)}%`}}/></div><div className="budget-meta"><span>{b.percent.toFixed(1)}% used</span><strong className={b.remaining<0?"bad":""}>{b.remaining>=0?`${formatINR(b.remaining)} left`:`${formatINR(Math.abs(b.remaining))} over`}</strong></div>{editing?<div className="inline-edit"><input type="number" min="1" value={value} onChange={(e)=>setValue(e.target.value)} aria-label={`New ${b.category?.name} limit`}/><button className="primary" onClick={save}>Save</button><button className="ghost" onClick={()=>{setValue(String(b.limit));setEditing(false)}}>Cancel</button></div>:<button className="secondary full" onClick={()=>setEditing(true)}>Edit limit</button>}</article>;
}

function GoalCard({ goal:g, onContribute, onDelete }: { goal: Goal; onContribute:(goal:Goal,amount:number)=>void; onDelete:(goal:Goal)=>void }) {
  const [adding,setAdding]=useState(false);
  const [amount,setAmount]=useState("");
  const pct=Math.min(100,g.current/g.target*100);
  function contribute(){const n=Number(amount);if(n>0){onContribute(g,n);setAmount("");setAdding(false);}}
  return <article className="goal-card"><div className="goal-orb"><span>{pct.toFixed(0)}%</span></div><div><div className="goal-title"><h3>{g.name}</h3><button className="ghost danger" onClick={()=>onDelete(g)}>Remove</button></div><p>{formatINR(g.current)} saved of {formatINR(g.target)}</p><div className="progress large"><i style={{width:`${pct}%`}}/></div><div className="goal-actions">{adding?<div className="inline-edit"><input type="number" min="1" placeholder="₹ amount" value={amount} onChange={(e)=>setAmount(e.target.value)} aria-label="Contribution amount"/><button className="primary" onClick={contribute}>Add</button><button className="ghost" onClick={()=>setAdding(false)}>Cancel</button></div>:<button className="secondary" onClick={()=>setAdding(true)}>+ Contribute</button>}<span>Target {new Date(`${g.targetDate}T00:00:00`).toLocaleDateString("en-IN",{month:"short",year:"numeric"})}</span></div></div></article>;
}
