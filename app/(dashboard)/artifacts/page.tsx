import { getArtifacts } from "@/services/artifact";
import { ArtifactFeature } from "@/features/artifacts/artifact-feature";

export default async function ArtifactsPage() {
  const artifacts = await getArtifacts();

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex flex-col gap-2 mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Artifacts</h1>
        <p className="text-muted-foreground">
          Central repository for mission files, generated outputs, and knowledge attachments.
        </p>
      </div>

      <ArtifactFeature initialArtifacts={artifacts} />
    </div>
  );
}
