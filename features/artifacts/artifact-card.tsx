"use client";

import type { ArtifactView } from "@/services/artifact";
import { formatBytes } from "@/lib/utils";
import { ArtifactTypeBadge } from "./artifact-type-badge";
import { Download } from "lucide-react";

interface ArtifactCardProps {
  artifact: ArtifactView;
}

export function ArtifactCard({ artifact }: ArtifactCardProps) {
  return (
    <div className="flex flex-col p-4 rounded-xl border bg-card text-card-foreground shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <ArtifactTypeBadge mimeType={artifact.mimeType} />
        <a href={artifact.publicUrl} target="_blank" rel="noreferrer" title="Download" className="inline-flex items-center justify-center h-8 w-8 rounded-md text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors">
          <Download className="h-4 w-4" />
        </a>
      </div>
      
      <div className="flex-1">
        <h4 className="font-medium text-sm line-clamp-2 mb-1" title={artifact.name}>
          {artifact.name}
        </h4>
        <p className="text-xs text-muted-foreground">
          {artifact.sizeBytes ? formatBytes(artifact.sizeBytes) : "Unknown size"}
        </p>
      </div>

      <div className="mt-4 pt-4 border-t flex flex-col gap-1">
        <span className="text-xs text-muted-foreground">
          Uploaded {new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(new Date(artifact.createdAt))}
        </span>
      </div>
    </div>
  );
}
