'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAppSelector } from '@/store/hooks';
import {
  Building,
  Building2,
  Users,
  UserPlus,
  Shield,
  Power,
  PowerOff,
  Search,
  Plus,
  Edit,
  Eye,
  CheckCircle,
  XCircle,
  Settings
} from 'lucide-react';

// Mock data for companies
const mockCompanies = [
  {
    id: '1',
    name: 'LogiCorp Solutions',
    domain: 'logi-corp.logistic-erp.com',
    adminEmail: 'admin@logi-corp.com',
    status: 'active',
    createdAt: '2024-01-15',
    totalUsers: 45,
    totalOrders: 1250,
    lastActive: '2024-12-14T10:30:00Z'
  },
  {
    id: '2',
    name: 'Swift Transport Inc',
    domain: 'swift-transport.logistic-erp.com',
    adminEmail: 'admin@swift-transport.com',
    status: 'active',
    createdAt: '2024-02-20',
    totalUsers: 32,
    totalOrders: 890,
    lastActive: '2024-12-13T15:45:00Z'
  },
  {
    id: '3',
    name: 'Global Logistics Ltd',
    domain: 'global-logistics.logistic-erp.com',
    adminEmail: 'admin@global-logistics.com',
    status: 'disabled',
    createdAt: '2024-03-10',
    totalUsers: 28,
    totalOrders: 450,
    lastActive: '2024-11-20T09:15:00Z'
  },
  {
    id: '4',
    name: 'FastDelivery Services',
    domain: 'fastdelivery.logistic-erp.com',
    adminEmail: 'admin@fastdelivery.com',
    status: 'active',
    createdAt: '2024-04-05',
    totalUsers: 15,
    totalOrders: 320,
    lastActive: '2024-12-14T08:00:00Z'
  }
];

export default function SuperAdmin() {
  const { user } = useAppSelector((state) => state.auth);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Check if user is super admin
  if (!user?.is_superuser) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-500">You don't have permission to access this page.</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  const filteredCompanies = mockCompanies.filter(company => {
    const matchesSearch = company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         company.domain.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         company.adminEmail.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || company.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Super Admin Dashboard</h1>
          <p className="text-gray-500 mt-2">Manage all logistics companies and system-wide settings</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Building2 className="w-6 h-6 text-blue-600" />
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-gray-900">{mockCompanies.length}</p>
                  <p className="text-sm text-gray-500">Total Companies</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="p-3 bg-green-100 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-gray-900">
                    {mockCompanies.filter(c => c.status === 'active').length}
                  </p>
                  <p className="text-sm text-gray-500">Active Companies</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <Users className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-gray-900">
                    {mockCompanies.reduce((sum, c) => sum + c.totalUsers, 0)}
                  </p>
                  <p className="text-sm text-gray-500">Total Users</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Settings className="w-6 h-6 text-purple-600" />
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-gray-900">
                    {mockCompanies.reduce((sum, c) => sum + c.totalOrders, 0)}
                  </p>
                  <p className="text-sm text-gray-500">Total Orders</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="companies" className="w-full">
          <TabsList>
            <TabsTrigger value="companies" className="flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Manage Companies
            </TabsTrigger>
            <TabsTrigger value="create-company" className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Create Company
            </TabsTrigger>
            <TabsTrigger value="create-admin" className="flex items-center gap-2">
              <UserPlus className="w-4 h-4" />
              Create Admin
            </TabsTrigger>
          </TabsList>

          <TabsContent value="companies">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>All Companies</CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex items-center gap-2">
                      <Plus className="w-4 h-4" />
                      Create Company
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Toolbar */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search companies..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant={statusFilter === 'all' ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => setStatusFilter('all')}
                    >
                      All ({mockCompanies.length})
                    </Button>
                    <Button
                      variant={statusFilter === 'active' ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => setStatusFilter('active')}
                    >
                      Active ({mockCompanies.filter(c => c.status === 'active').length})
                    </Button>
                    <Button
                      variant={statusFilter === 'disabled' ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => setStatusFilter('disabled')}
                    >
                      Disabled ({mockCompanies.filter(c => c.status === 'disabled').length})
                    </Button>
                  </div>
                </div>

                {/* Companies Table */}
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Company Name</TableHead>
                      <TableHead>Domain</TableHead>
                      <TableHead>Admin Email</TableHead>
                      <TableHead>Users</TableHead>
                      <TableHead>Orders</TableHead>
                      <TableHead>Last Active</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCompanies.map((company) => (
                      <TableRow key={company.id}>
                        <TableCell className="font-medium">{company.name}</TableCell>
                        <TableCell className="text-sm text-gray-600">{company.domain}</TableCell>
                        <TableCell>{company.adminEmail}</TableCell>
                        <TableCell>{company.totalUsers}</TableCell>
                        <TableCell>{company.totalOrders.toLocaleString()}</TableCell>
                        <TableCell className="text-sm">
                          {formatDateTime(company.lastActive)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={company.status === 'active' ? 'success' : 'warning'}>
                            <div className="flex items-center gap-1">
                              {company.status === 'active' ? (
                                <CheckCircle className="w-3 h-3" />
                              ) : (
                                <XCircle className="w-3 h-3" />
                              )}
                              {company.status}
                            </div>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className={company.status === 'active' ? 'text-yellow-600' : 'text-green-600'}
                            >
                              {company.status === 'active' ? (
                                <PowerOff className="w-4 h-4" />
                              ) : (
                                <Power className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="create-company">
            <Card>
              <CardHeader>
                <CardTitle>Create New Logistics Company</CardTitle>
                <p className="text-sm text-gray-500">
                  Set up a new logistics company with their own admin account
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Company Name
                      </label>
                      <input
                        type="text"
                        placeholder="Enter company name"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Company Domain
                      </label>
                      <input
                        type="text"
                        placeholder="company-name.logistic-erp.com"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Company Admin Email
                      </label>
                      <input
                        type="email"
                        placeholder="admin@company.com"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Admin First Name
                      </label>
                      <input
                        type="text"
                        placeholder="First name"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Admin Last Name
                      </label>
                      <input
                        type="text"
                        placeholder="Last name"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Temporary Password
                      </label>
                      <input
                        type="password"
                        placeholder="Generate temporary password"
                        defaultValue="temp123456"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
                <div className="mt-6">
                  <Button className="w-full md:w-auto">
                    Create Company Account
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="create-admin">
            <Card>
              <CardHeader>
                <CardTitle>Create Company Admin Account</CardTitle>
                <p className="text-sm text-gray-500">
                  Create admin credentials for an existing company
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Company
                    </label>
                    <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                      <option value="">Choose a company...</option>
                      {mockCompanies.map((company) => (
                        <option key={company.id} value={company.id}>
                          {company.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Admin Email
                      </label>
                      <input
                        type="email"
                        placeholder="admin@company.com"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Role
                      </label>
                      <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        <option value="admin">Company Admin</option>
                        <option value="manager">Manager</option>
                        <option value="employee">Employee</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        First Name
                      </label>
                      <input
                        type="text"
                        placeholder="First name"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Last Name
                      </label>
                      <input
                        type="text"
                        placeholder="Last name"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Initial Password
                    </label>
                    <input
                      type="password"
                      placeholder="Set initial password"
                      defaultValue="temp123456"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="mt-6">
                  <Button className="w-full md:w-auto">
                    Create Admin Account
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}