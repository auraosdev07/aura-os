"use client";

import type { ArtifactView } from "@/services/artifact";
import { formatBytes } from "@/lib/utils";
import { BrainCircuit, Cpu, ScanText, GitMerge, FileCheck } from "lucide-react";

interface ArtifactDetailsProps {
  artifact: ArtifactView;
}

export function ArtifactDetails({ artifact }: ArtifactDetailsProps) {
  return (
    <div className="space-y-6">
      
      {/* Basic Metadata */}
      <div className="bg-card border rounded-lg p-5 space-y-4">
        <h3 className="font-semibold tracking-tight text-sm uppercase text-muted-foreground">Properties</h3>
        <div className="grid grid-cols-2 gap-y-4 text-sm">
          <div>
            <span className="block text-muted-foreground mb-1">MIME Type</span>
            <span className="font-medium">{artifact.mimeType || "Unknown"}</span>
          </div>
          <div>
            <span className="block text-muted-foreground mb-1">Size</span>
            <span className="font-medium">{artifact.sizeBytes ? formatBytes(artifact.sizeBytes) : "Unknown"}</span>
          </div>
          <div>
            <span className="block text-muted-foreground mb-1">Checksum</span>
            <span className="font-medium font-mono text-xs truncate" title={artifact.checksum || ""}>
              {artifact.checksum || "Not calculated"}
            </span>
          </div>
          <div>
            <span className="block text-muted-foreground mb-1">Created At</span>
            <span className="font-medium">
              {new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(artifact.createdAt))}
            </span>
          </div>
        </div>
      </div>

      {/* Relations */}
      <div className="bg-card border rounded-lg p-5 space-y-4">
        <h3 className="font-semibold tracking-tight text-sm uppercase text-muted-foreground">Links</h3>
        
        {artifact.missionName && (
          <div className="flex justify-between items-center text-sm border-b pb-3">
            <span className="text-muted-foreground flex items-center gap-2"><GitMerge className="h-4 w-4" /> Mission</span>
            <span className="font-medium bg-secondary px-2 py-1 rounded-md">{artifact.missionName}</span>
          </div>
        )}
        
        {artifact.knowledgeTitle && (
          <div className="flex justify-between items-center text-sm border-b pb-3">
            <span className="text-muted-foreground flex items-center gap-2"><BrainCircuit className="h-4 w-4" /> Knowledge</span>
            <span className="font-medium bg-secondary px-2 py-1 rounded-md">{artifact.knowledgeTitle}</span>
          </div>
        )}
        
        {artifact.employeeName && (
          <div className="flex justify-between items-center text-sm border-b pb-3">
            <span className="text-muted-foreground flex items-center gap-2"><Cpu className="h-4 w-4" /> Employee</span>
            <span className="font-medium bg-secondary px-2 py-1 rounded-md">{artifact.employeeName}</span>
          </div>
        )}

        {!artifact.missionName && !artifact.knowledgeTitle && !artifact.employeeName && (
          <p className="text-sm text-muted-foreground">This artifact is global and not linked to any specific entity.</p>
        )}
      </div>

      {/* Future Capabilities Placeholders */}
      <div className="bg-card border border-dashed rounded-lg p-5 space-y-4 opacity-60">
        <h3 className="font-semibold tracking-tight text-sm uppercase text-muted-foreground flex items-center gap-2">
          <BrainCircuit className="h-4 w-4" />
          AI Capabilities (Future)
        </h3>
        
        <div className="space-y-4 text-sm">
          <div className="flex justify-between items-center">
            <span className="flex items-center gap-2"><ScanText className="h-4 w-4" /> OCR Extraction</span>
            <span className="px-2 py-1 bg-muted rounded-md text-xs">Pending</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="flex items-center gap-2"><Cpu className="h-4 w-4" /> Semantic Embedding</span>
            <span className="px-2 py-1 bg-muted rounded-md text-xs">Pending</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="flex items-center gap-2"><FileCheck className="h-4 w-4" /> Approval Workflow</span>
            <span className="px-2 py-1 bg-muted rounded-md text-xs">Not Started</span>
          </div>
        </div>
      </div>

    </div>
  );
}
