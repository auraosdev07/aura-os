import { IntegrationsFeature } from "@/features/integrations/integrations-feature";
import { fetchIntegrationsService } from "@/services/integration";

export const metadata = {
  title: "Integrations | Aura OS AI Operating System",
  description: "Manage third-party platform integrations, external database connectors, and API credentials for Aura OS.",
};

export default async function IntegrationsPage() {
  const initialIntegrations = await fetchIntegrationsService();
  return <IntegrationsFeature initialIntegrations={initialIntegrations} />;
}
