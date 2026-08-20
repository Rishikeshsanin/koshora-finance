import Link from "next/link";
import AuthForm from "./auth-form";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; message?: string }> }) {
  const params = await searchParams;
  return <main className="auth-page"><aside className="auth-side"><Link className="brand" href="/"><span className="brand-mark">K</span><strong>Koshora</strong></Link><div className="auth-quote"><h1>A calmer relationship with your money.</h1><p>Private financial records, useful budget signals and transparent forecasting in one focused workspace.</p></div><div className="auth-proof"><span>RLS protected</span><span>No banking passwords</span><span>INR-first</span></div></aside><section className="auth-main"><div className="auth-card"><span className="eyebrow">Private workspace</span><h2>Welcome to Koshora.</h2><p>Sign in to persistent cloud data, or create a private workspace with your name, email and password.</p>{params.error&&<div className="auth-message error">{params.error}</div>}{params.message&&<div className="auth-message good">{params.message}</div>}<AuthForm/><div className="auth-divider">or</div><Link className="secondary" style={{display:"block",textAlign:"center"}} href="/demo">Explore without an account</Link></div></section></main>;
}
