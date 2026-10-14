import Link from "next/link";
import { MapPin } from "lucide-react";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-bg flex items-center justify-center px-4">
      <div className="flex flex-col items-center gap-5 text-center max-w-sm">

        <div className="w-16 h-16 bg-white rounded-2xl border border-border flex items-center justify-center text-border">
          <MapPin size={28} />
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-fg-3">Erro 404</p>
          <h1 className="text-xl font-semibold text-fg">Página não encontrada</h1>
          <p className="text-sm text-fg-3 leading-relaxed">
            O endereço que você acessou não existe ou foi removido.
          </p>
        </div>

        <div className="flex gap-3">
          <Link
            href="/"
            className="px-4 py-2.5 bg-accent hover:bg-[#0b8048] text-white text-sm font-medium rounded-lg transition-colors"
          >
            Ver o mapa
          </Link>
          <Link
            href="/perfil"
            className="px-4 py-2.5 border border-border hover:bg-white text-fg-2 text-sm font-medium rounded-lg transition-colors"
          >
            Perfil
          </Link>
        </div>

      </div>
    </main>
  );
}
