import { NextRequest, NextResponse } from 'next/server'

const COMPANY_SERVICE_URL = process.env.NEXT_PUBLIC_COMPANY_API_URL || 'http://localhost:8002'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const queryString = searchParams.toString()

    const url = `${COMPANY_SERVICE_URL}/audit/logs/summary${queryString ? `?${queryString}` : ''}`

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: request.headers.get('Authorization') || '',
      },
    })

    if (!response.ok) {
      return NextResponse.json(
        { detail: 'Failed to fetch audit summary' },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching audit summary:', error)
    return NextResponse.json(
      { detail: 'Internal server error' },
      { status: 500 }
    )
  }
}
