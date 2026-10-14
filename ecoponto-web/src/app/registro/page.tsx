'use client'

import Link from 'next/link'

import { RegistroForm } from '@/features/registro/components/RegistroForm'
import { RegistroStepSelector } from '@/features/registro/components/RegistroStepSelector'
import { useRegistroForm } from '@/features/registro/useRegistroForm'

export default function RegistroPage() {
  const {
    tipo,
    setTipo,
    campos,
    setCampo,
    estado,
    cidade,
    setLocalizacao,
    tipoAtuacao,
    setTipoAtuacao,
    erro,
    loading,
    onSubmit,
  } = useRegistroForm()

  return (
    <main className="min-h-screen bg-bg flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm flex flex-col gap-5">
        <div className="flex flex-col gap-1">
          <div className="text-sm text-fg-3">
            ← <Link href="/login" className="text-accent">Voltar</Link>
          </div>
          <h2 className="text-xl font-semibold text-fg">Criar conta</h2>
          <p className="text-sm text-fg-3">Como você vai usar o Ecoponto Certo?</p>
        </div>

        <RegistroStepSelector tipo={tipo} onTipoChange={setTipo} />
        <RegistroForm
          tipo={tipo}
          campos={campos}
          setCampo={setCampo}
          estado={estado}
          cidade={cidade}
          setLocalizacao={setLocalizacao}
          tipoAtuacao={tipoAtuacao}
          setTipoAtuacao={setTipoAtuacao}
          erro={erro}
          loading={loading}
          onSubmit={onSubmit}
        />
      </div>
    </main>
  )
}
