import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization') ?? ''
  const res = await fetch('http://localhost:3001/api/stats', {
    headers: {
      ...(authHeader ? { authorization: authHeader } : {}),
    },
  })
  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}
