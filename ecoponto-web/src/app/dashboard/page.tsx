"use client"

import { useState, useEffect } from "react"
import AppShell from "@/components/layout/AppShell"
import { request } from "@/lib/api"

type ResiduoStat = { nome: string; cor: string; icone: string; total_kg: number }
type UsuarioTop = { inicial: string; nome: string; total_kg: number }
type StatsData = { residuos: ResiduoStat[]; top_usuarios: UsuarioTop[] }

export default function DashboardPage() {
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    request<StatsData>("/api/stats")
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const residuos = stats?.residuos ?? []
  const top = stats?.top_usuarios ?? []
  const MAX = residuos.length > 0 ? Math.max(...residuos.map(r => r.total_kg)) : 1

  return (
    <AppShell>
      <div className="p-6 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Visão geral dos resíduos coletados</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-40">
            <p className="text-gray-400">Carregando...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Residuos por tipo */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-base font-semibold text-gray-700 mb-4">Resíduos por Tipo (kg)</h2>
              {residuos.length === 0 ? (
                <p className="text-sm text-gray-400">Nenhuma entrega registrada ainda.</p>
              ) : (
                <div className="space-y-3">
                  {residuos.map((r) => (
                    <div key={r.nome} className="flex items-center gap-3">
                      <span className="w-28 text-sm text-gray-600 truncate">{r.nome}</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
                        <div
                          className="h-3 rounded-full transition-all"
                          style={{
                            width: `${(r.total_kg / MAX) * 100}%`,
                            backgroundColor: r.cor ?? "#2563EB",
                          }}
                        />
                      </div>
                      <span className="w-16 text-sm text-right text-gray-500">
                        {r.total_kg.toLocaleString("pt-BR")} kg
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Top usuários */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-base font-semibold text-gray-700 mb-4">Top Contribuidores</h2>
              {top.length === 0 ? (
                <p className="text-sm text-gray-400">Nenhuma entrega registrada ainda.</p>
              ) : (
                <div className="space-y-3">
                  {top.map((u, idx) => (
                    <div key={u.nome} className="flex items-center gap-3">
                      <span className="w-6 text-sm text-gray-400 font-medium">{idx + 1}</span>
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-sm font-semibold text-green-700">
                        {u.inicial}
                      </div>
                      <span className="flex-1 text-sm text-gray-700">{u.nome}</span>
                      <span className="text-sm font-medium text-gray-500">
                        {u.total_kg.toLocaleString("pt-BR")} kg
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}
