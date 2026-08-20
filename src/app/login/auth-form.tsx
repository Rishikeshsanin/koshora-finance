"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { signIn, signUp } from "./actions";

type Mode = "signin" | "signup";

function PendingBar() {
  const { pending } = useFormStatus();
  if (!pending) return null;
  return <div className="auth-progress" aria-hidden="true"><span /></div>;
}

function AuthActions({ mode, setMode }: { mode: Mode; setMode: (mode: Mode) => void }) {
  const { pending } = useFormStatus();
  const signingUp = mode === "signup";

  return (
    <div className="auth-actions">
      <button
        className="secondary auth-action"
        type={signingUp ? "button" : "submit"}
        disabled={pending}
        onClick={signingUp ? () => setMode("signin") : undefined}
      >
        {pending && !signingUp ? <span className="auth-working"><i />Signing in…</span> : "Sign in"}
      </button>
      <button
        className="primary auth-action"
        type={signingUp ? "submit" : "button"}
        disabled={pending}
        onClick={!signingUp ? () => setMode("signup") : undefined}
      >
        {pending && signingUp ? <span className="auth-working"><i />Creating account…</span> : "Create account"}
      </button>
    </div>
  );
}

export default function AuthForm() {
  const [mode, setMode] = useState<Mode>("signin");
  const signingUp = mode === "signup";

  return (
    <form action={signingUp ? signUp : signIn} aria-busy={undefined}>
      <PendingBar />
      {signingUp && (
        <label className="auth-name-field">
          Name
          <input
            type="text"
            name="fullName"
            autoComplete="name"
            minLength={2}
            maxLength={80}
            required
            autoFocus
            placeholder="Your name"
          />
        </label>
      )}
      <label>
        Email
        <input type="email" name="email" autoComplete="email" required placeholder="you@example.com" />
      </label>
      <label>
        Password
        <input
          type="password"
          name="password"
          autoComplete={signingUp ? "new-password" : "current-password"}
          minLength={8}
          required
          placeholder="At least 8 characters"
        />
      </label>
      {signingUp && <p className="auth-mode-note">We’ll save your name to your private Koshora account profile.</p>}
      <AuthActions mode={mode} setMode={setMode} />
    </form>
  );
}
