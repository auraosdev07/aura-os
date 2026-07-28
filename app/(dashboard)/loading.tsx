export default function LoadingPage() {
  return (
    <div className="flex h-[50vh] flex-col items-center justify-center text-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
      <p className="mt-4 text-sm text-muted-foreground animate-pulse">Loading data...</p>
    </div>
  );
}
