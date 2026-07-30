import type { Metadata } from "next";
import { AIWorkspaceFeature } from "@/features/ai/ai-workspace-feature";

export const metadata: Metadata = {
  title: "AI Workspace · Aura OS",
  description: "AI infrastructure & chat workspace.",
};

export default async function AIWorkspacePage() {
  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <AIWorkspaceFeature />
    </div>
  );
}
