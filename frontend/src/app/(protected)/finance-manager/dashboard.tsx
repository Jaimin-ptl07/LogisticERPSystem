'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { AppLayout } from '@/components/layout/AppLayout';
import { DollarSign, TrendingUp, FileText, AlertCircle } from 'lucide-react';

export default function FinanceManagerDashboard() {
  const financialStats = [
    {
      title: 'Total Revenue',
      value: '₹12,45,000',
      change: '+12.5%',
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Pending Invoices',
      value: '23',
      change: '-5 from yesterday',
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Outstanding Payments',
      value: '₹3,25,000',
      change: '+8.2%',
      icon: AlertCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
    {
      title: 'Profit Margin',
      value: '18.5%',
      change: '+2.1%',
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Finance Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage finances, invoices, and payments</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {financialStats.map((stat) => (
            <Card key={stat.title}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-2">{stat.value}</p>
                    <p className="text-sm text-gray-500 mt-1">{stat.change}</p>
                  </div>
                  <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Financial Activities</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500">Financial data will be displayed here...</p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

