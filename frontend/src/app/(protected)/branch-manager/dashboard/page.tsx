import { Suspense } from "react";
import DashboardClient from "./DashboardClient";

// Cache the orders data for 5 minutes (300 seconds)

export default async function BranchManagerDashboard() {
  return (
    <Suspense fallback={<div>Loading dashboard...</div>}>
      <DashboardClient />
    </Suspense>
  );
}

// Export dynamic rendering configuration - force dynamic to prevent cache bleeding between users
export const dynamic = "force-dynamic";
