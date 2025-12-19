import { NextResponse } from 'next/server';

// TMS service URL
const TMS_SERVICE_URL = process.env.NEXT_PUBLIC_TMS_API_URL || 'http://localhost:8004';

export async function GET(request: Request) {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const tenant_id = searchParams.get('tenant_id') || 'default-tenant';
    const branch_id = searchParams.get('branch_id');

    // Determine which endpoint to call based on parameters
    let url = `${TMS_SERVICE_URL}/api/v1/resources/trucks?tenant_id=${tenant_id}`;

    // If branch_id is provided, get trucks for that specific branch
    if (branch_id) {
      url = `${TMS_SERVICE_URL}/api/v1/resources/branches/${branch_id}/trucks?tenant_id=${tenant_id}`;
    }

    // Call TMS service trucks endpoint
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('TMS service error:', response.status, response.statusText);
      return NextResponse.json(
        { error: `Failed to fetch trucks from TMS service: ${response.statusText}` },
        { status: response.status }
      );
    }

    const trucks = await response.json();
    return NextResponse.json(trucks);
  } catch (error) {
    console.error('Error fetching trucks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trucks' },
      { status: 500 }
    );
  }
}