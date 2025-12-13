"use client";

import { useRef, useState } from "react";
import { ModalLayout } from "./ModalLayout";
import { Badge } from "@/components/ui/Badge";
import { useOutsideClick } from "@/components/Hooks/useOutsideClick";
import { Order } from "@/types";
import {
  Package,
  Calendar,
  DollarSign,
  User,
  MapPin,
  Phone,
  Truck,
  Clock,
  CheckCircle,
  ShoppingBag,
} from "lucide-react";

interface OrderDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
}

// Mock additional order details for demonstration
const mockOrderDetails = {
  "ORD-001": {
    customerDetails: {
      phone: "+201000000001",
      email: "john@johnsfarm.com",
      address: "123 Farm Road, Rural Area, Cairo, Egypt",
      businessType: "Agriculture",
    },
    items: [
      {
        id: 1,
        name: "Animal Feed Premium",
        quantity: 10,
        unit: "kg",
        price: 15.5,
        total: 155,
      },
      {
        id: 2,
        name: "Vitamin Supplement",
        quantity: 5,
        unit: "bottle",
        price: 120,
        total: 600,
      },
      {
        id: 3,
        name: "Animal Feed Standard",
        quantity: 5,
        unit: "kg",
        price: 12.5,
        total: 62.5,
      },
    ],
    delivery: {
      driver: "Mike Johnson",
      truck: "ABC-1234 (Ford Transit)",
      estimatedDelivery: "2024-01-10 14:30",
      actualDelivery: "2024-01-10 14:25",
    },
  },
  "ORD-002": {
    customerDetails: {
      phone: "+201000000002",
      email: "contact@greenvalley.com",
      address: "456 Market St, City Center, Giza, Egypt",
      businessType: "Retail",
    },
    items: [
      {
        id: 1,
        name: "Animal Feed Premium",
        quantity: 8,
        unit: "kg",
        price: 15.5,
        total: 124,
      },
    ],
    delivery: {
      driver: "Sarah Ahmed",
      truck: "XYZ-5678 (Mercedes Sprinter)",
      estimatedDelivery: "2024-01-10 16:00",
      actualDelivery: null,
    },
  },
  "ORD-003": {
    customerDetails: {
      phone: "+201000000003",
      email: "info@citymart.net",
      address: "789 Commercial Ave, Alexandria, Egypt",
      businessType: "Retail",
    },
    items: [
      {
        id: 1,
        name: "Animal Feed Premium",
        quantity: 15,
        unit: "kg",
        price: 15.5,
        total: 232.5,
      },
      {
        id: 2,
        name: "Vitamin Supplement",
        quantity: 7,
        unit: "bottle",
        price: 120,
        total: 840,
      },
    ],
    delivery: {
      driver: "Ali Hassan",
      truck: "DEF-9012 (Iveco Daily)",
      estimatedDelivery: "2024-01-11 18:00",
      actualDelivery: null,
    },
  },
};

type TabType = "details" | "customer" | "items" | "delivery";

