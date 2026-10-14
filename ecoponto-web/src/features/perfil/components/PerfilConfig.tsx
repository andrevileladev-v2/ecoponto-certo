'use client'

import { LogOut, Save, Trash2 } from 'lucide-react'
import { FormEvent, useState } from 'react'

import { LocationFields } from '@/features/location/components/LocationFields'
import type { PerfilConfigProps } from '@/features/perfil/types'
import { api } from '@/lib/api'
import type { Usuario } from '@/lib/auth'

export function PerfilConfig({ user, onUpdated, onLogout }: PerfilConfigProps) {
  const [nome, setNome] = useState(user.nome)
  const [email, setEmail] = useState(user.email)
  const [cidade, setCidade] = useState(user.cidade ?? '')
  const [estado, setEstado] = useState(user.estado ?? '')
  const [avatarUrl, setAvatarUrl] = useState(user.avatar_url ?? '')
  const [mostrarNoDashboard, setMostrarNoDashboard] = useState(user.mostrar_no_dashboard)
  const [senhaAtual, setSenhaAtual] = useState('')
  const [senhaNova, setSenhaNova] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setSuccess('')

    if (senhaNova && senhaNova !== confirmarSenha) {
      setError('A confirmação da senha não corresponde.')
      return
    }

    setSaving(true)
    try {
      const payload: {
        nome: string
        email: string
        cidade: string | null
        estado: string | null
        avatar_url: string | null
        mostrar_no_dashboard: boolean
        senha_atual?: string
        senha_nova?: string
      } = {
        nome,
        email,
        cidade: cidade || null,
        estado: estado || null,
        avatar_url: avatarUrl || null,
        mostrar_no_dashboard: mostrarNoDashboard,
      }
      if (senhaNova) {
        payload.senha_atual = senhaAtual || undefined
        payload.senha_nova = senhaNova
      }

      const updatedUser = await api.put<Usuario>('/usuarios/me', payload)
      onUpdated(updatedUser)
      setSenhaAtual('')
      setSenhaNova('')
      setConfirmarSenha('')
      setSuccess('Informações da conta atualizadas.')
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Não foi possível salvar as alterações.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-b-2xl border-x border-b border-border bg-white px-4 py-5">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <h2 className="text-base font-bold text-fg">Informações da conta</h2>

        <label className="flex flex-col gap-1.5 text-sm font-medium text-fg">
          Nome
          <input
            required
            maxLength={100}
            value={nome}
            onChange={(event) => setNome(event.target.value)}
            className="rounded-lg border border-border px-3 py-2.5 font-normal outline-none focus:border-accent"
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm font-medium text-fg">
          E-mail
          <input
            required
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="rounded-lg border border-border px-3 py-2.5 font-normal outline-none focus:border-accent"
          />
        </label>

        <LocationFields
          estado={estado}
          cidade={cidade}
          onChange={(next) => {
            setEstado(next.estado)
            setCidade(next.cidade)
          }}
        />

        <label className="flex flex-col gap-1.5 text-sm font-medium text-fg">
          Foto de perfil
          <input
            type="url"
            placeholder="https://..."
            value={avatarUrl}
            onChange={(event) => setAvatarUrl(event.target.value)}
            className="rounded-lg border border-border px-3 py-2.5 font-normal outline-none focus:border-accent"
          />
          <span className="text-xs font-normal text-fg-3">Cole o endereço da imagem que deseja usar.</span>
        </label>

        <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3">
          <input
            type="checkbox"
            checked={mostrarNoDashboard}
            onChange={(event) => setMostrarNoDashboard(event.target.checked)}
            className="mt-0.5 size-4 accent-accent"
          />
          <span>
            <span className="block text-sm font-medium text-fg">Mostrar meu nome no ranking do dashboard</span>
            <span className="mt-1 block text-xs font-normal text-fg-3">
              Se desmarcar, suas entregas continuam contando nas estatísticas, mas você não aparecerá entre os participantes.
            </span>
          </span>
        </label>

        <div className="border-t border-border pt-4">
          <h3 className="text-sm font-bold text-fg">Alterar senha</h3>
          <p className="mt-1 text-xs text-fg-3">Deixe em branco se não quiser trocar a senha.</p>
          <div className="mt-3 flex flex-col gap-3">
            <label className="flex flex-col gap-1.5 text-sm font-medium text-fg">
              Senha atual
              <input
                type="password"
                autoComplete="current-password"
                value={senhaAtual}
                onChange={(event) => setSenhaAtual(event.target.value)}
                className="rounded-lg border border-border px-3 py-2.5 font-normal outline-none focus:border-accent"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium text-fg">
              Nova senha
              <input
                type="password"
                minLength={8}
                autoComplete="new-password"
                value={senhaNova}
                onChange={(event) => setSenhaNova(event.target.value)}
                className="rounded-lg border border-border px-3 py-2.5 font-normal outline-none focus:border-accent"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium text-fg">
              Confirmar nova senha
              <input
                type="password"
                minLength={8}
                autoComplete="new-password"
                value={confirmarSenha}
                onChange={(event) => setConfirmarSenha(event.target.value)}
                className="rounded-lg border border-border px-3 py-2.5 font-normal outline-none focus:border-accent"
              />
            </label>
          </div>
        </div>

        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        {success && <p role="status" className="text-sm text-accent">{success}</p>}

        <button
          type="submit"
          disabled={saving}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent py-2.5 text-sm font-semibold text-white transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Save size={15} /> {saving ? 'Salvando...' : 'Salvar alterações'}
        </button>
      </form>

      <div className="mt-5 flex flex-col gap-2 border-t border-border pt-4">
        <button
          type="button"
          onClick={onLogout}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-100 py-2.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-600 hover:text-white"
        >
          <LogOut size={15} /> Sair da conta
        </button>
        <button
          type="button"
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-border py-2.5 text-sm font-semibold text-fg-3 transition-colors hover:bg-raised"
        >
          <Trash2 size={15} /> Excluir conta
        </button>
      </div>
    </div>
  )
}
