"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { CreateOrderModal } from "@/components/Modal";
import {
  useGetOrdersQuery,
  useSubmitOrderMutation,
  Order,
} from "@/services/api/ordersApi";
import {
  Plus,
  Search,
  Package,
  Send,
  User,
  MapPin,
  Phone,
  Calendar,
  Weight,
  DollarSign,
  Clock,
  TrendingUp,
  Box,
  Building2,
  Hash,
  FileText
} from "lucide-react";
import { useState } from "react";
import { toast } from "react-hot-toast";

export default function Orders() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Fetch real orders data
  const {
    data: ordersData,
    isLoading,
    error,
    refetch: refetchOrders,
  } = useGetOrdersQuery({
    page: 1,
    per_page: 20,
    search: searchQuery || undefined,
  });
  const orders = ordersData?.items || [];

  // Submit order mutation
  const [submitOrder, { isLoading: isSubmitting }] = useSubmitOrderMutation();

  const getStatusConfig = (status: string) => {
    const configs = {
      draft: { variant: "default" as const, label: "Draft", color: "text-gray-600", bgColor: "bg-gray-50", borderColor: "border-gray-200" },
      submitted: { variant: "default" as const, label: "Pending Approval", color: "text-yellow-600", bgColor: "bg-yellow-50", borderColor: "border-yellow-200" },
      finance_approved: { variant: "info" as const, label: "Finance Approved", color: "text-blue-600", bgColor: "bg-blue-50", borderColor: "border-blue-200" },
      finance_rejected: { variant: "destructive" as const, label: "Finance Rejected", color: "text-red-600", bgColor: "bg-red-50", borderColor: "border-red-200" },
      logistics_approved: { variant: "success" as const, label: "Approved", color: "text-green-600", bgColor: "bg-green-50", borderColor: "border-green-200" },
      logistics_rejected: { variant: "destructive" as const, label: "Logistics Rejected", color: "text-red-600", bgColor: "bg-red-50", borderColor: "border-red-200" },
      assigned: { variant: "info" as const, label: "Assigned", color: "text-blue-600", bgColor: "bg-blue-50", borderColor: "border-blue-200" },
      picked_up: { variant: "info" as const, label: "Picked Up", color: "text-indigo-600", bgColor: "bg-indigo-50", borderColor: "border-indigo-200" },
      in_transit: { variant: "info" as const, label: "In Transit", color: "text-purple-600", bgColor: "bg-purple-50", borderColor: "border-purple-200" },
      delivered: { variant: "success" as const, label: "Delivered", color: "text-green-600", bgColor: "bg-green-50", borderColor: "border-green-200" },
      cancelled: { variant: "destructive" as const, label: "Cancelled", color: "text-red-600", bgColor: "bg-red-50", borderColor: "border-red-200" },
    };
    return configs[status as keyof typeof configs] || configs.draft;
  };

  const handleCreateOrder = () => {
    setIsCreateModalOpen(true);
  };

  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
  };

  const handleCreateOrderSuccess = () => {
    refetchOrders();
    toast.success("Order created successfully!");
  };

  const handleSubmitOrder = async (orderId: string) => {
    try {
      await submitOrder(orderId).unwrap();
      toast.success("Order sent for approval successfully!");
      refetchOrders();
    } catch (error: any) {
      toast.error(error.message || "Failed to send order for approval");
    }
  };

  const orderStats = {
    total: orders.length,
    draft: orders.filter((o) => o.status === "draft").length,
    submitted: orders.filter((o) => o.status === "submitted").length,
    approved: orders.filter(
      (o) => o.status === "finance_approved" || o.status === "logistics_approved"
    ).length,
  };

  // Filter orders based on status filter
  const filteredOrders = statusFilter
    ? orders.filter((o) => {
        if (statusFilter === "approved") {
          return o.status === "finance_approved" || o.status === "logistics_approved";
        }
        return o.status === statusFilter;
      })
    : orders;

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/20 p-4 md:p-6 lg:p-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                Orders Management
              </h1>
              <p className="text-gray-600 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Track and manage all customer orders
              </p>
            </div>
            <Button
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/40 px-6 py-3 rounded-xl font-semibold"
              onClick={handleCreateOrder}
            >
              <Plus className="w-5 h-5" />
              <span>Create Order</span>
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card
            className={`bg-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer ${
              statusFilter === null ? 'ring-4 ring-blue-500' : ''
            }`}
            onClick={() => setStatusFilter(null)}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Box className="w-8 h-8 text-gray-600" />
              </div>
              <p className="text-3xl font-bold text-gray-900 mb-1">
                {orderStats.total}
              </p>
              <p className="text-sm text-gray-600 font-medium">Total Orders</p>
            </CardContent>
          </Card>

          <Card
            className={`bg-gradient-to-br from-gray-50 to-slate-50 border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer ${
              statusFilter === 'draft' ? 'ring-4 ring-gray-500' : ''
            }`}
            onClick={() => setStatusFilter(statusFilter === 'draft' ? null : 'draft')}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <FileText className="w-8 h-8 text-gray-600" />
              </div>
              <p className="text-3xl font-bold text-gray-700 mb-1">
                {orderStats.draft}
              </p>
              <p className="text-sm text-gray-700 font-medium">Draft</p>
            </CardContent>
          </Card>

          <Card
            className={`bg-gradient-to-br from-yellow-50 to-orange-50 border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer ${
              statusFilter === 'submitted' ? 'ring-4 ring-yellow-500' : ''
            }`}
            onClick={() => setStatusFilter(statusFilter === 'submitted' ? null : 'submitted')}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Clock className="w-8 h-8 text-yellow-600" />
              </div>
              <p className="text-3xl font-bold text-yellow-700 mb-1">
                {orderStats.submitted}
              </p>
              <p className="text-sm text-yellow-700 font-medium">Submitted</p>
            </CardContent>
          </Card>

          <Card
            className={`bg-gradient-to-br from-green-50 to-emerald-50 border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer ${
              statusFilter === 'approved' ? 'ring-4 ring-green-500' : ''
            }`}
            onClick={() => setStatusFilter(statusFilter === 'approved' ? null : 'approved')}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Package className="w-8 h-8 text-green-600" />
              </div>
              <p className="text-3xl font-bold text-green-700 mb-1">
                {orderStats.approved}
              </p>
              <p className="text-sm text-green-700 font-medium">Approved</p>
            </CardContent>
          </Card>
        </div>

        {/* Search Bar */}
        <Card className="mb-8 border-0 shadow-lg bg-white">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search orders by customer, ID, or status..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 text-gray-900 placeholder-gray-400 border-2 border-gray-200 rounded-xl outline-none transition-all duration-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Orders List */}
        <div className="space-y-6">
          {filteredOrders.length > 0 ? (
            filteredOrders.map((order) => {
              const statusConfig = getStatusConfig(order.status);
              
              return (
                <Card key={order.id} className="border-0 shadow-xl bg-white rounded-2xl overflow-hidden">
                  <CardContent className="p-0">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
                      {/* Left Side - Customer Details */}
                      <div className="lg:col-span-4 bg-gray-50 p-6 border-r border-gray-200">
                        {/* Order Header */}
                        <div className="mb-6">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-xl font-bold text-gray-900">
                              {order.order_number}
                            </h3>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-gray-500 hover:text-gray-700"
                            >
                              <span className="text-lg">⋮</span>
                            </Button>
                          </div>
                          <Badge 
                            variant={statusConfig.variant}
                            className={`${statusConfig.bgColor} ${statusConfig.color} border ${statusConfig.borderColor} font-semibold px-3 py-1`}
                          >
                            {statusConfig.label}
                          </Badge>
                        </div>

                        {/* Date and Time */}
                        <div className="mb-6 pb-6 border-b border-gray-200">
                          <div className="flex items-center gap-2 text-sm text-gray-700 mb-2">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            <span>{new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          {order.updated_at && order.updated_at !== order.created_at && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Clock className="w-4 h-4" />
                              <span>Last updated: {new Date(order.updated_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          )}
                        </div>

                        {/* Customer Information */}
                        <div className="space-y-4">
                          <div>
                            <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                              <User className="w-4 h-4" />
                              <span>Customer</span>
                            </div>
                            <p className="text-sm font-bold text-gray-900">{order.customer?.name || "N/A"}</p>
                          </div>

                          {order.customer?.phone && (
                            <div>
                              <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                                <Phone className="w-4 h-4" />
                                <span>Mobile</span>
                              </div>
                              <p className="text-sm font-bold text-gray-900">{order.customer.phone}</p>
                            </div>
                          )}

                          {order.customer?.address && (
                            <div>
                              <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                                <MapPin className="w-4 h-4" />
                                <span>Location</span>
                              </div>
                              <p className="text-sm font-bold text-gray-900">{order.customer.address}</p>
                            </div>
                          )}

                          {order.branch && (
                            <div>
                              <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                                <Building2 className="w-4 h-4" />
                                <span>Branch</span>
                              </div>
                              <p className="text-sm font-bold text-gray-900">{order.branch.name}</p>
                              <p className="text-xs text-gray-600">{order.branch.code}</p>
                            </div>
                          )}

                          <div>
                            <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                              <Package className="w-4 h-4" />
                              <span>Total Units</span>
                            </div>
                            <p className="text-sm font-bold text-gray-900">{order.items_count || 0}</p>
                          </div>

                          <div>
                            <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                              <Weight className="w-4 h-4" />
                              <span>Total Weight</span>
                            </div>
                            <p className="text-sm font-bold text-gray-900">
                              {order.items && order.items.length > 0
                                ? order.items.reduce((sum, item) => sum + ((item.weight || 0) * item.quantity), 0).toFixed(2) + ' kg'
                                : '0.00 kg'}
                            </p>
                          </div>
                        </div>

                        {/* Assign to Trip Button */}
                        {/* {order.status === "submitted" && (
                          <Button
                            className="w-full mt-6 bg-green-600 hover:bg-green-700 text-white font-semibold py-3"
                          >
                            <Package className="w-4 h-4 mr-2" />
                            Assign to Trip
                          </Button>
                        )} */}

                        {/* Send for Approval Button */}
                        {order.status === "draft" && (
                          <Button
                            onClick={() => handleSubmitOrder(order.id)}
                            disabled={isSubmitting}
                            className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3"
                          >
                            <Send className="w-4 h-4 mr-2" />
                            Send for Approval
                          </Button>
                        )}
                      </div>

                      {/* Right Side - Order Items */}
                      <div className="lg:col-span-8 p-6">
                        <div className="mb-6">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="text-lg font-bold text-gray-900">
                              Order Items ({order.items_count})
                            </h4>
                          </div>

                          {/* Order Items Table */}
                          {order.items && order.items.length > 0 && (
                            <div className="overflow-x-auto">
                              <table className="w-full">
                                <thead>
                                  <tr className="border-b border-gray-200">
                                    <th className="text-left py-3 px-2 text-xs font-semibold text-gray-600">#</th>
                                    <th className="text-left py-3 px-2 text-xs font-semibold text-gray-600">Product</th>
                                    <th className="text-center py-3 px-2 text-xs font-semibold text-gray-600">Type</th>
                                    <th className="text-center py-3 px-2 text-xs font-semibold text-gray-600">Quantity</th>
                                    <th className="text-center py-3 px-2 text-xs font-semibold text-gray-600">Wt/Unit</th>
                                    <th className="text-center py-3 px-2 text-xs font-semibold text-gray-600">Total Wt</th>
                                    <th className="text-center py-3 px-2 text-xs font-semibold text-gray-600">Price/Unit</th>
                                    <th className="text-center py-3 px-2 text-xs font-semibold text-gray-600">Total Price</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {order.items.map((item, index) => {
                                    const weightPerUnit = item.weight || 0;
                                    const totalItemWeight = weightPerUnit * item.quantity;
                                    const weightType = item.weight_type || 'fixed';
                                    return (
                                      <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                                        <td className="py-4 px-2 text-sm text-gray-900">{index + 1}</td>
                                        <td className="py-4 px-2">
                                          <p className="text-sm font-semibold text-gray-900">{item.product_name}</p>
                                          {item.product_code && (
                                            <p className="text-xs text-gray-500">{item.product_code}</p>
                                          )}
                                        </td>
                                        <td className="py-4 px-2 text-center">
                                          <Badge
                                            variant={weightType === 'variable' ? 'warning' : 'default'}
                                            className={`${weightType === 'variable' ? 'bg-orange-50 text-orange-700 border-orange-200' : 'bg-gray-100 text-gray-700 border-gray-200'} text-xs font-semibold px-2 py-1`}
                                          >
                                            {weightType === 'variable' ? 'Var' : 'Fixed'}
                                          </Badge>
                                        </td>
                                        <td className="py-4 px-2 text-center text-sm font-semibold text-gray-900">{item.quantity}</td>
                                        <td className="py-4 px-2 text-center text-sm text-gray-900">
                                          {weightPerUnit > 0 ? weightPerUnit.toFixed(2) : '0.00'}
                                        </td>
                                        <td className="py-4 px-2 text-center text-sm text-gray-900">
                                          {totalItemWeight > 0 ? totalItemWeight.toFixed(2) : '0.00'}
                                        </td>
                                        <td className="py-4 px-2 text-center text-sm text-gray-900">
                                          {item.unit_price ? `$${item.unit_price.toFixed(2)}` : 'N/A'}
                                        </td>
                                        <td className="py-4 px-2 text-center text-sm text-gray-900">
                                          {item.total_price ? `$${item.total_price.toFixed(2)}` : item.unit_price ? `$${(item.unit_price * item.quantity).toFixed(2)}` : 'N/A'}
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          )}

                          {/* Overall Totals */}
                          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                              <h5 className="text-sm font-bold text-gray-700">Total Amount</h5>
                              <p className="text-xl font-bold text-blue-700">{order.total_amount ? `$${order.total_amount.toFixed(2)}` : 'N/A'}</p>
                            </div>
                          </div>
                        </div>

                        {/* Notes Section */}
                        {/* <div className="mt-6">
                          <div className="flex items-center justify-between mb-4">
                            <h5 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                              <span>💬</span>
                              Notes
                            </h5>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-blue-600 hover:text-blue-700 text-sm font-semibold"
                            >
                              + Add Note
                            </Button>
                          </div>
                          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                            <textarea
                              placeholder="Enter your note here..."
                              className="w-full bg-white border border-gray-200 rounded-lg p-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                              rows={4}
                            />
                            <div className="flex items-center justify-between mt-3">
                              <p className="text-xs text-gray-500">0 / 5000 characters</p>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-sm"
                                >
                                  Cancel
                                </Button>
                                <Button
                                  size="sm"
                                  className="bg-blue-600 hover:bg-blue-700 text-white text-sm"
                                >
                                  Add Note
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div> */}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          ) : isLoading ? (
            <div className="flex justify-center items-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
            </div>
          ) : error ? (
            <Card className="border-0 shadow-xl bg-white rounded-2xl">
              <CardContent className="p-8">
                <EmptyState
                  title="Error loading orders"
                  description="Failed to load orders. Please try again."
                />
              </CardContent>
            </Card>
          ) : (
            <Card className="border-0 shadow-xl bg-white rounded-2xl">
              <CardContent className="p-8">
                <EmptyState
                  title={statusFilter ? `No ${statusFilter} orders found` : "No orders found"}
                  description={statusFilter ? "Try selecting a different filter" : "Start by creating your first order"}
                  action={statusFilter ? {
                    label: "Clear Filter",
                    onClick: () => setStatusFilter(null),
                  } : {
                    label: "Create New Order",
                    onClick: handleCreateOrder,
                  }}
                />
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Create Order Modal */}
      <CreateOrderModal
        isOpen={isCreateModalOpen}
        onClose={handleCloseCreateModal}
        onSuccess={handleCreateOrderSuccess}
      />
    </>
  );
}