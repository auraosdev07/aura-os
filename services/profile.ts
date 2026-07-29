"use server";

/**
 * services/profile.ts
 *
 * Profile service — business logic layer for Profile operations.
 *
 * All database access goes through lib/db/queries.ts and lib/db/mutations.ts.
 * Components call these service functions; they never import from lib/db directly.
 *
 * Architecture reference: ARCHITECTURE.md §8 Data Flow
 */

import { getServerContext } from "@/lib/auth/get-server-context";
import { getProfile } from "@/lib/db/queries";
import {
  upsertProfile,
  updateProfile as updateProfileMutation,
  insertProfileIgnoreConflicts,
} from "@/lib/db/mutations";
import type { ProfileRow, ProfileInsert, ProfileUpdate } from "@/types/database";
import type { User } from "@supabase/supabase-js";

/**
 * Fetches the currently authenticated user's profile.
 * Returns null if no user is signed in or no profile exists.
 */
export async function getCurrentProfile(): Promise<ProfileRow | null> {
  const { supabase, user } = await getServerContext();

  if (!user) {
    return null;
  }

  try {
    return await getProfile(supabase, user.id);
  } catch (error) {
    console.error("Failed to fetch current profile:", error);
    return null;
  }
}

/**
 * Creates or overwrites a profile.
 * Typically you should use `ensureProfileExists` instead to safely avoid overwriting.
 */
export async function createProfile(data: ProfileRow): Promise<ProfileRow> {
  const { supabase } = await getServerContext();
  return await upsertProfile(supabase, data);
}

/**
 * Updates an existing profile.
 */
export async function updateProfile(
  ownerId: string,
  data: ProfileUpdate,
): Promise<ProfileRow> {
  const { supabase } = await getServerContext();
  return await updateProfileMutation(supabase, ownerId, data);
}

/**
 * Ensures a profile row exists for the given authenticated user.
 * This is an idempotent, conflict-ignoring operation. It will NOT overwrite
 * an existing profile's fields (like full_name) if it already exists.
 *
 * It catches its own errors so it never breaks the authentication flow.
 *
 * @param user The authenticated Supabase Auth User
 * @returns true if successful (or if it already existed), false if an error occurred.
 */
export async function ensureProfileExists(user: User): Promise<boolean> {
  const { supabase } = await getServerContext();

  const profileData: ProfileInsert = {
    id: user.id,
    email: user.email ?? "",
    full_name: "Owner", // Neutral default required by the schema
  };

  try {
    await insertProfileIgnoreConflicts(supabase, profileData);
    return true;
  } catch (error) {
    console.error("Failed to ensure profile exists:", error);
    return false;
  }
}
