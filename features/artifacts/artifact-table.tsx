"use client";

import Link from "next/link";
import { formatBytes } from "@/lib/utils";
import type { ArtifactView } from "@/services/artifact";
import { ArtifactTypeBadge } from "./artifact-type-badge";
import { Trash2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ArtifactTableProps {
  artifacts: ArtifactView[];
  onDelete: (id: string) => void;
}

export function ArtifactTable({ artifacts, onDelete }: ArtifactTableProps) {
  return (
    <div className="rounded-md border bg-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted/50 text-muted-foreground border-b text-xs uppercase">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Size</th>
              <th className="px-4 py-3 font-medium">Linked To</th>
              <th className="px-4 py-3 font-medium">Uploaded</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {artifacts.map((artifact) => (
              <tr key={artifact.id} className="hover:bg-muted/50 transition-colors">
                <td className="px-4 py-3 font-medium">
                  <Link href={`/artifacts/${artifact.id}`} className="hover:underline">
                    {artifact.name}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <ArtifactTypeBadge mimeType={artifact.mimeType} />
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {artifact.sizeBytes ? formatBytes(artifact.sizeBytes) : "Unknown"}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {artifact.missionName ? (
                    <span className="text-xs bg-secondary px-2 py-1 rounded-md">Mission: {artifact.missionName}</span>
                  ) : artifact.knowledgeTitle ? (
                    <span className="text-xs bg-secondary px-2 py-1 rounded-md">Knowledge: {artifact.knowledgeTitle}</span>
                  ) : artifact.employeeName ? (
                    <span className="text-xs bg-secondary px-2 py-1 rounded-md">Employee: {artifact.employeeName}</span>
                  ) : (
                    "Global"
                  )}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(new Date(artifact.createdAt))}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <a href={artifact.publicUrl} target="_blank" rel="noreferrer" title="Download/View" className="inline-flex items-center justify-center h-8 w-8 rounded-md text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors">
                      <Download className="h-4 w-4" />
                    </a>
                    <Button variant="ghost" size="icon" onClick={() => onDelete(artifact.id)} className="text-destructive hover:bg-destructive/10 hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
