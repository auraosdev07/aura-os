"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Package,
  CheckCircle2,
  Sparkles,
  AlertTriangle,
  AlertOctagon,
  Layers,
  ShoppingBag,
  Users,
  AlertCircle,
} from "lucide-react";
import { DashboardHeader } from "./dashboard-header";
import { DashboardKpiCard } from "./dashboard-kpi-card";
import { DashboardSalesChart } from "./dashboard-sales-chart";
import { fetchLiveDashboardService } from "@/services/dashboard";
import type { AuraSoulDashboardData } from "@/types/dashboard";

interface DashboardFeatureProps {
  initialData: AuraSoulDashboardData;
}

export function DashboardFeature({ initialData }: DashboardFeatureProps) {
  const [data, setData] = useState<AuraSoulDashboardData>(initialData);
  const [loading, setLoading] = useState(false);

  const refreshData = useCallback(async () => {
    setLoading(true);
    try {
      const freshData = await fetchLiveDashboardService();
      setData(freshData);
    } catch (err: unknown) {
      console.error("[DASHBOARD REFRESH ERROR]:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // 30-second auto-revalidation interval for live telemetry
  useEffect(() => {
    const interval = setInterval(() => {
      refreshData();
    }, 30000);
    return () => clearInterval(interval);
  }, [refreshData]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <DashboardHeader
        isConnected={data.isConnected}
        fetchedAt={data.fetchedAt}
        loading={loading}
        onRefresh={refreshData}
      />

      {/* Connection Failure Banner */}
      {!data.isConnected && data.connectionError && (
        <div className="p-6 border border-amber-500/30 rounded-2xl bg-amber-500/5 space-y-3">
          <div className="flex items-center space-x-2 text-amber-400">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <h3 className="text-sm font-bold">Aura & Soul Supabase Database Not Connected</h3>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
            {data.connectionError}
          </p>
          <Link
            href="/integrations/aura-soul"
            className="inline-flex items-center text-xs px-4 py-2 bg-slate-900 hover:bg-slate-800 text-amber-300 font-bold rounded-xl border border-amber-500/30 transition-colors"
          >
            Configure Credentials at /integrations/aura-soul →
          </Link>
        </div>
      )}

      {/* 8 Live Business KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Total Products */}
        <DashboardKpiCard
          title="Total Products"
          metric={data.totalProducts}
          icon={<Package className="w-5 h-5" />}
          color="emerald"
          subtitle="Catalog total count"
          loading={loading}
        />

        {/* 2. Active Products */}
        <DashboardKpiCard
          title="Active Products"
          metric={data.activeProducts}
          icon={<CheckCircle2 className="w-5 h-5" />}
          color="green"
          subtitle="Live on storefront"
          loading={loading}
        />

        {/* 3. Featured Products */}
        <DashboardKpiCard
          title="Featured Products"
          metric={data.featuredProducts}
          icon={<Sparkles className="w-5 h-5" />}
          color="amber"
          subtitle="Promoted catalog items"
          loading={loading}
        />

        {/* 4. Low Stock Products */}
        <DashboardKpiCard
          title="Low Stock Products"
          metric={data.lowStockProducts}
          icon={<AlertTriangle className="w-5 h-5" />}
          color="yellow"
          subtitle="Stock ≤ threshold"
          loading={loading}
        />

        {/* 5. Out of Stock Products */}
        <DashboardKpiCard
          title="Out of Stock"
          metric={data.outOfStockProducts}
          icon={<AlertOctagon className="w-5 h-5" />}
          color="rose"
          subtitle="Stock quantity = 0"
          loading={loading}
        />

        {/* 6. Total Categories */}
        <DashboardKpiCard
          title="Total Categories"
          metric={data.totalCategories}
          icon={<Layers className="w-5 h-5" />}
          color="blue"
          subtitle="Product taxonomies"
          loading={loading}
        />

        {/* 7. Total Orders */}
        <DashboardKpiCard
          title="Total Orders"
          metric={data.totalOrders}
          icon={<ShoppingBag className="w-5 h-5" />}
          color="purple"
          subtitle="All-time recorded orders"
          loading={loading}
        />

        {/* 8. Pending Consultations */}
        <DashboardKpiCard
          title="Pending Consultations"
          metric={data.pendingConsultations}
          icon={<Users className="w-5 h-5" />}
          color="cyan"
          subtitle="Unprocessed leads/requests"
          loading={loading}
        />
      </div>

      {/* 7-Day Performance Chart */}
      <DashboardSalesChart data={data.chartData} hasData={data.hasChartData} />
    </div>
  );
}
