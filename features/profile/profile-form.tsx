"use client";

import { useState, useEffect, type FormEvent } from "react";
import { getCurrentProfile, updateProfile } from "@/services/profile";
import type { ProfileRow } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProfileAvatar } from "./profile-avatar";
import { ProfileCard } from "./profile-card";

export function ProfileForm() {
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  
  // Form states
  const [fullName, setFullName] = useState("");
  
  // UI states
  const [isFetching, setIsFetching] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function loadProfile() {
      try {
        const data = await getCurrentProfile();
        if (mounted && data) {
          setProfile(data);
          setFullName(data.full_name);
        }
      } catch {
        if (mounted) {
          setError("Failed to load profile data.");
        }
      } finally {
        if (mounted) {
          setIsFetching(false);
        }
      }
    }
    loadProfile();
    return () => { mounted = false; };
  }, []);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!profile) return;

    setError(null);
    setSuccessMsg(null);
    setIsSaving(true);

    const trimmedName = fullName.trim();
    if (!trimmedName) {
      setError("Full name is required.");
      setIsSaving(false);
      return;
    }
    if (trimmedName.length > 100) {
      setError("Full name must be 100 characters or less.");
      setIsSaving(false);
      return;
    }

    try {
      const updated = await updateProfile(profile.id, { full_name: trimmedName });
      setProfile(updated);
      setFullName(updated.full_name);
      setSuccessMsg("Profile updated successfully.");
      
      // Auto-dismiss success message after 3 seconds
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred while saving.");
    } finally {
      setIsSaving(false);
    }
  }

  // Derive disabled state
  const hasChanges = profile ? fullName.trim() !== profile.full_name : false;
  const isSaveDisabled = isSaving || !hasChanges || !fullName.trim();

  if (isFetching) {
    return (
      <div className="w-full max-w-2xl space-y-4">
        {/* Skeleton loader */}
        <div className="h-64 rounded-2xl bg-muted/20 animate-pulse border border-border" />
      </div>
    );
  }

  if (!profile && !isFetching) {
    return (
      <div className="w-full max-w-2xl">
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-6 text-sm text-destructive">
          Error: Could not retrieve profile information.
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl space-y-6">
      <ProfileCard 
        title="Personal Information" 
        description="Update your personal details and how you appear to others."
      >
        <form onSubmit={handleSubmit} className="space-y-8" noValidate>
          
          {/* Avatar Section */}
          <div className="flex items-center gap-6">
            <ProfileAvatar name={fullName || "?"} size="lg" />
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-foreground">Avatar</h3>
              <p className="text-sm text-muted-foreground">
                Currently using a text placeholder based on your name.
              </p>
            </div>
          </div>

          <hr className="border-border" />

          {/* Form Grid - Extensible for future fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Full Name */}
            <div className="space-y-2">
              <label htmlFor="full_name" className="block text-sm font-medium text-foreground">
                Full Name
              </label>
              <Input
                id="full_name"
                name="full_name"
                type="text"
                required
                maxLength={100}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={isSaving}
                placeholder="Enter your full name"
              />
            </div>

            {/* Email (Read only) */}
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-foreground">
                Email Address
              </label>
              <Input
                id="email"
                type="email"
                value={profile?.email || ""}
                disabled
                className="bg-muted/50 cursor-not-allowed opacity-80"
              />
              <p className="text-xs text-muted-foreground">
                Email cannot be changed directly.
              </p>
            </div>

            {/* Future fields (Phone, Timezone, etc.) can cleanly sit in this grid */}

          </div>

          {/* Status Messages */}
          {error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}
          {successMsg && (
            <div className="rounded-lg border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-primary">
              {successMsg}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end pt-4">
            <Button
              type="submit"
              disabled={isSaveDisabled}
              className="px-8"
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </ProfileCard>
    </div>
  );
}
