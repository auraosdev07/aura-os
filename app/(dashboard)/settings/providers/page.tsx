import { ProvidersSettingsFeature } from "@/features/settings/providers-settings-feature";

export const metadata = {
  title: "AI Providers Settings | Aura OS",
  description: "Configure primary execution provider, fallback rules, models, and verify API connectivity.",
};

export default function ProvidersSettingsPage() {
  return (
    <div className="container max-w-7xl mx-auto py-6 space-y-6">
      <ProvidersSettingsFeature />
    </div>
  );
}
