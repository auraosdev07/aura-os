"use client";

/**
 * features/runtime/runtime-control-feature.tsx
 *
 * Aura OS Runtime Control Center (Phase 2 Production)
 * Interactive control panel displaying engine telemetry, auto-mode toggling,
 * manual execution controls, and real-time execution log streaming.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Cpu,
  Play,
  Pause,
  RefreshCw,
  Clock,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Bot,
  Search,
  Activity,
  Terminal,
} from "lucide-react";
import type { RuntimeStats, RuntimeLogEvent } from "@/services/runtime-control";

export function RuntimeControlFeature() {
  const [stats, setStats] = useState<RuntimeStats | null>(null);
  const [logs, setLogs] = useState<RuntimeLogEvent[]>([]);
  const [autoMode, setAutoMode] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [runningAction, setRunningAction] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [lastRefreshed, setLastRefreshed] = useState<string>("");

  const isTickingRef = useRef(false);

  // 1. Fetch live telemetry & logs
  const refreshTelemetry = useCallback(async () => {
    try {
      const res = await fetch("/api/runtime/stats", { cache: "no-store" });
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
        setLogs(data.logs || []);
        setLastRefreshed(new Date().toLocaleTimeString());
      }
    } catch (err) {
      console.error("[RUNTIME TELEMETRY ERROR]:", err);
    }
  }, []);

  // 2. Trigger engine action via API
  const executeEngineAction = useCallback(
    async (action: "planner" | "manager" | "execution" | "merge" | "all") => {
      setRunningAction(action);
      try {
        await fetch("/api/runtime/action", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action }),
        });
        await refreshTelemetry();
      } catch (err) {
        console.error(`[ENGINE ACTION ERROR - ${action}]:`, err);
      } finally {
        setRunningAction(null);
      }
    },
    [refreshTelemetry]
  );

  // 3. Auto Mode Polling Loop (Ticks every 4s when Auto Mode is ON and runtime is NOT paused)
  useEffect(() => {
    const runPoll = async () => {
      if (autoMode && !isPaused && !isTickingRef.current) {
        isTickingRef.current = true;
        try {
          await fetch("/api/runtime/action", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "all" }),
          });
        } catch (err) {
          console.error("[AUTO MODE TICK ERROR]:", err);
        } finally {
          isTickingRef.current = false;
        }
      }
      await refreshTelemetry();
    };

    void runPoll();
    const interval = setInterval(() => {
      void runPoll();
    }, 4000);

    return () => clearInterval(interval);
  }, [autoMode, isPaused, refreshTelemetry]);

  const filteredLogs = logs.filter(
    (l) =>
      l.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.event_type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* ── HEADER & CONTROLS BAR ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-slate-950 border border-slate-800 rounded-2xl shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-purple-500/10 border border-purple-500/30 rounded-xl text-purple-400">
              <Cpu className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                Runtime Control Center
                <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-purple-500/10 text-purple-400 border border-purple-500/30 rounded-full">
                  Phase 2 Live
                </span>
              </h1>
              <p className="text-xs text-slate-400">
                Live engine telemetry, auto-orchestration controller & execution logs. Refreshed at {lastRefreshed || "loading..."}
              </p>
            </div>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Auto Mode Toggle */}
          <button
            onClick={() => setAutoMode(!autoMode)}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl border transition-all flex items-center space-x-2 ${
              autoMode
                ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400 shadow-lg shadow-emerald-500/10"
                : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
            }`}
          >
            <Activity className={`w-4 h-4 ${autoMode ? "animate-spin text-emerald-400" : ""}`} />
            <span>AUTO MODE: {autoMode ? "ON" : "OFF"}</span>
          </button>

          {/* Pause / Resume Button */}
          <button
            onClick={() => setIsPaused(!isPaused)}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl border transition-all flex items-center space-x-2 ${
              isPaused
                ? "bg-amber-500/10 border-amber-500/40 text-amber-400"
                : "bg-slate-900 border-slate-800 text-slate-300 hover:text-slate-100"
            }`}
          >
            {isPaused ? <Play className="w-4 h-4 text-amber-400" /> : <Pause className="w-4 h-4 text-slate-400" />}
            <span>{isPaused ? "Resume Runtime" : "Pause Runtime"}</span>
          </button>

          {/* Run All Button */}
          <button
            onClick={() => executeEngineAction("all")}
            disabled={runningAction !== null || isPaused}
            className="px-4 py-2 bg-purple-500 hover:bg-purple-400 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-purple-500/20 transition-all flex items-center space-x-2"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>{runningAction === "all" ? "Orchestrating..." : "Run All"}</span>
          </button>

          {/* Refresh Button */}
          <button
            onClick={refreshTelemetry}
            className="p-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 rounded-xl"
            title="Refresh Telemetry"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── PROVIDER ORCHESTRATOR & TELEMETRY BANNER ── */}
      {stats?.providerManagerStatus && (
        <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-4 text-xs font-mono">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-purple-500/10 border border-purple-500/30 rounded-xl text-purple-400 font-bold uppercase text-sm">
                ACTIVE: {stats.providerManagerStatus.activeProvider}
              </div>
              <div>
                <span className="text-slate-200 font-bold text-sm block">
                  Fallback Provider: {stats.providerManagerStatus.fallbackProvider ? stats.providerManagerStatus.fallbackProvider.toUpperCase() : "NONE"}
                </span>
                <span className="text-[10px] text-slate-400">
                  Auto Failover: {stats.providerManagerStatus.autoFailover ? "ENABLED (Auto Retry on 429/Error)" : "DISABLED"}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs">
              <div className="space-y-0.5">
                <span className="text-[10px] text-slate-400 uppercase block">Requests Served</span>
                <span className="text-slate-100 font-bold">{stats.providerManagerStatus.totalRequests} reqs</span>
              </div>
              <div className="h-6 w-px bg-slate-800 hidden sm:block" />
              <div className="space-y-0.5">
                <span className="text-[10px] text-slate-400 uppercase block">Success Rate</span>
                <span className="text-emerald-400 font-bold">{stats.providerManagerStatus.overallSuccessRate}%</span>
              </div>
              <div className="h-6 w-px bg-slate-800 hidden sm:block" />
              <div className="space-y-0.5">
                <span className="text-[10px] text-slate-400 uppercase block">Est. Cost Today</span>
                <span className="text-emerald-400 font-bold">${stats.providerTelemetry?.estimatedCostUsd?.toFixed(4) || "0.0000"}</span>
              </div>
            </div>
          </div>

          {/* Provider Telemetry Statistics List */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-2 border-t border-slate-800/80">
            {stats.providerManagerStatus.providerStats.map((p) => (
              <div key={p.provider} className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200 text-[11px] uppercase">{p.provider}</span>
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                      p.health === "HEALTHY"
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                        : p.health === "DEGRADED"
                        ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                        : "bg-slate-800 text-slate-500 border-slate-700"
                    }`}
                  >
                    {p.health}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 space-y-0.5">
                  <div className="flex justify-between">
                    <span>Served:</span>
                    <span className="font-bold text-slate-200">{p.requestsServed}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Rate:</span>
                    <span className="font-bold text-emerald-400">{p.successRate}%</span>
                  </div>
                  {p.lastFailureReason && (
                    <div className="text-[9px] text-rose-400 truncate" title={p.lastFailureReason}>
                      Fail: {p.lastFailureReason}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TOOL ORCHESTRATOR LIVE TELEMETRY ── */}
      {stats?.toolTelemetry && (
        <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs font-mono">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-cyan-400 font-bold uppercase">
              TOOL ORCHESTRATOR
            </div>
            <div>
              <span className="text-slate-200 font-bold text-sm block">
                Executions: {stats.toolTelemetry.totalToolExecutions} | Active Calls: {stats.toolTelemetry.activeToolCalls}
              </span>
              <span className="text-[10px] text-slate-400">
                Automatic Retries: {stats.toolTelemetry.totalRetries} | Timeouts (15s): {stats.toolTelemetry.totalTimeouts}
              </span>
            </div>
          </div>

          {stats.toolTelemetry.liveToolLogs.length > 0 && (
            <div className="flex items-center space-x-2 text-[10px]">
              <span className="text-slate-400">Latest Tool:</span>
              <span className="font-bold text-cyan-300 font-mono">
                {stats.toolTelemetry.liveToolLogs[0].toolId} ({stats.toolTelemetry.liveToolLogs[0].executionTimeMs}ms)
              </span>
              <span
                className={`px-1.5 py-0.5 rounded font-bold ${
                  stats.toolTelemetry.liveToolLogs[0].status === "SUCCESS"
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                    : "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                }`}
              >
                {stats.toolTelemetry.liveToolLogs[0].status}
              </span>
            </div>
          )}
        </div>
      )}

      {/* ── KNOWLEDGE ENGINE LIVE TELEMETRY (PHASE 3.2) ── */}
      {stats?.knowledgeTelemetry && (
        <div className="p-4 bg-slate-950 border border-purple-500/30 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs font-mono">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-500/10 border border-purple-500/30 rounded-xl text-purple-400 font-bold uppercase">
              KNOWLEDGE ENGINE (3.2)
            </div>
            <div>
              <span className="text-slate-200 font-bold text-sm block">
                Hits: {stats.knowledgeTelemetry.knowledgeHits} | Misses: {stats.knowledgeTelemetry.knowledgeMisses} | Docs Used: {stats.knowledgeTelemetry.documentsUsed}
              </span>
              <span className="text-[10px] text-slate-400">
                Avg Retrieval Time: {stats.knowledgeTelemetry.avgRetrievalTimeMs}ms | Auto-Saved Knowledge: {stats.knowledgeTelemetry.knowledgeSaved}
              </span>
            </div>
          </div>
          <span className="text-[10px] font-mono font-bold px-2.5 py-1 bg-purple-500/20 text-purple-300 border border-purple-500/40 rounded-full">
            KNOWLEDGE-AWARE AGENTS ACTIVE
          </span>
        </div>
      )}

      {/* ── LIVE TELEMETRY STATS GRID ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
          <span className="text-[10px] font-mono font-bold uppercase text-slate-400 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-amber-400" /> Pending Tasks
          </span>
          <p className="text-xl font-bold text-slate-100 font-mono">{stats?.pendingTasks ?? 0}</p>
        </div>

        <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
          <span className="text-[10px] font-mono font-bold uppercase text-slate-400 flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-cyan-400 animate-pulse" /> Running Tasks
          </span>
          <p className="text-xl font-bold text-cyan-300 font-mono">{stats?.runningTasks ?? 0}</p>
        </div>

        <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
          <span className="text-[10px] font-mono font-bold uppercase text-slate-400 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Completed Tasks
          </span>
          <p className="text-xl font-bold text-emerald-400 font-mono">{stats?.completedTasks ?? 0}</p>
        </div>

        <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
          <span className="text-[10px] font-mono font-bold uppercase text-slate-400 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" /> Failed Tasks
          </span>
          <p className="text-xl font-bold text-rose-400 font-mono">{stats?.failedTasks ?? 0}</p>
        </div>

        <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
          <span className="text-[10px] font-mono font-bold uppercase text-slate-400 flex items-center gap-1">
            <Bot className="w-3.5 h-3.5 text-purple-400" /> Busy Agents
          </span>
          <p className="text-xl font-bold text-purple-400 font-mono">{stats?.busyAgents ?? 0}</p>
        </div>

        <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
          <span className="text-[10px] font-mono font-bold uppercase text-slate-400 flex items-center gap-1">
            <Bot className="w-3.5 h-3.5 text-slate-500" /> Idle Agents
          </span>
          <p className="text-xl font-bold text-slate-400 font-mono">{stats?.idleAgents ?? 0}</p>
        </div>
      </div>

      {/* ── ENGINE CARDS GRID (4 CARDS) ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats?.engines.map((eng) => {
          const isRunning = eng.status === "RUNNING" || runningAction === eng.key;
          const isError = eng.status === "ERROR";
          const isPausedEng = isPaused;

          return (
            <div
              key={eng.key}
              className={`p-5 bg-slate-950 border rounded-2xl space-y-4 transition-all ${
                isRunning
                  ? "border-purple-500/50 shadow-lg shadow-purple-500/10"
                  : isError
                  ? "border-rose-500/50"
                  : "border-slate-800"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-200 text-sm">{eng.name}</span>
                <span
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                    isRunning
                      ? "bg-purple-500/10 text-purple-400 border-purple-500/30 animate-pulse"
                      : isError
                      ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
                      : isPausedEng
                      ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                      : "bg-slate-900 text-slate-400 border-slate-800"
                  }`}
                >
                  {isRunning ? "RUNNING" : isError ? "ERROR" : isPausedEng ? "PAUSED" : "IDLE"}
                </span>
              </div>

              <div className="space-y-1.5 text-xs font-mono">
                <div className="flex justify-between text-slate-400">
                  <span>Processed:</span>
                  <span className="text-slate-200 font-bold">{eng.tasksProcessed}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Last Exec:</span>
                  <span className="text-slate-300">
                    {eng.lastExecutionTime
                      ? new Date(eng.lastExecutionTime).toLocaleTimeString()
                      : "Never"}
                  </span>
                </div>
                {eng.lastError && (
                  <p className="text-[10px] text-rose-400 bg-rose-500/10 p-2 rounded border border-rose-500/20 truncate">
                    {eng.lastError}
                  </p>
                )}
              </div>

              <button
                onClick={() => executeEngineAction(eng.key)}
                disabled={runningAction !== null || isPaused}
                className="w-full py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 disabled:opacity-50 text-slate-200 font-bold text-xs rounded-xl transition-all flex items-center justify-center space-x-2"
              >
                <Play className="w-3.5 h-3.5 text-purple-400" />
                <span>{runningAction === eng.key ? "Executing..." : `Run ${eng.key.toUpperCase()}`}</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* ── LIVE EXECUTION LOG PANEL ── */}
      <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <Terminal className="w-5 h-5 text-purple-400" />
            <span className="font-bold text-slate-100 text-sm">Live Execution Event Stream</span>
            <span className="text-xs text-slate-500 font-mono">({filteredLogs.length} events)</span>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Filter events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 font-mono focus:outline-none focus:border-purple-500/50"
            />
          </div>
        </div>

        {filteredLogs.length === 0 ? (
          <p className="text-xs text-slate-500 font-mono py-8 text-center">
            No execution events recorded yet. Trigger an engine or enable Auto Mode to stream events.
          </p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto pr-1 text-xs font-mono">
            {filteredLogs.map((ev) => {
              const isStart = ev.event_type.includes("STARTED");
              const isFinish = ev.event_type.includes("FINISHED") || ev.event_type.includes("COMPLETED");
              const isTool = ev.event_type.includes("TOOL");
              const isOutput = ev.event_type.includes("OUTPUT") || ev.event_type.includes("ARTIFACT");
              const isFail = ev.event_type.includes("FAILED") || ev.event_type.includes("ERROR");

              return (
                <div
                  key={ev.id}
                  className="p-3 bg-slate-900 border border-slate-800/80 rounded-xl flex items-start justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded border ${
                          isFail
                            ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
                            : isFinish
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                            : isTool
                            ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/30"
                            : isOutput
                            ? "bg-purple-500/10 text-purple-400 border-purple-500/30"
                            : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                        }`}
                      >
                        {ev.event_type}
                      </span>
                      {ev.task_id && (
                        <span className="text-[10px] text-slate-500">
                          Task #{ev.task_id.substring(0, 8)}
                        </span>
                      )}
                    </div>
                    <p className="text-slate-300 font-sans text-xs">{ev.message}</p>
                  </div>
                  <span className="text-[10px] text-slate-500 whitespace-nowrap">
                    {new Date(ev.created_at).toLocaleTimeString()}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
