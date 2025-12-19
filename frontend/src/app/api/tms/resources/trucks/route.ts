import { NextRequest, NextResponse } from 'next/server';

// TMS Service URL from environment
const TMS_SERVICE_URL = process.env.NEXT_PUBLIC_TMS_API_URL || 'http://localhost:8004';

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

// Dummy trucks data as fallback
const dummyTrucks = [
  {
    id: 'TRK-001',
    plate: 'ABC-1234',
    model: 'Ford Transit',
    capacity: 2000,
    status: 'available',
  },
  {
    id: 'TRK-002',
    plate: 'XYZ-5678',
    model: 'Mercedes Sprinter',
    capacity: 3000,
    status: 'available',
  },
  {
    id: 'TRK-003',
    plate: 'DEF-9012',
    model: 'Iveco Daily',
    capacity: 5000,
    status: 'available',
  },
  {
    id: 'TRK-004',
    plate: 'GHI-3456',
    model: 'Isuzu NPR',
    capacity: 2500,
    status: 'available',
  },
  {
    id: 'TRK-005',
    plate: 'JKL-7890',
    model: 'Ford Transit',
    capacity: 2000,
    status: 'available',
  },
];

export async function GET(request: NextRequest) {
  try {
    // Get auth token
    const token = getAuthToken(request);

    // Try to fetch from resource service first
    try {
      const response = await fetch(`${TMS_SERVICE_URL}/api/v1/resources/trucks`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Filter only available trucks
        const availableTrucks = data.filter((truck: any) => truck.status === 'available');
        return NextResponse.json(availableTrucks);
      }
    } catch (error) {
      console.warn('Resource service not available, using dummy data:', error);
    }

    // Fallback to dummy data
    const availableTrucks = dummyTrucks.filter(truck => truck.status === 'available');
    return NextResponse.json(availableTrucks);

  } catch (error) {
    console.error('Error fetching trucks:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch trucks' },
      { status: 500 }
    );
  }
}