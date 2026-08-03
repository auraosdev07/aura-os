"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Sparkles, Key, Globe, Eye, EyeOff, Save, Activity, CheckCircle2, AlertCircle, RefreshCw, Database } from "lucide-react";
import {
  saveAuraSoulIntegrationService,
  testAuraSoulConnectionService,
} from "@/services/integration";
import type { IntegrationRow } from "@/types/integrations";

interface AuraSoulDetailProps {
  initialIntegration: IntegrationRow | null;
}

export function AuraSoulDetail({ initialIntegration }: AuraSoulDetailProps) {
  const initialConfig = initialIntegration?.config || {};

  const [supabaseUrl, setSupabaseUrl] = useState<string>((initialConfig.supabase_url as string) || "");
  const [supabaseProjectId, setSupabaseProjectId] = useState<string>((initialConfig.supabase_project_id as string) || "");
  const [serviceRoleKey, setServiceRoleKey] = useState<string>((initialConfig.service_role_key as string) || "");
  const [showKey, setShowKey] = useState(false);

  const [status, setStatus] = useState<string>(initialIntegration?.status || "NOT_CONFIGURED");
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setTestResult(null);
    try {
      const updated = await saveAuraSoulIntegrationService({
        supabase_url: supabaseUrl,
        supabase_project_id: supabaseProjectId,
        service_role_key: serviceRoleKey,
      });
      setStatus(updated.status);
      setTestResult({
        success: true,
        message: "Integration parameters saved successfully.",
      });
    } catch (err: unknown) {
      setTestResult({
        success: false,
        message: (err as Error).message || "Failed to save configuration.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await testAuraSoulConnectionService({
        supabase_url: supabaseUrl,
        supabase_project_id: supabaseProjectId,
        service_role_key: serviceRoleKey,
      });
      setTestResult(res);
    } catch (err: unknown) {
      setTestResult({
        success: false,
        message: (err as Error).message || "Connection test failed.",
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Navigation Breadcrumb */}
      <div>
        <Link
          href="/integrations"
          className="inline-flex items-center space-x-1.5 text-xs text-slate-400 hover:text-emerald-400 font-semibold mb-2 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Integrations</span>
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
              <Sparkles className="w-7 h-7 text-emerald-400" /> Aura & Soul Integration
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Configure parameters for the external live website (auraandsoul.in) integration framework.
            </p>
          </div>

          {/* Connection Status Badge, Explorer & DB Explorer Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/integrations/aura-soul/explorer"
              className="text-xs px-3.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-bold rounded-xl border border-emerald-500/30 transition-colors flex items-center space-x-1.5"
            >
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span>Live Data</span>
            </Link>

            <Link
              href="/integrations/aura-soul/database"
              className="text-xs px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl border border-slate-700 transition-colors flex items-center space-x-1.5"
            >
              <Database className="w-3.5 h-3.5 text-slate-400" />
              <span>Database Explorer</span>
            </Link>

            {status === "CONNECTED" ? (
              <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                <CheckCircle2 className="w-4 h-4" />
                <span>Status: Connected</span>
              </span>
            ) : (
              <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                <AlertCircle className="w-4 h-4" />
                <span>Status: Not Configured</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Configuration Form Card */}
      <form onSubmit={handleSave} className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-3">
          <Key className="w-4 h-4 text-emerald-400" /> Supabase Connection Credentials
        </h2>

        <div className="space-y-4">
          {/* Supabase Project URL */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-slate-500" /> Supabase Project URL
            </label>
            <input
              type="url"
              required
              placeholder="https://your-project.supabase.co"
              value={supabaseUrl}
              onChange={(e) => setSupabaseUrl(e.target.value)}
              className="w-full text-xs px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          {/* Supabase Project ID */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-slate-500" /> Supabase Project ID
            </label>
            <input
              type="text"
              required
              placeholder="e.g. ymofhdwh5o3q"
              value={supabaseProjectId}
              onChange={(e) => setSupabaseProjectId(e.target.value)}
              className="w-full text-xs px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 font-mono"
            />
          </div>

          {/* Service Role Key */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-slate-500" /> Service Role Key (Masked)
            </label>
            <div className="relative">
              <input
                type={showKey ? "text" : "password"}
                required
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={serviceRoleKey}
                onChange={(e) => setServiceRoleKey(e.target.value)}
                className="w-full text-xs pl-3.5 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Feedback Alert */}
        {testResult && (
          <div
            className={`p-4 rounded-xl border text-xs ${
              testResult.success
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                : "bg-rose-500/10 border-rose-500/30 text-rose-300"
            }`}
          >
            <p className="font-semibold">{testResult.message}</p>
          </div>
        )}

        {/* Form Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={testing || saving}
            className="w-full sm:w-auto text-xs px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl border border-slate-700 transition-colors flex items-center justify-center space-x-2"
          >
            <RefreshCw className={`w-4 h-4 ${testing ? "animate-spin" : ""}`} />
            <span>Test Connection</span>
          </button>

          <button
            type="submit"
            disabled={saving || testing}
            className="w-full sm:w-auto text-xs px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? "Saving..." : "Connect"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
