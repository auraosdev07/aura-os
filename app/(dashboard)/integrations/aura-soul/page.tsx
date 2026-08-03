import { AuraSoulDetail } from "@/features/integrations/aura-soul-detail";
import { fetchIntegrationBySlugService } from "@/services/integration";

export const metadata = {
  title: "Aura & Soul Integration | Aura OS",
  description: "Configure Aura & Soul live website Supabase credentials.",
};

export default async function AuraSoulIntegrationPage() {
  const initialIntegration = await fetchIntegrationBySlugService("aura-soul");
  return <AuraSoulDetail initialIntegration={initialIntegration} />;
}
