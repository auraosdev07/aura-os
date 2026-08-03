/**
 * types/dashboard.ts
 *
 * Type definitions for Aura & Soul live business dashboard telemetry.
 * Keeping types in a dedicated file prevents Next.js Turbopack Server Action
 * bundler errors caused by type re-exports from "use server" modules.
 */

export interface MetricCardData {
  value: number;
  status: "success" | "error" | "unavailable";
  error?: string;
}

export interface ChartDayPoint {
  date: string;
  rawDate: string;
  orders: number;
  revenue: number;
}

export interface AuraSoulDashboardData {
  isConnected: boolean;
  connectionError?: string;
  totalProducts: MetricCardData;
  activeProducts: MetricCardData;
  featuredProducts: MetricCardData;
  lowStockProducts: MetricCardData;
  outOfStockProducts: MetricCardData;
  totalCategories: MetricCardData;
  totalOrders: MetricCardData;
  pendingConsultations: MetricCardData;
  chartData: ChartDayPoint[];
  hasChartData: boolean;
  fetchedAt: string;
}
