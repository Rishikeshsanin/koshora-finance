"use client";

import { budgetStatus, formatINR } from "@/lib/finance";
import { Empty, PanelHead } from "@/components/finance-primitives";

export function Insights({ data, insights, forecast }: any) {
  const risks=budgetStatus(data).filter((b)=>b.percent>=70);
  const recurring=data.recurring.filter((r:any)=>r.type==="expense").reduce((s:number,r:any)=>s+r.amount,0);
  return <div className="view-stack"><section className="insight-hero"><div><span className="eyebrow">Explainable intelligence</span><h2>Your money, translated into decisions.</h2><p>Every insight below is calculated from transaction history, budgets and recurring commitments.</p></div><div className="forecast-card"><span>Predicted month-end spend</span><strong>{formatINR(forecast.projectedExpenses)}</strong><small>{forecast.confidence} confidence · rule-based forecast</small></div></section>
    <section className="insight-grid">{insights.map((i:any,index:number)=><article className={`insight-card ${i.tone}`} key={index}><span className="insight-index">0{index+1}</span><h3>{i.title}</h3><p>{i.detail}</p></article>)}</section>
    <section className="two-col"><article className="panel"><PanelHead title="Budget risk radar" detail={`${risks.length} categories need attention`}/>{risks.length?risks.map((r:any)=><div className="risk-row" key={r.id}><span>{r.category?.name}</span><div className="progress"><i className={r.percent>100?"over":"risk"} style={{width:`${Math.min(r.percent,100)}%`}}/></div><strong>{r.percent.toFixed(0)}%</strong></div>):<Empty title="No budget risks" detail="No category has crossed 70% of its monthly limit."/>}</article><article className="panel commitment"><PanelHead title="Committed monthly spend" detail="Known recurring expenses"/><strong>{formatINR(recurring)}</strong><p>Already committed before discretionary purchases.</p>{data.recurring.slice(0,4).map((r:any)=><div className="commit-row" key={r.id}><span>{r.name}</span><strong>{formatINR(r.amount)}</strong></div>)}</article></section></div>;
}
