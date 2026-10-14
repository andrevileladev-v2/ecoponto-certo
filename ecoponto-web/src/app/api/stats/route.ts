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
const API_BASE = API_URL.endsWith('/api') ? API_URL : `${API_URL}/api`

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization') ?? ''
  try {
    const res = await fetch(`${API_BASE}/stats${request.nextUrl.search}`, {
      headers: {
        ...(authHeader ? { authorization: authHeader } : {}),
      },
    })
    const data = await res.json().catch(() => ({ error: 'Resposta inválida recebida da API' }))
    return NextResponse.json(data, { status: res.status })
  } catch (error) {
    console.error('Falha ao conectar à API de estatísticas', error)
    return NextResponse.json({ error: 'Não foi possível conectar à API' }, { status: 502 })
  }
}
