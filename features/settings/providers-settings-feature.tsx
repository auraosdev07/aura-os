"use client";

/**
 * features/settings/providers-settings-feature.tsx
 *
 * Fully Registry-Driven AI Provider Management UI
 * Renders provider cards dynamically from EnrichedProviderCard[].
 * Supports HTML5 Drag-and-Drop priority reordering, real API connection tests,
 * capability badges, cost breakdown, and toggle controls.
 * Adding a new provider in ProviderMetadataRegistry makes it appear here automatically with ZERO UI changes.
 */

import { useState, useEffect, useCallback } from "react";
import {
  Sparkles,
  Key,
  RefreshCw,
  ShieldCheck,
  Zap,
  GripVertical,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Eye,
  MessageSquare,
  Wrench,
  DollarSign,
  Activity,
  Cpu,
  Layers,
} from "lucide-react";
import type { EnrichedProviderCard, SystemAiConfigRow } from "@/types/provider";

export function ProvidersSettingsFeature() {
  const [cards, setCards] = useState<EnrichedProviderCard[]>([]);
  const [config, setConfig] = useState<SystemAiConfigRow | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const [testResults, setTestResults] = useState<Record<string, { loading: boolean; message: string | null }>>({});
  const [editingModel, setEditingModel] = useState<Record<string, string>>({});
  const [editingApiKey, setEditingApiKey] = useState<Record<string, string>>({});
  const [savingState, setSavingState] = useState<Record<string, boolean>>({});

  // Drag and drop state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const loadData = useCallback(async () => {
    try {
      const res = await fetch("/api/providers/settings", { cache: "no-store" });
      const data = await res.json();
      if (data.success) {
        setCards(data.enrichedCards || []);
        setConfig(data.config || null);

        const initialModels: Record<string, string> = {};
        for (const card of data.enrichedCards || []) {
          initialModels[card.metadata.providerId] = card.effectiveModel;
        }
        setEditingModel(initialModels);
      }
    } catch (err) {
      console.error("[LOAD PROVIDERS ERROR]:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    fetch("/api/providers/settings", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (active && data.success) {
          setCards(data.enrichedCards || []);
          setConfig(data.config || null);

          const initialModels: Record<string, string> = {};
          for (const card of data.enrichedCards || []) {
            initialModels[card.metadata.providerId] = card.effectiveModel;
          }
          setEditingModel(initialModels);
        }
      })
      .catch((err) => {
        console.error("[LOAD PROVIDERS ERROR]:", err);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const handleSetDefault = async (providerId: string) => {
    try {
      const res = await fetch("/api/providers/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "setDefault", provider: providerId }),
      });
      const data = await res.json();
      if (data.success) {
        setCards(data.enrichedCards || []);
        setConfig(data.config || null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleFallback = async (enable: boolean) => {
    try {
      const res = await fetch("/api/providers/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggleFallback", enable }),
      });
      const data = await res.json();
      if (data.success) {
        setConfig(data.config || null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleEnabled = async (providerId: string, isEnabled: boolean) => {
    try {
      const res = await fetch("/api/providers/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggleEnabled", provider: providerId, isEnabled }),
      });
      const data = await res.json();
      if (data.success) {
        setCards(data.enrichedCards || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveModelKey = async (providerId: string) => {
    setSavingState((prev) => ({ ...prev, [providerId]: true }));
    try {
      const model = editingModel[providerId];
      const apiKey = editingApiKey[providerId];

      const res = await fetch("/api/providers/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "updateModel", provider: providerId, model, apiKey }),
      });
      const data = await res.json();
      if (data.success) {
        setCards(data.enrichedCards || []);
        setEditingApiKey((prev) => ({ ...prev, [providerId]: "" }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingState((prev) => ({ ...prev, [providerId]: false }));
    }
  };

  const handleTestConnection = async (providerId: string) => {
    setTestResults((prev) => ({ ...prev, [providerId]: { loading: true, message: null } }));
    try {
      const res = await fetch("/api/providers/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: providerId }),
      });
      const data = await res.json();
      setTestResults((prev) => ({
        ...prev,
        [providerId]: { loading: false, message: data.message },
      }));

      // Reload cards to show updated status & latency
      await loadData();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Connection error";
      setTestResults((prev) => ({
        ...prev,
        [providerId]: { loading: false, message: `✗ Authentication Failed: ${errorMsg}` },
      }));
    }
  };

  // Drag and Drop reordering handlers
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newCards = [...cards];
    const draggedItem = newCards[draggedIndex];
    newCards.splice(draggedIndex, 1);
    newCards.splice(index, 0, draggedItem);

    setDraggedIndex(index);
    setCards(newCards);
  };

  const handleDragEnd = async () => {
    setDraggedIndex(null);
    const orderedIds = cards.map((c) => c.metadata.providerId);
    try {
      const res = await fetch("/api/providers/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reorderPriority", orderedProviderIds: orderedIds }),
      });
      const data = await res.json();
      if (data.success) {
        setCards(data.enrichedCards || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-400 font-mono text-xs animate-pulse flex flex-col items-center justify-center space-y-3">
        <RefreshCw className="w-6 h-6 animate-spin text-purple-400" />
        <span>Loading Dynamic Registry-Driven AI Provider Architecture...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── HEADER & CONTROLS ── */}
      <div className="p-6 bg-slate-950 border border-slate-800 rounded-2xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" /> Dynamic AI Provider Orchestrator
            </h1>
            <p className="text-xs text-slate-400">
              Registry-driven AI execution. Drag cards to adjust priority order. Configured providers failover automatically.
            </p>
          </div>

          {/* Controls Bar */}
          <div className="flex flex-wrap items-center gap-3 bg-slate-900 border border-slate-800 p-3 rounded-xl">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-slate-300">Active Default:</span>
              <span className="text-xs font-mono font-bold px-2 py-0.5 bg-purple-500/20 text-purple-300 border border-purple-500/40 rounded-md uppercase">
                {config?.default_provider || "gemini"}
              </span>
            </div>

            <div className="h-4 w-px bg-slate-800 hidden sm:block" />

            <label className="flex items-center space-x-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={config?.enable_fallback ?? true}
                onChange={(e) => handleToggleFallback(e.target.checked)}
                className="w-4 h-4 rounded accent-purple-500"
              />
              <span className="text-xs text-slate-200 font-bold">Auto Failover Engine</span>
            </label>

            <div className="h-4 w-px bg-slate-800 hidden sm:block" />

            <span className="text-[10px] font-mono text-slate-400">
              Total Registered: <strong className="text-slate-200">{cards.length}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* ── DYNAMIC REGISTRY PROVIDER CARDS GRID ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {cards.map((card, index) => {
          const { metadata, isConfigured, isDefault, isEnabled, status, runtimeStats } = card;
          const pid = metadata.providerId;
          const testState = testResults[pid];

          return (
            <div
              key={pid}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`p-5 bg-slate-950 border rounded-2xl space-y-4 transition-all flex flex-col justify-between cursor-grab active:cursor-grabbing ${
                draggedIndex === index ? "opacity-50 border-dashed border-purple-500" : ""
              } ${
                isDefault
                  ? "border-purple-500/50 shadow-lg shadow-purple-500/10"
                  : isConfigured && isEnabled
                  ? "border-slate-800 hover:border-slate-700"
                  : "border-slate-900 opacity-80"
              }`}
            >
              <div className="space-y-4">
                {/* Drag Handle & Provider Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <GripVertical className="w-4 h-4 text-slate-600 hover:text-slate-400 shrink-0" />
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-100 text-base">{metadata.displayName}</span>
                        <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded">
                          #{index + 1}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 uppercase block">
                        ID: {metadata.providerId}
                      </span>
                    </div>
                  </div>

                  {/* Status Badges */}
                  <div className="flex flex-col items-end space-y-1">
                    <div className="flex items-center space-x-1">
                      {isDefault && (
                        <span className="text-[9px] font-mono font-bold px-2 py-0.5 bg-purple-500/20 text-purple-300 border border-purple-500/40 rounded-full">
                          DEFAULT
                        </span>
                      )}
                      <span
                        className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border flex items-center space-x-1 ${
                          status === "CONNECTED"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                            : status === "ERROR"
                            ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
                            : "bg-slate-900 text-slate-500 border-slate-800"
                        }`}
                      >
                        {status === "CONNECTED" ? (
                          <CheckCircle2 className="w-3 h-3 text-emerald-400 inline" />
                        ) : status === "ERROR" ? (
                          <XCircle className="w-3 h-3 text-rose-400 inline" />
                        ) : (
                          <AlertTriangle className="w-3 h-3 text-slate-500 inline" />
                        )}
                        <span>{status}</span>
                      </span>
                    </div>

                    <span
                      className={`text-[9px] font-mono ${
                        isConfigured ? "text-emerald-400 font-bold" : "text-amber-400"
                      }`}
                    >
                      {isConfigured ? "✔ Configured" : "Missing API Key"}
                    </span>
                  </div>
                </div>

                {/* Capability Badges */}
                <div className="flex flex-wrap gap-1 pt-1">
                  {metadata.capabilities.chat && (
                    <span className="text-[9px] font-mono px-1.5 py-0.5 bg-slate-900 text-slate-300 border border-slate-800 rounded flex items-center gap-1">
                      <MessageSquare className="w-2.5 h-2.5 text-blue-400" /> Chat
                    </span>
                  )}
                  {metadata.capabilities.vision && (
                    <span className="text-[9px] font-mono px-1.5 py-0.5 bg-slate-900 text-slate-300 border border-slate-800 rounded flex items-center gap-1">
                      <Eye className="w-2.5 h-2.5 text-purple-400" /> Vision
                    </span>
                  )}
                  {metadata.capabilities.functionCalling && (
                    <span className="text-[9px] font-mono px-1.5 py-0.5 bg-slate-900 text-slate-300 border border-slate-800 rounded flex items-center gap-1">
                      <Wrench className="w-2.5 h-2.5 text-cyan-400" /> Tools
                    </span>
                  )}
                  {metadata.capabilities.imageGeneration && (
                    <span className="text-[9px] font-mono px-1.5 py-0.5 bg-slate-900 text-slate-300 border border-slate-800 rounded flex items-center gap-1">
                      <Layers className="w-2.5 h-2.5 text-pink-400" /> ImageGen
                    </span>
                  )}
                  {metadata.capabilities.reasoning && (
                    <span className="text-[9px] font-mono px-1.5 py-0.5 bg-slate-900 text-slate-300 border border-slate-800 rounded flex items-center gap-1">
                      <Cpu className="w-2.5 h-2.5 text-emerald-400" /> Reason
                    </span>
                  )}
                </div>

                {/* Settings Form */}
                <div className="space-y-3 text-xs pt-1">
                  {/* Model Selector / Input */}
                  <div>
                    <label className="text-[10px] font-mono font-bold text-slate-400 uppercase block mb-1">
                      Model Selection
                    </label>
                    {metadata.supportedModels && metadata.supportedModels.length > 0 ? (
                      <select
                        value={editingModel[pid] || card.effectiveModel}
                        onChange={(e) =>
                          setEditingModel((prev) => ({ ...prev, [pid]: e.target.value }))
                        }
                        className="w-full p-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 font-mono focus:outline-none focus:border-purple-500/50 text-xs"
                      >
                        {metadata.supportedModels.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.label} ({m.id})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={editingModel[pid] || card.effectiveModel}
                        onChange={(e) =>
                          setEditingModel((prev) => ({ ...prev, [pid]: e.target.value }))
                        }
                        className="w-full p-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 font-mono focus:outline-none focus:border-purple-500/50"
                      />
                    )}
                  </div>

                  {/* API Key Override */}
                  <div>
                    <label className="text-[10px] font-mono font-bold text-slate-400 uppercase block mb-1">
                      API Key ({metadata.envVariableNames.join(", ")})
                    </label>
                    <div className="relative">
                      <Key className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                      <input
                        type="password"
                        placeholder={card.effectiveApiKeyMasked || "Enter key to override..."}
                        value={editingApiKey[pid] || ""}
                        onChange={(e) =>
                          setEditingApiKey((prev) => ({ ...prev, [pid]: e.target.value }))
                        }
                        className="w-full pl-8 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 font-mono focus:outline-none focus:border-purple-500/50 text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* Telemetry & Health Block */}
                <div className="p-2.5 bg-slate-900/80 border border-slate-800/80 rounded-xl space-y-1.5 text-[11px] font-mono">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="flex items-center gap-1"><Activity className="w-3 h-3 text-cyan-400" /> Served / Success Rate</span>
                    <span className="font-bold text-slate-200">
                      {runtimeStats.requestsServed} reqs ({runtimeStats.successRate}%)
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-amber-400" /> Avg Latency / Health</span>
                    <span className="font-bold text-slate-200">
                      {runtimeStats.avgLatencyMs > 0 ? `${runtimeStats.avgLatencyMs}ms` : "N/A"} ({runtimeStats.healthScore}/100)
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="flex items-center gap-1"><DollarSign className="w-3 h-3 text-emerald-400" /> Cost Tier</span>
                    <span className="font-bold text-emerald-400">
                      {metadata.pricing.freeTier ? "FREE TIER AVAILABLE" : `$${metadata.pricing.estimatedInputCostPerMillion}/1M in`}
                    </span>
                  </div>
                </div>

                {/* Save Model/Key Button */}
                <button
                  onClick={() => handleSaveModelKey(pid)}
                  disabled={savingState[pid]}
                  className="w-full py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-lg text-xs font-bold transition-colors"
                >
                  {savingState[pid] ? "Saving..." : "Save Configuration"}
                </button>

                {/* Test Result Message Box */}
                {testState?.message && (
                  <div
                    className={`p-3 rounded-xl border text-xs font-mono leading-relaxed ${
                      testState.message.includes("✓")
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                        : "bg-rose-500/10 border-rose-500/30 text-rose-300"
                    }`}
                  >
                    {testState.message}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleTestConnection(pid)}
                    disabled={testState?.loading}
                    className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2"
                  >
                    {testState?.loading ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-purple-400" />
                    ) : (
                      <Zap className="w-3.5 h-3.5 text-cyan-400" />
                    )}
                    <span>{testState?.loading ? "Testing..." : "Test Connection"}</span>
                  </button>

                  {/* Enable/Disable Toggle */}
                  <button
                    onClick={() => handleToggleEnabled(pid, !isEnabled)}
                    className={`px-3 py-2 border rounded-xl text-xs font-bold font-mono transition-colors ${
                      isEnabled
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                        : "bg-slate-900 border-slate-800 text-slate-500"
                    }`}
                  >
                    {isEnabled ? "ENABLED" : "DISABLED"}
                  </button>
                </div>

                {!isDefault && (
                  <button
                    onClick={() => handleSetDefault(pid)}
                    className="w-full py-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-xl text-xs font-bold transition-all"
                  >
                    Set as Default Provider
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
