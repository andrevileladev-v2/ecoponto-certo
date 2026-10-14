'use client'

import AppShell from '@/components/layout/AppShell'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { PerfilConfig } from '@/features/perfil/components/PerfilConfig'
import { PerfilEntregas } from '@/features/perfil/components/PerfilEntregas'
import { PerfilHeader } from '@/features/perfil/components/PerfilHeader'
import { PerfilSalvos } from '@/features/perfil/components/PerfilSalvos'
import { PerfilStats } from '@/features/perfil/components/PerfilStats'
import { PerfilTabs } from '@/features/perfil/components/PerfilTabs'
import { usePerfilData } from '@/features/perfil/usePerfil'
import type { AbaPerfil } from '@/features/perfil/types'
import { useAuth } from '@/lib/auth'

export default function PerfilPage() {
  const { user, loading, logout, updateUser } = useAuth()
  const router = useRouter()
  const [aba, setAba] = useState<AbaPerfil>('entregas')

  useEffect(() => {
    if (!loading && !user) router.push('/login')
  }, [user, loading, router])

  const { entregas, salvos, stats } = usePerfilData(user)

  function handleLogout() {
    logout()
    router.push('/')
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const renderTab = () => {
    switch (aba) {
      case 'entregas':
        return <PerfilEntregas entregas={entregas} />
      case 'salvos':
        return <PerfilSalvos salvos={salvos} />
      case 'config':
        return <PerfilConfig user={user} onUpdated={updateUser} onLogout={handleLogout} />
      default:
        return null
    }
  }

  return (
    <AppShell>
      <div className="max-w-lg mx-auto flex flex-col gap-0">
        <PerfilHeader
          nome={user.nome}
          avatarUrl={user.avatar_url}
          cidade={user.cidade}
          criadoEm={user.criado_em}
        />

        <PerfilStats stats={stats} />
        <PerfilTabs aba={aba} onChange={setAba} />

        {renderTab()}
      </div>
    </AppShell>
  )
}
