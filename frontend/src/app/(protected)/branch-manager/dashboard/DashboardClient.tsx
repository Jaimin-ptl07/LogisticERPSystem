"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import {
  OrdersPageHeader,
  OrdersSummaryCards,
  OrdersSearchBar,
  OrdersList,
  type OrderStats,
} from "@/components/orders";
import type { Order } from "@/types";

// Lazy load modals (only when needed)
const OrderDetailsModal = dynamic(
  () =>
    import("@/components/Modal").then((mod) => ({
      default: mod.OrderDetailsModal,
    })),
  {
    loading: () => null,
    ssr: false, // Modals don't need SSR
  }
);

const CreateOrderModal = dynamic(
  () =>
    import("@/components/Modal").then((mod) => ({
      default: mod.CreateOrderModal,
    })),
  {
    loading: () => null,
    ssr: false, // Modals don't need SSR
  }
);

interface DashboardClientProps {
  initialOrders: Order[];
  initialOrderStats: OrderStats;
}

export default function DashboardClient({
  initialOrders,
  initialOrderStats,
}: DashboardClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Use server-provided data as initial state
  const [orders] = useState<Order[]>(initialOrders);
  const [orderStats] = useState<OrderStats>(initialOrderStats);

  // Filter orders based on search query
  const filteredOrders = useMemo(() => {
    if (!searchQuery) return orders;

    const query = searchQuery.toLowerCase();
    return orders.filter(
      (order) =>
        order.id.toLowerCase().includes(query) ||
        order.customer.toLowerCase().includes(query) ||
        order.status.toLowerCase().includes(query)
    );
  }, [searchQuery, orders]);

  // Modal handlers
  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order);
    setIsDetailsModalOpen(true);
  };

  const handleCloseDetailsModal = () => {
    setIsDetailsModalOpen(false);
    setSelectedOrder(null);
  };

  const handleCreateOrder = () => {
    setIsCreateModalOpen(true);
  };

  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
  };

  const handleCreateOrderSubmit = (data: any) => {
    console.log("Creating order:", data);
    // TODO: Add order creation logic
    // After creating, you might want to revalidate the cache
    fetch('/api/revalidate?tag=orders', { method: 'POST' });
    setIsCreateModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <OrdersPageHeader onCreateOrder={handleCreateOrder} />

      <OrdersSummaryCards stats={orderStats} />

      <OrdersSearchBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <OrdersList
        orders={filteredOrders}
        onViewDetails={handleViewDetails}
        onCreateOrder={handleCreateOrder}
      />

      <OrderDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={handleCloseDetailsModal}
        order={selectedOrder}
      />

      <CreateOrderModal
        isOpen={isCreateModalOpen}
        onClose={handleCloseCreateModal}
        onCreateOrder={handleCreateOrderSubmit}
      />
    </div>
  );
}