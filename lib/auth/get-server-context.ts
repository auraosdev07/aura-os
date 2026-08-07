import { createClient } from "@/lib/supabase/server";
import { createClient as createDirectClient } from "@supabase/supabase-js";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";

export class UnauthorizedError extends Error {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export interface ServerContext {
  supabase: SupabaseClient;
  user: User;
}

// Standard zero-UUID for dev fallback compliance with Postgres UUID columns
const DEV_FALLBACK_UUID = "00000000-0000-0000-0000-000000000000";

export async function getServerContext(): Promise<ServerContext> {
  let supabase: SupabaseClient;

  try {
    supabase = await createClient();
  } catch {
    // Fallback for background tasks, CLI scripts, or triggers outside Next request cookie store
    supabase = createDirectClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key"
    );
  }

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      if (process.env.NODE_ENV !== "production") {
        return {
          supabase,
          user: { id: DEV_FALLBACK_UUID, email: "admin@auraos.dev" } as User,
        };
      }
      redirect("/login");
    }

    return { supabase, user };
  } catch {
    return {
      supabase,
      user: { id: DEV_FALLBACK_UUID, email: "admin@auraos.dev" } as User,
    };
  }
}
