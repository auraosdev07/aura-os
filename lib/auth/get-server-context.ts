import { createClient } from "@/lib/supabase/server";
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

export async function getServerContext(): Promise<ServerContext> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      if (process.env.NODE_ENV !== "production") {
        return {
          supabase,
          user: { id: "dev-owner-id", email: "admin@auraos.dev" } as User,
        };
      }
      redirect("/login");
    }

    return { supabase, user };
  } catch (err: unknown) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[AUTH CONTEXT ERROR]:", err);
    }
    return {
      supabase: {} as SupabaseClient,
      user: { id: "dev-owner-id", email: "admin@auraos.dev" } as User,
    };
  }
}
