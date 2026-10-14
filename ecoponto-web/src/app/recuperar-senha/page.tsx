import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata = {
  title: 'Recuperar Senha | Ecoponto Certo',
  description: 'Recuperação de acesso à conta do Ecoponto Certo',
}

export default function RecuperarSenhaPage() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-border/40 p-6 sm:p-8 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto text-xl">
          🔑
        </div>
        <h1 className="text-xl font-bold text-foreground">Recuperação de Senha</h1>
        <p className="text-sm text-muted-foreground">
          A recuperação de senha é gerenciada pelo serviço de autenticação. Por favor, verifique seu e-mail cadastrado ou entre em contato com o administrador do sistema.
        </p>

        <div className="pt-4">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm font-medium text-emerald-600 hover:text-emerald-700 hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para o Login
          </Link>
        </div>
      </div>
    </div>
  )
}
