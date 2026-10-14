import Link from 'next/link'

import { LocationFields } from '@/features/location/components/LocationFields'
import { REGISTRO_CONFIG } from '@/features/registro/config'
import type { RegistroFormViewProps } from '@/features/registro/types'

export function RegistroForm({
  tipo,
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
}: RegistroFormViewProps) {
  const fields = REGISTRO_CONFIG.campos[tipo]

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      {fields.map(({ label, type, placeholder, key }) => (
        <div key={key} className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-fg-2">{label}</label>
          <input
            required
            type={type}
            placeholder={placeholder}
            value={campos[key] ?? ''}
            onChange={(event) => setCampo(key, event.target.value)}
            minLength={type === 'password' ? 8 : undefined}
            className="w-full bg-raised border border-border rounded-lg px-3 py-2.5 text-sm text-fg placeholder:text-fg-3 focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
      ))}

      <LocationFields estado={estado} cidade={cidade} onChange={setLocalizacao} />

      {tipo === 'emp' && (
        <>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-fg-2">Tipo de atuação</label>
            <select
              required
              value={tipoAtuacao}
              onChange={(event) => setTipoAtuacao(event.target.value)}
              className="w-full bg-raised border border-border rounded-lg px-3 py-2.5 text-sm text-fg focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="" disabled>Selecione...</option>
              {REGISTRO_CONFIG.tiposAtuacao.map((opcao) => (
                <option key={opcao} value={opcao}>{opcao}</option>
              ))}
            </select>
          </div>

          {erro && <p role="alert" className="text-sm text-red-600 bg-red-100 rounded-lg px-3 py-2">{erro}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent hover:bg-[#0b8048] disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg transition-colors"
          >
            {loading ? 'Criando conta...' : 'Criar conta empresarial'}
          </button>
          <p className="text-xs text-center text-fg-3">Conta empresarial passa por verificação em até 24h</p>
        </>
      )}

      {tipo === 'fp' && (
        <>
          {erro && <p role="alert" className="text-sm text-red-600 bg-red-100 rounded-lg px-3 py-2">{erro}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent hover:bg-[#0b8048] disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg transition-colors"
          >
            {loading ? 'Criando conta...' : 'Criar conta'}
          </button>
        </>
      )}

      <p className="text-sm text-center text-fg-3">
        Já tem conta?{' '}
        <Link href="/login" className="text-accent font-semibold hover:underline">
          Entrar
        </Link>
      </p>
    </form>
  )
}
