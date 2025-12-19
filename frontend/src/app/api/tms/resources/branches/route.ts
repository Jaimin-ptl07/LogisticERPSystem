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

// Dummy branches data as fallback
const dummyBranches = [
  {
    id: 'BR-001',
    code: 'NB001',
    name: 'North Branch',
    location: 'Cairo, Egypt',
    manager: 'Ahmed Ali',
    phone: '+201000000010',
    status: 'active',
  },
  {
    id: 'BR-002',
    code: 'SB001',
    name: 'South Branch',
    location: 'Giza, Egypt',
    manager: 'Mohamed Hassan',
    phone: '+201000000011',
    status: 'active',
  },
  {
    id: 'BR-003',
    code: 'EB001',
    name: 'East Branch',
    location: 'Suez, Egypt',
    manager: 'Khalid Omar',
    phone: '+201000000012',
    status: 'active',
  },
  {
    id: 'BR-004',
    code: 'WB001',
    name: 'West Branch',
    location: 'Alexandria, Egypt',
    manager: 'Sami Mahmoud',
    phone: '+201000000013',
    status: 'active',
  },
];

export async function GET(request: NextRequest) {
  try {
    // Get auth token
    const token = getAuthToken(request);

    // Try to fetch from branch service first
    try {
      const response = await fetch(`${TMS_SERVICE_URL}/api/v1/resources/branches`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Filter only active branches
        const activeBranches = data.filter((branch: any) => branch.status === 'active');
        return NextResponse.json(activeBranches);
      }
    } catch (error) {
      console.warn('Branch service not available, using dummy data:', error);
    }

    // Fallback to dummy data
    const activeBranches = dummyBranches.filter(branch => branch.status === 'active');
    return NextResponse.json(activeBranches);

  } catch (error) {
    console.error('Error fetching branches:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch branches' },
      { status: 500 }
    );
  }
}