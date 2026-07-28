"use client";

import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex h-[50vh] flex-col items-center justify-center gap-4 text-center">
      <div className="rounded-full bg-destructive/10 p-3 text-destructive">
        <AlertCircle className="h-6 w-6" />
      </div>
      <div className="space-y-1 text-center">
        <h2 className="text-lg font-semibold tracking-tight">Something went wrong!</h2>
        <p className="text-sm text-muted-foreground">{error.message || "An unexpected error occurred while loading this page."}</p>
      </div>
      <Button variant="outline" onClick={() => reset()}>
        Try again
      </Button>
    </div>
  );
}
