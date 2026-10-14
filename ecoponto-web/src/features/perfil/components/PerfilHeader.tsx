import Image from 'next/image'

import type { PerfilHeaderProps } from '@/features/perfil/types'

export function PerfilHeader({ nome, avatarUrl, cidade, criadoEm }: PerfilHeaderProps) {
  const inicial = nome.charAt(0).toUpperCase()
  const membroDesde = new Date(criadoEm).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })

  return (
    <div className="bg-linear-to-b from-acc-bg to-transparent rounded-t-2xl px-5 pt-7 pb-5 text-center border border-border">
      <div className="w-16 h-16 rounded-full bg-accent text-white text-2xl font-bold flex items-center justify-center mx-auto mb-3">
        {avatarUrl
          ? <Image src={avatarUrl} alt={nome} width={64} height={64} unoptimized className="w-full h-full rounded-full object-cover" />
          : inicial}
      </div>
      <p className="text-lg font-bold text-fg">{nome}</p>
      <p className="text-xs text-fg-3 mt-0.5">
        Membro desde {membroDesde}{cidade ? ` · ${cidade}` : ''}
      </p>
    </div>
  )
}
