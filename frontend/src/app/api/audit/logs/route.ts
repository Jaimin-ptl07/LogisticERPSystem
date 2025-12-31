import { NextRequest, NextResponse } from 'next/server'

const COMPANY_SERVICE_URL = process.env.NEXT_PUBLIC_COMPANY_API_URL || 'http://localhost:8002'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const queryString = searchParams.toString()

    const url = `${COMPANY_SERVICE_URL}/audit/logs${queryString ? `?${queryString}` : ''}`

    const response = await fetch(url, {
      method  : 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: request.headers.get('Authorization') || '',
      },
    })

    if (!response.ok) {
      return NextResponse.json(
        { detail: 'Failed to fetch audit logs' },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching audit logs:', error)
    return NextResponse.json(
      { detail: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const url = `${COMPANY_SERVICE_URL}/audit/logs`

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: request.headers.get('Authorization') || '',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      return NextResponse.json(
        { detail: 'Failed to create audit log' },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Error creating audit log:', error)
    return NextResponse.json(
      { detail: 'Internal server error' },
      { status: 500 }
    )
  }
}
