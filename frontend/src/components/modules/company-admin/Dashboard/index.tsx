import React from 'react';
import { Truck, Package, Users, DollarSign, TrendingUp, Clock } from 'lucide-react';
import Card from '@/components/shared/ui/Card';
import KPICard from '@/components/shared/widgets/KPICard';
import OrdersChart from '@/components/shared/widgets/OrdersChart';
import RecentOrdersTable from '@/components/shared/widgets/RecentOrdersTable';

const CompanyAdminDashboard: React.FC = () => {
  // Sample data - in real app, this would come from Redux store or API
  const kpiData = [
    {
      title: 'Total Orders',
      value: '1,234',
      change: 12.5,
      changeType: 'increase' as const,
      icon: <Package size={24} />,
      color: 'blue',
    },
    {
      title: 'Active Vehicles',
      value: '45',
      change: 5,
      changeType: 'increase' as const,
      icon: <Truck size={24} />,
      color: 'green',
    },
    {
      title: 'Total Customers',
      value: '234',
      change: 8,
      changeType: 'increase' as const,
      icon: <Users size={24} />,
      color: 'purple',
    },
    {
      title: 'Revenue',
      value: '$45,678',
      change: 15.3,
      changeType: 'increase' as const,
      icon: <DollarSign size={24} />,
      color: 'yellow',
    },
  ];

  const recentOrders = [
    {
      id: 'ORD-001',
      customer: 'ABC Company',
      status: 'In Progress',
      date: '2024-01-15',
      amount: '$1,234',
    },
    {
      id: 'ORD-002',
      customer: 'XYZ Logistics',
      status: 'Delivered',
      date: '2024-01-15',
      amount: '$2,456',
    },
    {
      id: 'ORD-003',
      customer: 'Quick Move Inc',
      status: 'Pending',
      date: '2024-01-14',
      amount: '$987',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Company Dashboard</h1>
        <p className="text-gray-600">Welcome back! Here's what's happening in your company today.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiData.map((kpi, index) => (
          <KPICard key={index} {...kpi} />
        ))}
      </div>

      {/* Charts and Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Orders Chart */}
        <Card title="Orders Overview" subtitle="Last 7 days">
          <div className="h-80">
            <OrdersChart />
          </div>
        </Card>

        {/* Quick Actions */}
        <Card title="Quick Actions">
          <div className="grid grid-cols-2 gap-4">
            <button className="p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
              <Truck className="h-8 w-8 text-blue-600 mb-2" />
              <p className="text-sm font-medium text-gray-900">Create Order</p>
            </button>
            <button className="p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
              <Package className="h-8 w-8 text-green-600 mb-2" />
              <p className="text-sm font-medium text-gray-900">Track Shipment</p>
            </button>
            <button className="p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
              <Users className="h-8 w-8 text-purple-600 mb-2" />
              <p className="text-sm font-medium text-gray-900">Add Customer</p>
            </button>
            <button className="p-4 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors">
              <TrendingUp className="h-8 w-8 text-yellow-600 mb-2" />
              <p className="text-sm font-medium text-gray-900">View Reports</p>
            </button>
          </div>
        </Card>
      </div>

      {/* Recent Orders Table */}
      <Card title="Recent Orders" subtitle="Latest orders from your branches">
        <RecentOrdersTable orders={recentOrders} />
      </Card>

      {/* Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card title="Recent Activity" className="lg:col-span-2">
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-blue-100 rounded-full">
                <Package className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  New order #ORD-004 received from Main Branch
                </p>
                <p className="text-xs text-gray-500">2 minutes ago</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-green-100 rounded-full">
                <Truck className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Trip #T-098 completed successfully
                </p>
                <p className="text-xs text-gray-500">15 minutes ago</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-yellow-100 rounded-full">
                <Users className="h-4 w-4 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  New driver John Doe added to fleet
                </p>
                <p className="text-xs text-gray-500">1 hour ago</p>
              </div>
            </div>
          </div>
        </Card>

        <Card title="Pending Approvals">
          <div className="space-y-3">
            <div className="p-3 bg-yellow-50 rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-medium text-gray-900">Order ORD-005</p>
                <span className="text-xs text-yellow-600">Pending</span>
              </div>
              <p className="text-xs text-gray-600">Awaiting finance approval</p>
            </div>
            <div className="p-3 bg-yellow-50 rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-medium text-gray-900">Trip T-099</p>
                <span className="text-xs text-yellow-600">Pending</span>
              </div>
              <p className="text-xs text-gray-600">Driver assignment required</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default CompanyAdminDashboard;