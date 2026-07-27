import type { Metadata } from "next";
import { ProfileForm } from "@/features/profile/profile-form";

export const metadata: Metadata = {
  title: "Profile | Aura OS",
  description: "Manage your owner profile and settings.",
};

export default function ProfilePage() {
  return (
    <div className="flex-1 space-y-8 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Profile</h2>
      </div>
      <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
        <div className="flex-1 max-w-4xl">
          <ProfileForm />
        </div>
      </div>
    </div>
  );
}
