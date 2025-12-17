'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { AppLayout } from '@/components/layout/AppLayout';
import { Truck, MapPin, Package, Clock } from 'lucide-react';

export default function DriverTrips() {
  const myTrips = [
    {
      id: '1',
      status: 'in-progress',
      origin: 'Mumbai Warehouse',
      destination: 'Pune Office',
      orders: 8,
      estimatedTime: '3h 20m',
    },
    {
      id: '2',
      status: 'scheduled',
      origin: 'Pune Office',
      destination: 'Nashik Branch',
      orders: 5,
      estimatedTime: '2h 45m',
    },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Trips</h1>
          <p className="text-gray-600 mt-2">View and manage your assigned trips</p>
        </div>

        <div className="grid gap-4">
          {myTrips.map((trip) => (
            <Card key={trip.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Trip #{trip.id}</CardTitle>
                  <Badge variant={trip.status === 'in-progress' ? 'warning' : 'default'}>
                    {trip.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Origin</p>
                      <p className="font-medium">{trip.origin}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Destination</p>
                      <p className="font-medium">{trip.destination}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Package className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Orders</p>
                      <p className="font-medium">{trip.orders}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Estimated Time</p>
                      <p className="font-medium">{trip.estimatedTime}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}

