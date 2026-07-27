/**
 * types/auth.ts
 *
 * Shared TypeScript types for authentication.
 * Derived from Supabase Auth's User type — exported here so all
 * auth-related code imports from a single location.
 */

import type { User } from "@supabase/supabase-js";

/** The shape of the AuthContext value. */
export interface AuthContextValue {
  /** The authenticated Supabase user. Null when not signed in. */
  user: User | null;
  /** True while the initial session is being resolved. */
  isLoading: boolean;
}

export type { User };
