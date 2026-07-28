import type { Metadata } from "next";
import { ManagerFeature } from "@/features/managers/manager-feature";

export const metadata: Metadata = {
  title: "Managers | Aura OS",
  description: "Manage your AI supervisors.",
};

export default function ManagersPage() {
  return (
    <div className="flex-1 space-y-8 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Managers</h2>
      </div>
      <div className="w-full">
        <ManagerFeature />
      </div>
    </div>
  );
}
