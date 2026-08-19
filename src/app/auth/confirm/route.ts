import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type");
  const code = url.searchParams.get("code");
  const supabase = await createClient();
  if (code) await supabase.auth.exchangeCodeForSession(code);
  else if (tokenHash && type) await supabase.auth.verifyOtp({ token_hash: tokenHash, type: type as "signup" | "email" | "recovery" | "invite" | "email_change" });
  return NextResponse.redirect(new URL("/app", url.origin));
}
