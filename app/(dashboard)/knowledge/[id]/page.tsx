import { KnowledgeDetails } from "@/features/knowledge/knowledge-details";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function KnowledgeDetailsPage({ params }: PageProps) {
  const resolvedParams = await params;
  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <KnowledgeDetails id={resolvedParams.id} />
    </div>
  );
}
