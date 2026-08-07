"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { KnowledgeView } from "@/services/knowledge";
import { getKnowledgeById } from "@/services/knowledge";
import { KnowledgeLayerBadge } from "./knowledge-layer-badge";
import { Button } from "@/components/ui/button";

interface KnowledgeDetailsProps {
  id: string;
}

export function KnowledgeDetails({ id }: KnowledgeDetailsProps) {
  const [entry, setEntry] = useState<KnowledgeView | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getKnowledgeById(id)
      .then((data) => {
        if (active) {
          if (!data) {
            setError("Knowledge entry not found or you do not have permission to view it.");
          } else {
            setEntry(data);
          }
        }
      })
      .catch((err: unknown) => {
        if (active) {
          setError(err instanceof Error ? err.message : "Failed to load knowledge entry");
        }
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id]);

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-10 bg-muted rounded w-1/3"></div>
        <div className="h-4 bg-muted rounded w-1/4"></div>
        <div className="h-40 bg-muted rounded w-full"></div>
      </div>
    );
  }

  if (error || !entry) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-xl text-destructive mb-4">{error || "Knowledge entry not found."}</p>
        <Link href="/knowledge">
          <Button variant="outline">Back to Knowledge Base</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Overview Panel */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold tracking-tight">{entry.title}</h1>
            <KnowledgeLayerBadge layer={entry.layer} />
          </div>
          <p className="text-sm text-muted-foreground flex flex-col sm:flex-row sm:gap-4">
            <span>Created: {new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(new Date(entry.createdAt))}</span>
            <span className="hidden sm:inline">•</span>
            <span>Last Updated: {new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(new Date(entry.updatedAt))}</span>
          </p>
        </div>
        <Link href="/knowledge">
          <Button variant="outline">Back</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Content Column */}
        <div className="lg:col-span-2 space-y-8">
          {/* Content Panel */}
          <section className="bg-card border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 border-b pb-2">Content</h2>
            <div className="whitespace-pre-wrap text-card-foreground leading-relaxed">
              {entry.content}
            </div>
          </section>

          {/* AI Insights Placeholder */}
          <section className="bg-card border rounded-lg p-6 opacity-70">
            <h2 className="text-xl font-semibold mb-4 border-b pb-2">AI Insights</h2>
            <p className="text-muted-foreground italic mb-2">
              Future integration point for AI summaries, key takeaways, and relevance scores.
            </p>
            {entry.aiSummary ? (
              <p>{entry.aiSummary}</p>
            ) : (
              <p className="text-sm">No AI insights generated yet.</p>
            )}
          </section>

          {/* Related Knowledge / Timeline Placeholder */}
          <section className="bg-card border rounded-lg p-6 opacity-70">
            <h2 className="text-xl font-semibold mb-4 border-b pb-2">Related Knowledge & Timeline</h2>
            <p className="text-muted-foreground italic">
              Future integration point for temporal activity and vector-based similar entries.
            </p>
          </section>
        </div>

        {/* Sidebar Column */}
        <div className="space-y-8">
          {/* Context Links Placeholder */}
          <section className="bg-card border rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4 border-b pb-2">Context Links</h2>
            <div className="space-y-4">
              {entry.layer === "PROJECT" && entry.mission_id ? (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Associated Mission</p>
                  <Link href={`/missions/${entry.mission_id}`} className="text-primary hover:underline font-medium">
                    View Mission →
                  </Link>
                </div>
              ) : entry.layer === "EMPLOYEE" && entry.employee_id ? (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Associated Employee</p>
                  <Link href={`/employees`} className="text-primary hover:underline font-medium">
                    View Employee →
                  </Link>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Global Company Knowledge</p>
              )}
            </div>
          </section>

          {/* Artifacts Placeholder */}
          <section className="bg-card border rounded-lg p-6 opacity-70">
            <h2 className="text-lg font-semibold mb-4 border-b pb-2">Artifacts</h2>
            <p className="text-muted-foreground italic text-sm mb-2">
              Future integration point for related files and outputs.
            </p>
            <p className="text-sm font-medium">{entry.relatedArtifactCount} artifact(s) linked.</p>
          </section>

        </div>
      </div>
    </div>
  );
}
