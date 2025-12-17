"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { mockKPIs } from "@/data/mockData";
import {
  Truck,
  AlertTriangle,
  CheckCircle,
  Plus,
  Route,
  Users,
  Activity,
} from "lucide-react";

export default function Dashboard() {
  const getKPIIcon = (title: string) => {
    switch (title) {
      case "Available Trucks":
        return <Truck className="w-8 h-8" />;
      case "Overdue Customers":
        return <AlertTriangle className="w-8 h-8" />;
      case "Today Deliveries":
        return <CheckCircle className="w-8 h-8" />;
      default:
        return <Activity className="w-8 h-8" />;
    }
  };

  const getKPIColor = (color?: string) => {
    switch (color) {
      case "green":
        return "text-green-600 bg-green-50";
      case "red":
        return "text-red-600 bg-red-50";
      case "blue":
        return "text-blue-600 bg-blue-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Logistics Dashboard
        </h1>
        <p className="text-gray-500 mt-2">
          Welcome back! Here's an overview of your logistics operations.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {mockKPIs.map((kpi, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className={`p-3 rounded-lg ${getKPIColor(kpi.color)}`}>
                  {getKPIIcon(kpi.title)}
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-gray-900">
                    {kpi.value}
                  </p>
                  <p className="text-sm text-gray-500">{kpi.title}</p>
                  {kpi.subtitle && (
                    <p className="text-xs text-gray-400 mt-1">{kpi.subtitle}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button className="flex items-center gap-2 h-auto p-4 flex-col">
              <Plus className="w-6 h-6" />
              <span>Create New Trip</span>
            </Button>
            <Button
              variant="outline"
              className="flex items-center gap-2 h-auto p-4 flex-col"
            >
              <Route className="w-6 h-6" />
              <span>Plan Route</span>
            </Button>
            <Button
              variant="outline"
              className="flex items-center gap-2 h-auto p-4 flex-col"
            >
              <Truck className="w-6 h-6" />
              <span>Assign Vehicles</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Fleet Status */}
      <Card>
        <CardHeader>
          <CardTitle>Fleet Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  5 Trucks Available
                </p>
                <p className="text-xs text-gray-500">Ready for assignment</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  12 Trucks In Transit
                </p>
                <p className="text-xs text-gray-500">Active deliveries</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  2 Trucks Under Maintenance
                </p>
                <p className="text-xs text-gray-500">Expected back tomorrow</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
