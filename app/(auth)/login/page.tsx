"use client";

/**
 * app/(auth)/login/page.tsx
 *
 * Owner sign-in page.
 *
 * Behaviour:
 * - Submits credentials to services/auth.ts → signIn()
 * - On success: router.push("/dashboard") — proxy.ts enforces session on arrival
 * - On failure: shows the error message returned by Supabase
 *
 * Design: Minimal, premium, editorial — matches Aura OS UI principles.
 * No demo data. No bypass. Production credentials only.
 *
 * Architecture reference: PRD §10.1, ARCHITECTURE.md §7
 */

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AuraBrand } from "@/components/brand/aura-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signIn } from "@/services/auth";

/* ── Login Form ─────────────────────────────────────────────── */

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsPending(true);

    const { error: signInError } = await signIn(email, password);

    if (signInError) {
      setError(signInError);
      setIsPending(false);
      return;
    }

    // Session cookie set — navigate to dashboard.
    // proxy.ts will enforce session validity on arrival.
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="w-full max-w-sm space-y-8">
      {/* ── Brand ── */}
      <div className="flex flex-col items-center gap-3">
        <AuraBrand collapsed={false} />
        <p className="text-sm text-muted-foreground">
          Sign in to your workspace
        </p>
      </div>

      {/* ── Card ── */}
      <div className="rounded-2xl border border-border bg-card shadow-sm p-8 space-y-6">
        {/* Error banner */}
        {error && (
          <div
            role="alert"
            className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          >
            {error}
          </div>
        )}

        <form
          id="login-form"
          onSubmit={handleSubmit}
          className="space-y-5"
          noValidate
        >
          {/* Email */}
          <div className="space-y-1.5">
            <label
              htmlFor="login-email"
              className="block text-sm font-medium text-foreground"
            >
              Email address
            </label>
            <Input
              id="login-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isPending}
              placeholder="you@example.com"
            />
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label
              htmlFor="login-password"
              className="block text-sm font-medium text-foreground"
            >
              Password
            </label>
            <Input
              id="login-password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isPending}
              placeholder="••••••••"
            />
          </div>

          {/* Submit */}
          <Button
            id="login-submit"
            type="submit"
            disabled={isPending || !email || !password}
            className="w-full h-auto py-2.5 text-sm font-semibold rounded-lg"
          >
            {isPending ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </div>

      {/* ── Footer ── */}
      <p className="text-center text-xs text-muted-foreground">
        Aura OS · AI Workforce Operating System
      </p>
    </div>
  );
}
