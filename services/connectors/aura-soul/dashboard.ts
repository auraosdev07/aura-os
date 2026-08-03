"use server";

/**
 * services/connectors/aura-soul/dashboard.ts
 *
 * READ-ONLY Dashboard Analytics Connector for external Aura & Soul database.
 * Executes parallel, fault-tolerant queries to compile live business KPIs and 7-day sales trends.
 * No data is modified.
 */

import { getAuraSoulExternalClient } from "./connection";
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  MetricCardData,
  ChartDayPoint,
  AuraSoulDashboardData,
} from "@/types/dashboard";

const defaultMetric = (status: "success" | "error" | "unavailable" = "unavailable", error?: string): MetricCardData => ({
  value: 0,
  status,
  error,
});

/**
 * Generates array of formatted date objects for the last 7 calendar days up to today.
 */
function getLast7Days(): { rawDate: string; label: string }[] {
  const days: { rawDate: string; label: string }[] = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const rawDate = d.toISOString().split("T")[0];
    const label = d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
    days.push({ rawDate, label });
  }
  return days;
}

/**
 * Fetches live dashboard analytics from Aura & Soul external Supabase database.
 * Every metric query is executed independently using Promise.allSettled.
 */
export async function getAuraSoulDashboardAnalytics(
  clientOverride?: SupabaseClient,
  userIdOverride?: string
): Promise<AuraSoulDashboardData> {
  const fetchedAt = new Date().toISOString();

  let client: SupabaseClient;
  try {
    const res = await getAuraSoulExternalClient(clientOverride, userIdOverride);
    client = res.client;
  } catch (err: unknown) {
    const errMsg = (err as Error).message || "Aura & Soul connection is not configured.";
    return {
      isConnected: false,
      connectionError: errMsg,
      totalProducts: defaultMetric("error", errMsg),
      activeProducts: defaultMetric("error", errMsg),
      featuredProducts: defaultMetric("error", errMsg),
      lowStockProducts: defaultMetric("error", errMsg),
      outOfStockProducts: defaultMetric("error", errMsg),
      totalCategories: defaultMetric("error", errMsg),
      totalOrders: defaultMetric("error", errMsg),
      pendingConsultations: defaultMetric("error", errMsg),
      chartData: [],
      hasChartData: false,
      fetchedAt,
    };
  }

  // Define independent parallel tasks
  const productTask = (async () => {
    const { data: products, error } = await client
      .from("products")
      .select("id, status, stock_quantity, low_stock_threshold, is_featured, featured");

    if (error) throw new Error(error.message);

    const total = products.length;
    const active = products.filter((p) => (p.status || "").toUpperCase() === "ACTIVE").length;
    const featured = products.filter((p) => p.is_featured === true || p.featured === true).length;
    const lowStock = products.filter((p) => {
      const qty = p.stock_quantity ?? 0;
      const threshold = p.low_stock_threshold ?? 5;
      return qty > 0 && qty <= threshold;
    }).length;
    const outOfStock = products.filter((p) => (p.stock_quantity ?? 0) <= 0).length;

    return { total, active, featured, lowStock, outOfStock };
  })();

  const categoryTask = (async () => {
    const { count, error } = await client
      .from("categories")
      .select("id", { count: "exact", head: true });

    if (error) throw new Error(error.message);
    return count ?? 0;
  })();

  const orderTask = (async () => {
    // Attempt to query orders table
    const { data: orders, error } = await client
      .from("orders")
      .select("id, created_at, total_amount, total, amount, grand_total, status");

    if (error) throw new Error(error.message);

    const days = getLast7Days();
    const dayMap: Record<string, { orders: number; revenue: number }> = {};
    days.forEach((d) => {
      dayMap[d.rawDate] = { orders: 0, revenue: 0 };
    });

    let totalRecentOrders = 0;
    (orders || []).forEach((ord) => {
      if (!ord.created_at) return;
      const orderDate = new Date(ord.created_at).toISOString().split("T")[0];
      if (dayMap[orderDate]) {
        dayMap[orderDate].orders += 1;
        const rev = Number(ord.total_amount ?? ord.total ?? ord.amount ?? ord.grand_total ?? 0);
        dayMap[orderDate].revenue += isNaN(rev) ? 0 : rev;
        totalRecentOrders += 1;
      }
    });

    const chartPoints: ChartDayPoint[] = days.map((d) => ({
      date: d.label,
      rawDate: d.rawDate,
      orders: dayMap[d.rawDate].orders,
      revenue: Math.round(dayMap[d.rawDate].revenue * 100) / 100,
    }));

    return {
      totalOrders: orders ? orders.length : 0,
      chartData: chartPoints,
      hasChartData: totalRecentOrders > 0 || (orders && orders.length > 0),
    };
  })();

  const consultationTask = (async () => {
    // Try multiple possible consultation / lead table names
    const candidateTables = ["consultation_requests", "consultations", "leads", "contact_messages", "queries"];

    for (const tableName of candidateTables) {
      try {
        const { data, error } = await client.from(tableName).select("id, status");
        if (!error && data) {
          const pendingCount = data.filter((row) => {
            const st = (row.status || "").toString().toLowerCase();
            return st === "pending" || st === "new" || st === "unread" || st === "open";
          }).length;
          return pendingCount;
        }
      } catch {
        // try next candidate table
      }
    }
    return null; // Table not present in schema
  })();

  // Execute all 4 tasks concurrently using Promise.allSettled
  const [productRes, categoryRes, orderRes, consultationRes] = await Promise.allSettled([
    productTask,
    categoryTask,
    orderTask,
    consultationTask,
  ]);

  // Process Product Metrics
  let totalProducts = defaultMetric();
  let activeProducts = defaultMetric();
  let featuredProducts = defaultMetric();
  let lowStockProducts = defaultMetric();
  let outOfStockProducts = defaultMetric();

  if (productRes.status === "fulfilled") {
    totalProducts = { value: productRes.value.total, status: "success" };
    activeProducts = { value: productRes.value.active, status: "success" };
    featuredProducts = { value: productRes.value.featured, status: "success" };
    lowStockProducts = { value: productRes.value.lowStock, status: "success" };
    outOfStockProducts = { value: productRes.value.outOfStock, status: "success" };
  } else {
    const errText = productRes.reason?.message || "Failed to query products table";
    totalProducts = defaultMetric("error", errText);
    activeProducts = defaultMetric("error", errText);
    featuredProducts = defaultMetric("error", errText);
    lowStockProducts = defaultMetric("error", errText);
    outOfStockProducts = defaultMetric("error", errText);
  }

  // Process Category Metric
  let totalCategories = defaultMetric();
  if (categoryRes.status === "fulfilled") {
    totalCategories = { value: categoryRes.value, status: "success" };
  } else {
    totalCategories = defaultMetric("error", categoryRes.reason?.message || "Failed to query categories");
  }

  // Process Orders & Chart Metrics
  let totalOrders = defaultMetric("unavailable");
  let chartData: ChartDayPoint[] = [];
  let hasChartData = false;

  if (orderRes.status === "fulfilled") {
    totalOrders = { value: orderRes.value.totalOrders, status: "success" };
    chartData = orderRes.value.chartData;
    hasChartData = orderRes.value.hasChartData;
  } else {
    // If orders table does not exist or failed to query
    totalOrders = defaultMetric("unavailable", "Orders table not present in Aura & Soul DB");
  }

  // Process Consultations Metric
  let pendingConsultations = defaultMetric("unavailable");
  if (consultationRes.status === "fulfilled" && consultationRes.value !== null) {
    pendingConsultations = { value: consultationRes.value, status: "success" };
  } else {
    pendingConsultations = defaultMetric("unavailable", "No consultation requests table found");
  }

  return {
    isConnected: true,
    totalProducts,
    activeProducts,
    featuredProducts,
    lowStockProducts,
    outOfStockProducts,
    totalCategories,
    totalOrders,
    pendingConsultations,
    chartData,
    hasChartData,
    fetchedAt,
  };
}
