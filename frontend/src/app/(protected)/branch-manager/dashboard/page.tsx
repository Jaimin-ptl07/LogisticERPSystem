import { Suspense } from "react";
import { unstable_cache } from "next/cache";
import type { Order } from "@/types";
import type { OrderStats } from "@/components/orders";
import { mockOrders } from "@/data/mockData";
import DashboardClient from "./DashboardClient";

// Cache the orders data for 5 minutes (300 seconds)
const getCachedOrders = unstable_cache(
  async () => {
    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 100));
    return mockOrders;
  },
  ["branch-manager-orders"],
  {
    tags: ["orders"],
  }
);

// Cache the order statistics
const getCachedOrderStats = unstable_cache(
  async (orders: Order[]) => {
    const stats: OrderStats = {
      total: orders.length,
      pending: orders.filter((o) => o.status === "pending").length,
      loading: orders.filter((o) => o.status === "loading").length,
      onRoute: orders.filter((o) => o.status === "on-route").length,
      completed: orders.filter((o) => o.status === "completed").length,
    };
    return stats;
  },
  ["branch-manager-order-stats"],
  {
    tags: ["order-stats"],
  }
);

export default async function BranchManagerDashboard() {
  // Fetch data server-side with caching
  const orders = await getCachedOrders();
  const orderStats = await getCachedOrderStats(orders);

  return (
    <Suspense fallback={<div>Loading dashboard...</div>}>
      <DashboardClient initialOrders={orders} initialOrderStats={orderStats} />
    </Suspense>
  );
}

// Export revalidate for ISR (Incremental Static Regeneration)
export const revalidate = 300; // Revalidate every 5 minutes

// Export dynamic rendering configuration
export const dynamic = "force-static";
