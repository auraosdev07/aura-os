import { AuraSoulExplorer, type StorefrontProduct } from "@/features/integrations/aura-soul-explorer";
import { getProducts, getCategories, getCollections } from "@/services/connectors/aura-soul";
import type { CategoryRow, CollectionRow } from "@/types/database";

export const metadata = {
  title: "Aura & Soul Live Explorer | Aura OS",
  description: "Live schema and dataset explorer connected to the external Aura & Soul database.",
};

export default async function AuraSoulExplorerPage() {
  let products: StorefrontProduct[] = [];
  let categories: CategoryRow[] = [];
  let collections: CollectionRow[] = [];
  let errorMessage: string | null = null;

  try {
    const [prods, cats, cols] = await Promise.all([
      getProducts(),
      getCategories(),
      getCollections(),
    ]);
    products = prods as StorefrontProduct[];
    categories = cats;
    collections = cols;
  } catch (err: unknown) {
    errorMessage = (err as Error).message || "Failed to establish connection to Aura & Soul database.";
  }

  return (
    <AuraSoulExplorer
      initialProducts={products}
      initialCategories={categories}
      initialCollections={collections}
      errorMessage={errorMessage}
    />
  );
}
