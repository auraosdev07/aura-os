/**
 * lib/supabase/client.ts
 *
 * Browser-side Supabase client.
 * Uses @supabase/ssr to handle cookie-based sessions in Next.js App Router.
 * Use this client in Client Components only.
 */

import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}