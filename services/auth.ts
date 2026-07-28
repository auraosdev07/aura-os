"use server";

/**
 * services/auth.ts
 *
 * Authentication service functions.
 * All Supabase Auth calls are isolated here.
 * Components and hooks call these functions — never Supabase directly.
 *
 * Architecture reference: ARCHITECTURE.md §8 Data Flow
 */

import { createClient } from "@/lib/supabase/server";

export interface SignInResult {
  error: string | null;
}

/**
 * Sign in with email and password.
 * Returns { error: null } on success, { error: message } on failure.
 */
export async function signIn(
  email: string,
  password: string,
): Promise<SignInResult> {
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message };
  }

  return { error: null };
}

/**
 * Sign out the current user.
 * Clears the Supabase session cookie.
 */
export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
}
