"use client";

import Link from "next/link";
import { FileText } from "lucide-react";
import type { KnowledgeView } from "@/services/knowledge";
import { KnowledgeLayerBadge } from "./knowledge-layer-badge";
import { Button } from "@/components/ui/button";

interface KnowledgeTableProps {
  entries: KnowledgeView[];
  onEdit: (entry: KnowledgeView) => void;
  onArchive: (id: string) => void;
}

export function KnowledgeTable({ entries, onEdit, onArchive }: KnowledgeTableProps) {
  if (entries.length === 0) {
    return (
      <div className="border border-dashed rounded-lg p-12 text-center text-muted-foreground">
        <p>No knowledge entries found.</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border bg-card">
      <div className="relative w-full overflow-auto">
        <table className="w-full caption-bottom text-sm">
          <thead className="[&_tr]:border-b bg-muted/50">
            <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
              <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground w-1/2">Title</th>
              <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Layer</th>
              <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground hidden md:table-cell">Context</th>
              <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground hidden sm:table-cell">Updated</th>
              <th className="h-10 px-4 align-middle w-[50px]"></th>
            </tr>
          </thead>
          <tbody className="[&_tr:last-child]:border-0">
            {entries.map((entry) => (
              <tr
                key={entry.id}
                className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
              >
                <td className="p-4 align-middle">
                  <Link 
                    href={`/knowledge/${entry.id}`}
                    className="font-medium hover:underline flex items-center gap-2"
                  >
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    {entry.title}
                  </Link>
                </td>
                <td className="p-4 align-middle">
                  <KnowledgeLayerBadge layer={entry.layer} />
                </td>
                <td className="p-4 align-middle text-muted-foreground hidden md:table-cell">
                  {entry.layer === "PROJECT" && entry.mission_id ? (
                    <span className="truncate max-w-[150px] inline-block">Mission</span>
                  ) : entry.layer === "EMPLOYEE" && entry.employee_id ? (
                    <span className="truncate max-w-[150px] inline-block">Employee</span>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="p-4 align-middle text-muted-foreground hidden sm:table-cell">
                  {new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(new Date(entry.updatedAt))}
                </td>
                <td className="p-4 align-middle">
                  <div className="flex items-center justify-end gap-2">
                    <Link href={`/knowledge/${entry.id}`}>
                      <Button variant="ghost" size="sm">
                        View
                      </Button>
                    </Link>
                    <Button variant="ghost" size="sm" onClick={() => onEdit(entry)}>
                      Edit
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => onArchive(entry.id)}
                    >
                      Archive
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
