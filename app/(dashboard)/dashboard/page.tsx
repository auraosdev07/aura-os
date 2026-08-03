import { buildDashboardView } from "@/services/dashboard";
import { DashboardFeature } from "@/features/dashboard/dashboard-feature";

export const metadata = {
  title: "Live Business Dashboard | Aura OS",
  description: "Live operational and commercial telemetry for Aura & Soul.",
};

export default async function DashboardPage() {
  const initialData = await buildDashboardView();

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <DashboardFeature initialData={initialData} />
    </div>
  );
}
