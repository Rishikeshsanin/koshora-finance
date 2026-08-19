"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function encoded(value: string) { return encodeURIComponent(value); }
function requireCloudConfig() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    redirect(`/login?error=${encoded("Cloud sign-in is not configured on this deployment yet. The recruiter demo is fully available.")}`);
  }
}

export async function signIn(formData: FormData) {
  requireCloudConfig();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || password.length < 6) redirect(`/login?error=${encoded("Enter a valid email and password.")}`);
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) redirect(`/login?error=${encoded(error.message)}`);
  redirect("/app");
}

export async function signUp(formData: FormData) {
  requireCloudConfig();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || password.length < 8) redirect(`/login?error=${encoded("Use a valid email and a password of at least 8 characters.")}`);
  const supabase = await createClient();
  const origin = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${origin}/auth/confirm` } });
  if (error) redirect(`/login?error=${encoded(error.message)}`);
  if (data.session) redirect("/app");
  redirect(`/login?message=${encoded("Check your email to confirm your account, then return to sign in.")}`);
}
