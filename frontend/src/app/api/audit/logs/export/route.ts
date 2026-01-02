import { NextRequest, NextResponse } from 'next/server'

const COMPANY_SERVICE_URL = process.env.NEXT_PUBLIC_COMPANY_API_URL || 'http://localhost:8002'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const queryString = searchParams.toString()

    const url = `${COMPANY_SERVICE_URL}/audit/logs/export${queryString ? `?${queryString}` : ''}`

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: request.headers.get('Authorization') || '',
      },
    })

    if (!response.ok) {
      return NextResponse.json(
        { detail: 'Failed to export audit logs' },
        { status: response.status }
      )
    }

    // Get the CSV data
    const csvData = await response.arrayBuffer()

    // Return as CSV file
    return new NextResponse(csvData, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename=audit_logs.csv',
      },
    })
  } catch (error) {
    console.error('Error exporting audit logs:', error)
    return NextResponse.json(
      { detail: 'Internal server error' },
      { status: 500 }
    )
  }
}
