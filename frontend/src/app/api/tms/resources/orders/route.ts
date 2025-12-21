import { NextRequest, NextResponse } from 'next/server';

// TMS Service URL from environment
const TMS_SERVICE_URL = process.env.NEXT_PUBLIC_TMS_API_URL || 'http://localhost:8004';

// Dummy orders data - will come from other service in future
const dummyOrders = [
  {
    id: 'ORD-001',
    customer: "John's Farm",
    customerAddress: '123 Farm Road, Rural Area, Cairo',
    status: 'approved',
    total: 2500,
    weight: 850,
    volume: 1200,
    date: '2024-12-13',
    priority: 'high',
    items: 15,
    address: '123 Farm Road, Rural Area, Cairo'
  },
  {
    id: 'ORD-002',
    customer: 'Green Valley Store',
    customerAddress: '456 Market St, City Center',
    status: 'approved',
    total: 1800,
    weight: 650,
    volume: 950,
    date: '2024-12-13',
    priority: 'medium',
    items: 8,
    address: '456 Market St, City Center'
  },
  {
    id: 'ORD-003',
    customer: 'City Mart',
    customerAddress: '789 Main St, Downtown',
    status: 'approved',
    total: 3200,
    weight: 1200,
    volume: 1800,
    date: '2024-12-14',
    priority: 'high',
    items: 22,
    address: '789 Main St, Downtown'
  },
  {
    id: 'ORD-004',
    customer: 'SuperStore Chain',
    customerAddress: '321 Commercial Ave, Industrial Zone',
    status: 'approved',
    total: 4500,
    weight: 1800,
    volume: 2400,
    date: '2024-12-14',
    priority: 'low',
    items: 35,
    address: '321 Commercial Ave, Industrial Zone'
  },
  {
    id: 'ORD-005',
    customer: 'Local Pharmacy',
    customerAddress: '555 Health St, Medical District',
    status: 'approved',
    total: 1500,
    weight: 300,
    volume: 450,
    date: '2024-12-14',
    priority: 'high',
    items: 12,
    address: '555 Health St, Medical District'
  },
  {
    id: 'ORD-006',
    customer: 'Heavy Industry Corp',
    customerAddress: '789 Industrial Blvd, Manufacturing Zone',
    status: 'approved',
    total: 50000,
    weight: 10000,
    volume: 2500,
    date: '2024-12-15',
    priority: 'high',
    items: 50,
    address: '789 Industrial Blvd, Manufacturing Zone'
  },
];

// Helper function to get auth token from request
function getAuthToken(request: NextRequest): string | null {
  // Try to get token from Authorization header
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Try to get token from cookies (if using httpOnly cookies)
  const tokenCookie = request.cookies.get('access_token');
  return tokenCookie?.value || null;
}

export async function GET(request: NextRequest) {
  try {
    // Get auth token
    const token = getAuthToken(request);

    // Try to fetch from TMS service orders endpoint first
    try {
      const response = await fetch(`${TMS_SERVICE_URL}/api/v1/resources/orders`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Filter only approved orders
        const approvedOrders = data.filter((order: any) => order.status === 'approved');
        return NextResponse.json(approvedOrders);
      }
    } catch (error) {
      console.warn('TMS service not available, using dummy data:', error);
    }

    // Fallback to dummy data
    const approvedOrders = dummyOrders.filter(order => order.status === 'approved');
    return NextResponse.json(approvedOrders);

  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}