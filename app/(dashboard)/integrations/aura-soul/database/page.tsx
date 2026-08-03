import { AuraSoulDatabaseExplorer } from "@/features/integrations/aura-soul-db-explorer";
import { getExternalDatabaseSchema } from "@/services/connectors/aura-soul/schema";
import type { DatabaseSchemaResult } from "@/services/connectors/aura-soul/schema";

export const metadata = {
  title: "Database Explorer | Aura & Soul Integration | Aura OS",
  description:
    "Live read-only schema introspection of the external Aura & Soul database — tables, columns, data types, and row counts.",
};

export default async function AuraSoulDatabasePage() {
  let schema: DatabaseSchemaResult | null = null;
  let errorMessage: string | null = null;
  const fetchedAt = new Date().toISOString();

  try {
    schema = await getExternalDatabaseSchema();
  } catch (err: unknown) {
    errorMessage =
      (err as Error).message ||
      "Failed to establish connection to Aura & Soul database.";
  }

  return (
    <AuraSoulDatabaseExplorer
      schema={schema}
      errorMessage={errorMessage}
      fetchedAt={fetchedAt}
    />
  );
}
