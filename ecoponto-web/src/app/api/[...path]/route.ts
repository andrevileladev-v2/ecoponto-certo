import { NextRequest, NextResponse } from 'next/server'

function getBackendUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_API_URL ?? process.env.API_URL
  if (envUrl && envUrl.startsWith('http') && !envUrl.includes('localhost')) {
    return envUrl.replace(/\/+$/, '')
  }
  if (process.env.NODE_ENV === 'production' || process.env.NETLIFY) {
    return 'https://ecoponto-certo.onrender.com'
  }
  return (envUrl ?? 'http://localhost:3001').replace(/\/+$/, '')
}

const API_URL = getBackendUrl()
const BACKEND = API_URL.endsWith('/api') ? API_URL : `${API_URL}/api`

async function handler(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params
  const pathStr = path.join('/')
  const search = request.nextUrl.search
  const url = `${BACKEND}/${pathStr}${search}`

  const authHeader = request.headers.get('authorization') ?? ''
  const hasBody = request.method !== 'GET' && request.method !== 'HEAD'

  try {
    const res = await fetch(url, {
      method: request.method,
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader ? { authorization: authHeader } : {}),
      },
      body: hasBody ? await request.text() : undefined,
    })

    const data = await res.json().catch(() => null)
    return NextResponse.json(data, { status: res.status })
  } catch (err) {
    console.error(`[Proxy Error] Falha ao conectar ao backend em ${url}:`, err)
    return NextResponse.json(
      { error: 'Não foi possível conectar ao servidor de API.' },
      { status: 502 }
    )
  }
}

export const GET = handler
export const POST = handler
export const PUT = handler
export const PATCH = handler
export const DELETE = handler
