import { NextRequest, NextResponse } from 'next/server'

const BACKEND = 'http://localhost:3001/api'

async function handler(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params
  const pathStr = path.join('/')
  const search = request.nextUrl.search
  const url = `${BACKEND}/${pathStr}${search}`

  const authHeader = request.headers.get('authorization') ?? ''

  const res = await fetch(url, {
    method: request.method,
    headers: {
      'Content-Type': 'application/json',
      ...(authHeader ? { authorization: authHeader } : {}),
    },
    body: isBody ? await request.text() : undefined,
  })

  const data = await res.json().catch(() => null)
  return NextResponse.json(data, { status: res.status })
}

export const GET = handler
export const POST = handler
export const PUT = handler
export const PATCH = handler
export const DELETE = handler
