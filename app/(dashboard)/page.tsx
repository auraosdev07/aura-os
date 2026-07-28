import { buildDashboardView } from "@/services/dashboard";
import { DashboardFeature } from "@/features/dashboard/dashboard-feature";

export default async function DashboardPage() {
  const data = await buildDashboardView();

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <DashboardFeature data={data} />
    </div>
  );
}
