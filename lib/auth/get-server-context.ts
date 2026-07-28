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
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return { supabase, user };
}
