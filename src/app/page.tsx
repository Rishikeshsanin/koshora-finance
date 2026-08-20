import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

function Brand() {
  return <Link className="brand" href="/" aria-label="Koshora home"><span className="brand-mark">K</span><strong>Koshora</strong></Link>;
}

export default async function Home() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const signedIn = Boolean(data?.claims?.sub);
  const workspaceHref = signedIn ? "/app" : "/login";

  return <main className="landing">
    <nav className="landing-nav"><Brand/><div className="nav-actions"><Link className="secondary" href={workspaceHref}>{signedIn ? "Open workspace" : "Sign in"}</Link><Link className="primary" href="/demo">Open live demo</Link></div></nav>
    <section className="landing-hero">
      <div className="hero-copy"><span className="eyebrow">Personal finance, without the noise</span><h1>Clarity for <em>every rupee.</em></h1><p>Koshora turns transactions, budgets, recurring commitments and savings goals into one calm financial picture — then explains what changed and what may happen next.</p><div className="hero-cta"><Link className="primary" href="/demo">Explore recruiter demo</Link><Link className="secondary" href={workspaceHref}>{signedIn ? "Return to private workspace" : "Create private workspace"}</Link></div><div className="hero-note">No bank credentials. Demo data stays in your browser. INR-first with Indian number formatting.</div></div>
      <div className="hero-visual" aria-label="Koshora dashboard preview"><div className="visual-top"><div className="visual-dots"><i/><i/><i/></div><span className="visual-chip">August overview</span></div><div className="visual-balance"><span>Total balance</span><strong>₹1,53,080</strong><small>Across bank, wallet, cash & savings</small></div><div className="visual-grid"><div className="visual-card"><h3>Cash flow</h3><div className="mini-bars">{[35,48,29,62,51,78,43].map((v,i)=><i key={i} style={{height:`${v}%`}}/>)}</div></div><div className="visual-card"><h3>Budget pulse</h3><div className="mini-budget"><div><span><b>Food</b><b>73%</b></span><i style={{"--w":"73%"} as React.CSSProperties}/></div><div><span><b>Transport</b><b>41%</b></span><i style={{"--w":"41%"} as React.CSSProperties}/></div><div><span><b>Shopping</b><b>62%</b></span><i style={{"--w":"62%"} as React.CSSProperties}/></div></div></div></div></div>
    </section>
    <section className="logo-row" aria-label="Product pillars"><div><strong>01</strong>Real data model</div><div><strong>02</strong>Explainable insights</div><div><strong>03</strong>Private by design</div><div><strong>04</strong>Recruiter-ready demo</div></section>
    <section className="feature-section"><div className="section-heading"><span className="eyebrow">Built to answer useful questions</span><h2>Not another CRUD expense tracker.</h2></div><div className="feature-grid"><article className="feature"><span className="feature-num">01 / FLOW</span><h3>Know what is changing.</h3><p>Income, expenses, savings rate, category movement and six-month cash flow stay connected instead of living in isolated widgets.</p></article><article className="feature"><span className="feature-num">02 / RISK</span><h3>See overspending early.</h3><p>Category budgets show utilization and risk, while month-end projection estimates where spending is headed from actual behavior.</p></article><article className="feature"><span className="feature-num">03 / FUTURE</span><h3>Make progress visible.</h3><p>Savings goals and recurring commitments separate future priorities from everyday spending so the dashboard stays decision-oriented.</p></article></div></section>
    <section className="demo-banner"><div><h2>Understand it in sixty seconds.</h2><p>The demo is fully interactive: add, edit, filter, budget, forecast and export.</p></div><Link className="primary" href="/demo">Launch Koshora demo</Link></section>
  </main>;
}
