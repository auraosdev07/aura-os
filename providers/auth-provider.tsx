"use client";

/**
 * providers/auth-provider.tsx
 *
 * Provides the authenticated Supabase user to all client components.
 * Listens for auth state changes (sign in, sign out, token refresh)
 * and keeps the context value in sync.
 *
 * Exports:
 *  - AuthProvider  — wrap around the app in the root layout
 *  - useAuth       — hook to consume auth context in any Client Component
 *
 * Architecture reference: ARCHITECTURE.md §6 State Management, §7 Auth Flow
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { createClient } from "@/lib/supabase/client";
import type { AuthContextValue, User } from "@/types/auth";
import { ensureProfileExists } from "@/services/profile";

/* ── Context ────────────────────────────────────────────────── */

const AuthContext = createContext<AuthContextValue | null>(null);

/* ── Provider ───────────────────────────────────────────────── */

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    // Resolve the initial session on mount.
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setIsLoading(false);
    });

    // Subscribe to auth state changes for the lifetime of this component.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Ensure the profile exists whenever a new user session is established.
  useEffect(() => {
    if (user) {
      ensureProfileExists(user).catch(console.error);
    }
    // We only want to run this when the underlying user ID changes, not on every user object reference change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  return (
    <AuthContext.Provider value={{ user, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

/* ── Hook ───────────────────────────────────────────────────── */

/**
 * useAuth
 *
 * Returns the current auth context.
 * Must be called inside a component wrapped by <AuthProvider>.
 */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return ctx;
}
