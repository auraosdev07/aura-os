import { getArtifact } from "@/services/artifact";
import { ArtifactPreview } from "@/features/artifacts/artifact-preview";
import { ArtifactDetails } from "@/features/artifacts/artifact-details";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ArtifactDetailsPage({ params }: PageProps) {
  const resolvedParams = await params;
  const artifact = await getArtifact(resolvedParams.id);

  if (!artifact) {
    notFound();
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <Link href="/artifacts" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-4">
          <ChevronLeft className="mr-1 h-4 w-4" />
          Back to Artifacts
        </Link>

        <h1 className="text-3xl font-bold tracking-tight line-clamp-1" title={artifact.name}>
          {artifact.name}
        </h1>
        <p className="text-muted-foreground mt-1">
          Artifact details and preview
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Content: Preview */}
        <div className="lg:col-span-2 space-y-6 h-full">
          <ArtifactPreview artifact={artifact} />
        </div>

        {/* Sidebar: Details & Metadata */}
        <div className="space-y-6">
          <ArtifactDetails artifact={artifact} />
        </div>

      </div>
    </div>
  );
}
