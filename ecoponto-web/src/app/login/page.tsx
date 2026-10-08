'use client'
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Recycle } from "lucide-react"
import { useAuth } from "@/lib/auth"

export default function LoginPage() {
  const { login } = useAuth()
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    setLoading(true)
    try {
      await login(email, senha)
      router.push('/')
    } catch (err: any) {
      setErro(err.message ?? 'Erro ao entrar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#EFF2EF] flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm p-8 mt-5 mb-5 flex flex-col gap-5">

        {/* Logo */}
        <div className="flex flex-col items-center gap-1 text-center">
          <div className="text-4xl text-[#0D9858]"><Recycle /></div>
          <h1 className="text-xl font-semibold text-[#0F1C12]">Ecoponto Certo</h1>
          <p className="text-sm text-[#7A9480]">Mapeamento colaborativo de coleta seletiva</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-[#3D5444]">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
              className="w-full border border-[#D4DAD4] rounded-lg px-3 py-2 text-sm text-[#0F1C12] placeholder:text-[#7A9480] focus:outline-none focus:ring-2 focus:ring-[#0D9858]"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-[#3D5444]">Senha</label>
            <input
              type="password"
              value={senha}
              onChange={e => setSenha(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full border border-[#D4DAD4] rounded-lg px-3 py-2 text-sm text-[#0F1C12] placeholder:text-[#7A9480] focus:outline-none focus:ring-2 focus:ring-[#0D9858]"
            />
            <Link href="/recuperar-senha" className="text-xs text-[#0D9858] self-end mt-1 hover:underline">
              Esqueceu a senha?
            </Link>
          </div>

          {erro && (
            <p className="text-sm text-[#DC2626] bg-[#FEE2E2] rounded-lg px-3 py-2">{erro}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#0D9858] hover:bg-[#0b8048] disabled:opacity-60 text-white font-medium py-2.5 rounded-lg transition-colors"
          >
            {loading ? 'Entrando…' : 'Entrar'}
          </button>
        </form>

        <p className="text-sm text-center text-[#7A9480]">
          Sem conta?{" "}
          <Link href="/registro" className="text-[#0D9858] font-medium hover:underline">
            Criar conta
          </Link>
        </p>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-[#D4DAD4]" />
          <span className="text-xs text-[#7A9480]">ou continue com</span>
          <div className="flex-1 h-px bg-[#D4DAD4]" />
        </div>

        <button className="w-full border border-[#D4DAD4] rounded-lg py-2 text-sm font-medium text-[#3D5444] hover:bg-[#F7F8F7] transition-colors">
          Google
        </button>

        <p className="text-xs text-center text-[#7A9480] leading-relaxed">
          Sem conta você ainda pode ver o mapa e os pontos. A conta permite confirmar locais e registrar entregas.
        </p>

        <Link href="/" className="text-xs text-center text-[#7A9480] font-medium hover:underline">
          Entrar sem conta
        </Link>
      </div>
    </main>
  )
}
