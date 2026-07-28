"use client";

import type { ArtifactView } from "@/services/artifact";
import { ArtifactTypeBadge } from "./artifact-type-badge";
import { formatBytes } from "@/lib/utils";

interface ArtifactPreviewProps {
  artifact: ArtifactView;
}

export function ArtifactPreview({ artifact }: ArtifactPreviewProps) {
  const isImage = artifact.mimeType?.startsWith("image/");
  const isVideo = artifact.mimeType?.startsWith("video/");
  const isPdf = artifact.mimeType === "application/pdf";

  return (
    <div className="flex flex-col h-full bg-card border rounded-lg overflow-hidden">
      <div className="p-4 border-b bg-muted/20 flex justify-between items-center">
        <div>
          <h3 className="font-medium text-sm line-clamp-1" title={artifact.name}>
            {artifact.name}
          </h3>
          <p className="text-xs text-muted-foreground">
            {artifact.sizeBytes ? formatBytes(artifact.sizeBytes) : "Unknown size"}
          </p>
        </div>
        <ArtifactTypeBadge mimeType={artifact.mimeType} />
      </div>

      <div className="flex-1 flex items-center justify-center p-4 bg-muted/10 overflow-hidden relative min-h-[300px]">
        {isImage ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img 
            src={artifact.publicUrl} 
            alt={artifact.name}
            className="max-w-full max-h-[600px] object-contain rounded-md"
          />
        ) : isVideo ? (
          <video 
            src={artifact.publicUrl} 
            controls 
            className="max-w-full max-h-[600px] rounded-md"
          />
        ) : isPdf ? (
          <iframe 
            src={`${artifact.publicUrl}#toolbar=0`} 
            className="w-full h-[600px] rounded-md border"
            title={artifact.name}
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-center p-8">
            <p className="text-muted-foreground mb-4">
              Preview not available for this file type.
            </p>
            <a 
              href={artifact.publicUrl} 
              target="_blank" 
              rel="noreferrer"
              className="text-sm bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
            >
              Download to view
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
