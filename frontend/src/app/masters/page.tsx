'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { AppLayout } from '@/components/layout/AppLayout';
import { mockCustomers, mockBranches, mockProducts, mockTrucks, mockDrivers } from '@/data/mockData';
import {
  Search,
  Download,
  Upload,
  Plus,
  Edit,
  Ban,
  Building,
  Users,
  Package,
  Truck,
  UserCheck
} from 'lucide-react';
import { useState } from 'react';

export default function Masters() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredCustomers = mockCustomers.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         customer.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         customer.phone.includes(searchQuery);
    const matchesStatus = statusFilter === 'all' || customer.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const MastersIcon = ({ type }: { type: string }) => {
    switch (type) {
      case 'branches':
        return <Building className="w-5 h-5" />;
      case 'customers':
        return <Users className="w-5 h-5" />;
      case 'products':
        return <Package className="w-5 h-5" />;
      case 'trucks':
        return <Truck className="w-5 h-5" />;
      case 'drivers':
        return <UserCheck className="w-5 h-5" />;
      default:
        return <Users className="w-5 h-5" />;
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Masters Management</h1>
          <p className="text-gray-500 mt-2">Manage all master data and configurations</p>
        </div>

        <Tabs defaultValue="customers" className="w-full">
          <TabsList>
            <TabsTrigger value="branches" className="flex items-center gap-2">
              <MastersIcon type="branches" />
              Branches
            </TabsTrigger>
            <TabsTrigger value="customers" className="flex items-center gap-2">
              <MastersIcon type="customers" />
              Customers
            </TabsTrigger>
            <TabsTrigger value="products" className="flex items-center gap-2">
              <MastersIcon type="products" />
              Products
            </TabsTrigger>
            <TabsTrigger value="trucks" className="flex items-center gap-2">
              <MastersIcon type="trucks" />
              Trucks
            </TabsTrigger>
            <TabsTrigger value="drivers" className="flex items-center gap-2">
              <MastersIcon type="drivers" />
              Drivers
            </TabsTrigger>
          </TabsList>

          <TabsContent value="customers">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Customers</CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex items-center gap-2">
                      <Download className="w-4 h-4" />
                      Download Template
                    </Button>
                    <Button variant="outline" size="sm" className="flex items-center gap-2">
                      <Upload className="w-4 h-4" />
                      Upload Excel
                    </Button>
                    <Button size="sm" className="flex items-center gap-2">
                      <Plus className="w-4 h-4" />
                      New Customer
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
                      placeholder="Search customers..."
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
                      All ({mockCustomers.length})
                    </Button>
                    <Button
                      variant={statusFilter === 'active' ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => setStatusFilter('active')}
                    >
                      Active ({mockCustomers.filter(c => c.status === 'active').length})
                    </Button>
                    <Button
                      variant={statusFilter === 'inactive' ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => setStatusFilter('inactive')}
                    >
                      Inactive ({mockCustomers.filter(c => c.status === 'inactive').length})
                    </Button>
                  </div>
                </div>

                {/* Customers Table */}
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Home Branch</TableHead>
                      <TableHead>Business Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCustomers.map((customer) => (
                      <TableRow key={customer.id}>
                        <TableCell className="font-medium">{customer.code}</TableCell>
                        <TableCell>{customer.name}</TableCell>
                        <TableCell>{customer.phone}</TableCell>
                        <TableCell>{customer.location}</TableCell>
                        <TableCell>{customer.homeBranch}</TableCell>
                        <TableCell>{customer.businessType}</TableCell>
                        <TableCell>
                          <Badge variant={customer.status === 'active' ? 'success' : 'default'}>
                            {customer.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Ban className="w-4 h-4" />
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

          <TabsContent value="branches">
            <Card>
              <CardHeader>
                <CardTitle>Branches</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {mockBranches.map((branch) => (
                    <div key={branch.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-gray-900">{branch.name}</h3>
                        <Badge variant={branch.status === 'active' ? 'success' : 'default'}>
                          {branch.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">Code: {branch.code}</p>
                      <p className="text-sm text-gray-600 mb-1">Location: {branch.location}</p>
                      <p className="text-sm text-gray-600 mb-1">Manager: {branch.manager}</p>
                      <p className="text-sm text-gray-600">Phone: {branch.phone}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="products">
            <Card>
              <CardHeader>
                <CardTitle>Products</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {mockProducts.map((product) => (
                    <div key={product.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-gray-900">{product.name}</h3>
                        <Badge variant={product.status === 'active' ? 'success' : 'default'}>
                          {product.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">Code: {product.code}</p>
                      <p className="text-sm text-gray-600 mb-1">Category: {product.category}</p>
                      <p className="text-sm text-gray-600 mb-1">Unit: {product.unit}</p>
                      <p className="text-sm text-gray-600">Price: ${product.price.toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trucks">
            <Card>
              <CardHeader>
                <CardTitle>Trucks</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {mockTrucks.map((truck) => (
                    <div key={truck.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-gray-900">{truck.plate}</h3>
                        <Badge variant={
                          truck.status === 'available' ? 'success' :
                          truck.status === 'on-duty' ? 'info' : 'warning'
                        }>
                          {truck.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">Model: {truck.model}</p>
                      <p className="text-sm text-gray-600 mb-1">Capacity: {truck.capacity} kg</p>
                      {truck.driver && (
                        <p className="text-sm text-gray-600">Driver: {truck.driver}</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="drivers">
            <Card>
              <CardHeader>
                <CardTitle>Drivers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {mockDrivers.map((driver) => (
                    <div key={driver.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-gray-900">{driver.name}</h3>
                        <Badge variant={driver.status === 'active' ? 'success' : 'default'}>
                          {driver.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">Phone: {driver.phone}</p>
                      <p className="text-sm text-gray-600 mb-1">License: {driver.license}</p>
                      <p className="text-sm text-gray-600 mb-1">Experience: {driver.experience}</p>
                      {driver.currentTruck && (
                        <p className="text-sm text-gray-600">Current Truck: {driver.currentTruck}</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}