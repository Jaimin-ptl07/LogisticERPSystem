import { NextResponse } from 'next/server';

// TMS service URL
const TMS_SERVICE_URL = process.env.NEXT_PUBLIC_TMS_API_URL || 'http://localhost:8004';

export async function GET(request: Request) {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const tenant_id = searchParams.get('tenant_id') || 'default-tenant';

    // Call TMS service branches endpoint
    const response = await fetch(
      `${TMS_SERVICE_URL}/api/v1/resources/branches?tenant_id=${tenant_id}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.error('TMS service error:', response.status, response.statusText);
      return NextResponse.json(
        { error: `Failed to fetch branches from TMS service: ${response.statusText}` },
        { status: response.status }
      );
    }

    const branches = await response.json();
    return NextResponse.json(branches);
  } catch (error) {
    console.error('Error fetching branches:', error);
    return NextResponse.json(
      { error: 'Failed to fetch branches' },
      { status: 500 }
    );
  }
}