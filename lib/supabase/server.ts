/**
 * lib/supabase/server.ts
 *
 * Server-side Supabase client.
 * Uses @supabase/ssr to read/write cookies from Next.js Server Components,
 * Server Actions, and Route Handlers.
 * Do NOT use this in Client Components.
 */

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // setAll called from a Server Component — cookies cannot be set.
            // Middleware handles session refresh; this is a no-op here.
          }
        },
      },
    },
  );
}