export function OrderDetailsModal({
  isOpen,
  onClose,
  order,
}: OrderDetailsModalProps) {
  const modalRef = useRef<HTMLDivElement | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("details");
  useOutsideClick(modalRef, onClose, isOpen);

  if (!order) return null;

  const orderDetails =
    mockOrderDetails[order.id as keyof typeof mockOrderDetails];

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "completed":
        return "success";
      case "on-route":
        return "info";
      case "loading":
        return "warning";
      case "pending":
        return "default";
      default:
        return "default";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4" />;
      case "on-route":
        return <Truck className="w-4 h-4" />;
      case "loading":
        return <Package className="w-4 h-4" />;
      case "pending":
        return <Clock className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const tabs = [
    { id: "details" as TabType, label: "Order Details", icon: Package },
    { id: "customer" as TabType, label: "Customer Info", icon: User },
    { id: "items" as TabType, label: "Order Items", icon: ShoppingBag },
    { id: "delivery" as TabType, label: "Delivery", icon: Truck },
  ];

  return (
    <ModalLayout
      isOpen={isOpen}
      onClose={onClose}
      title={`Order Details - ${order.id}`}
      size="lg"
      className="flex flex-col m-4 h-[90vh] max-h-[800px]"
    >
      <div className="flex flex-col h-full" ref={modalRef}>
        {/* Order Header Summary */}
        <div className="flex items-center justify-between px-6 pt-2 pb-4 border-b">
          <div className="flex items-center gap-3">
            <Badge
              variant={getStatusVariant(order.status)}
              className="flex items-center gap-2"
            >
              {getStatusIcon(order.status)}
              {order.status.charAt(0).toUpperCase() +
                order.status.slice(1).replace("-", " ")}
            </Badge>
            <span className="text-sm text-gray-500">{order.date}</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            ${order.total.toFixed(2)}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 px-6 pt-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex cursor-pointer  border border-[#1ab052]
  hover:bg-[#1ab052]/10
  hover:border-[#1ab052]
  hover:shadow-[0_0_0_1px_rgba(26,176,82,0.25)]
  transition-all duration-200 ease-in-out items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border transition-colors
                  ${
                    activeTab === tab.id
                      ? "bg-[#1ab052] text-white border-[#1ab052] hover:bg-[#1ab052]"
                      : "bg-white text-gray-600 border-gray-300 hover:border-gray-400 hover:text-gray-800"
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content - Scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {/* Order Details Tab */}
          {activeTab === "details" && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Order Information
              </h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    Order ID
                  </span>
                  <span className="text-sm text-gray-900">{order.id}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    Status
                  </span>
                  <Badge variant={getStatusVariant(order.status)}>
                    {order.status.charAt(0).toUpperCase() +
                      order.status.slice(1).replace("-", " ")}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    Customer
                  </span>
                  <span className="text-sm text-gray-900">
                    {order.customer}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    Date
                  </span>
                  <span className="text-sm text-gray-900">{order.date}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    Total Items
                  </span>
                  <span className="text-sm text-gray-900">
                    {order.items} items
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    Total Amount
                  </span>
                  <span className="text-sm font-bold text-gray-900">
                    ${order.total.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Customer Info Tab */}
          {activeTab === "customer" && orderDetails && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Customer Information
              </h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    Name
                  </span>
                  <span className="text-sm text-gray-900">
                    {order.customer}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 flex items-center gap-1">
                    <Phone className="w-4 h-4" />
                    Phone
                  </span>
                  <span className="text-sm text-gray-900">
                    {orderDetails.customerDetails.phone}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    Email
                  </span>
                  <span className="text-sm text-gray-900">
                    {orderDetails.customerDetails.email}
                  </span>
                </div>
                <div className="flex items-start justify-between">
                  <span className="text-sm font-medium text-gray-700 flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    Address
                  </span>
                  <span className="text-sm text-gray-900 text-right max-w-xs">
                    {orderDetails.customerDetails.address}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    Business Type
                  </span>
                  <span className="text-sm text-gray-900">
                    {orderDetails.customerDetails.businessType}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Order Items Tab */}
          {activeTab === "items" && orderDetails && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Order Items ({order.items} items)
              </h3>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Product
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Quantity
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Unit Price
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {orderDetails.items.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4 text-sm text-gray-900">
                          {item.name}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-900 text-center">
                          {item.quantity} {item.unit}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-900 text-right">
                          ${item.price.toFixed(2)}
                        </td>
                        <td className="px-4 py-4 text-sm font-medium text-gray-900 text-right">
                          ${item.total.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td
                        colSpan={3}
                        className="px-4 py-3 text-sm font-semibold text-gray-700"
                      >
                        Total Amount
                      </td>
                      <td className="px-4 py-3 text-sm font-bold text-gray-900 text-right">
                        ${order.total.toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* Delivery Tab */}
          {activeTab === "delivery" && orderDetails && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Delivery Information
              </h3>
              <div className="bg-blue-50 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    Driver
                  </span>
                  <span className="text-sm text-gray-900">
                    {orderDetails.delivery.driver}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    Truck
                  </span>
                  <span className="text-sm text-gray-900">
                    {orderDetails.delivery.truck}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Estimated Delivery
                  </span>
                  <span className="text-sm text-gray-900">
                    {orderDetails.delivery.estimatedDelivery}
                  </span>
                </div>
                {orderDetails.delivery.actualDelivery && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      Actual Delivery
                    </span>
                    <span className="text-sm text-green-600 font-medium">
                      {orderDetails.delivery.actualDelivery}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
          >
            Close
          </button>
          {order.status === "pending" && (
            <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer">
              Process Order
            </button>
          )}
          {order.status === "completed" && (
            <button className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors cursor-pointer">
              Download Invoice
            </button>
          )}
        </div>
      </div>
    </ModalLayout>
  );
}
