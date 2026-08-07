import { RuntimeControlFeature } from "@/features/runtime/runtime-control-feature";

export const metadata = {
  title: "Runtime Control Center | Aura OS",
  description: "Live engine telemetry, auto-orchestration controller & execution logs.",
};

export default function RuntimePage() {
  return (
    <div className="container max-w-7xl mx-auto py-6 space-y-6">
      <RuntimeControlFeature />
    </div>
  );
}
