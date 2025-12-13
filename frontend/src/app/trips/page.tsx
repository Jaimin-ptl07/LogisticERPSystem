'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { AppLayout } from '@/components/layout/AppLayout';
import { mockTrips } from '@/data/mockData';
import { Truck, MapPin, User, Package } from 'lucide-react';
import { useState } from 'react';

export default function Trips() {
  const [activeTab, setActiveTab] = useState('active');

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'on-route':
        return 'info';
      case 'loading':
        return 'warning';
      case 'planning':
        return 'default';
      case 'cancelled':
        return 'danger';
      default:
        return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600';
      case 'on-route':
        return 'text-blue-600';
      case 'loading':
        return 'text-yellow-600';
      case 'planning':
        return 'text-gray-600';
      case 'cancelled':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const tripStats = {
    planning: mockTrips.filter(t => t.status === 'planning').length,
    loading: mockTrips.filter(t => t.status === 'loading').length,
    onRoute: mockTrips.filter(t => t.status === 'on-route').length,
    completed: mockTrips.filter(t => t.status === 'completed').length,
    cancelled: mockTrips.filter(t => t.status === 'cancelled').length,
  };

  const activeTrips = mockTrips.filter(t => t.status !== 'cancelled');
  const cancelledTrips = mockTrips.filter(t => t.status === 'cancelled');

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Trips</h1>
          <p className="text-gray-500 mt-2">Manage and monitor all transportation trips</p>
        </div>

        {/* Status Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Package className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{tripStats.planning}</p>
                  <p className="text-sm text-gray-500">Planning</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-50 rounded-lg">
                  <Truck className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{tripStats.loading}</p>
                  <p className="text-sm text-gray-500">Loading</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <MapPin className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{tripStats.onRoute}</p>
                  <p className="text-sm text-gray-500">On Route</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-50 rounded-lg">
                  <Package className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{tripStats.completed}</p>
                  <p className="text-sm text-gray-500">Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-50 rounded-lg">
                  <Package className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{tripStats.cancelled}</p>
                  <p className="text-sm text-gray-500">Cancelled</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Trips List */}
        <Card>
          <CardHeader>
            <CardTitle>All Trips</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="active" className="w-full">
              <TabsList>
                <TabsTrigger value="active">Active ({activeTrips.length})</TabsTrigger>
                <TabsTrigger value="cancelled">Cancelled ({cancelledTrips.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="active">
                <div className="space-y-4">
                  {activeTrips.map((trip) => (
                    <div key={trip.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-gray-900">{trip.id}</h3>
                          <Badge variant={getStatusVariant(trip.status)} className="mt-1">
                            {trip.status.charAt(0).toUpperCase() + trip.status.slice(1).replace('-', ' ')}
                          </Badge>
                        </div>
                        <span className="text-sm text-gray-500">{trip.date}</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-600">Branch: <span className="font-medium">{trip.branch}</span></span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Truck className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-600">
                              Truck: <span className="font-medium">{trip.truck.plate} ({trip.truck.model})</span>
                            </span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            <User className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-600">
                              Driver: <span className="font-medium">{trip.driver.name}</span>
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Package className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-600">
                              Orders: <span className="font-medium">{trip.orders} orders</span>
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="cancelled">
                <div className="space-y-4">
                  {cancelledTrips.length > 0 ? (
                    cancelledTrips.map((trip) => (
                      <div key={trip.id} className="border border-gray-200 rounded-lg p-4 bg-red-50 opacity-75">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-semibold text-gray-900">{trip.id}</h3>
                            <Badge variant="danger" className="mt-1">
                              Cancelled
                            </Badge>
                          </div>
                          <span className="text-sm text-gray-500">{trip.date}</span>
                        </div>
                        <p className="text-sm text-gray-600">Reason: Trip cancelled due to weather conditions</p>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No cancelled trips
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}