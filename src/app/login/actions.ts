"use server";

import { redirect } from "next/navigation";
import { APP_URL } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

function encoded(value: string) { return encodeURIComponent(value); }

export async function signIn(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || password.length < 6) redirect(`/login?error=${encoded("Enter a valid email and password.")}`);
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) redirect(`/login?error=${encoded(error.message)}`);
  redirect("/app");
}

export async function signUp(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || password.length < 8) redirect(`/login?error=${encoded("Use a valid email and a password of at least 8 characters.")}`);
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${APP_URL}/auth/confirm` } });
  if (error) redirect(`/login?error=${encoded(error.message)}`);
  if (data.session) redirect("/app");
  redirect(`/login?message=${encoded("Check your email to confirm your account, then return to sign in.")}`);
}
