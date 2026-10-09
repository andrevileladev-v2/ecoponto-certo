import AppShell from "@/components/layout/AppShell";
import Link from "next/link";
import { Recycle, MapPin, Users, ShieldCheck } from "lucide-react";

export default function SobrePage() {
  return (
    <AppShell>
      <div className="max-w-2xl mx-auto flex flex-col gap-10 py-4">

        {/* Hero */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-acc-bg rounded-xl flex items-center justify-center text-accent">
              <Recycle size={20} />
            </div>
            <h1 className="text-2xl font-semibold text-fg">Ecoponto Certo</h1>
          </div>
          <p className="text-fg-2 leading-relaxed">
            Plataforma colaborativa para mapear e validar pontos de coleta seletiva no Brasil.
            Qualquer pessoa pode consultar onde descartar vidro, papel, plástico, eletrônicos e outros
            resíduos — e contribuir mantendo as informações atualizadas.
          </p>
        </div>

        {/* Como funciona */}
        <div className="flex flex-col gap-4">
          <h2 className="text-base font-semibold text-fg">Como funciona</h2>
          <div className="flex flex-col gap-3">

            <div className="flex gap-4 p-4 bg-white rounded-xl border border-border">
              <div className="w-9 h-9 bg-acc-bg rounded-lg flex items-center justify-center text-accent shrink-0">
                <MapPin size={18} />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium text-fg">Encontre pontos no mapa</span>
                <span className="text-sm text-fg-3">
                  Veja ecopontos próximos, filtre por tipo de resíduo e confira endereço, horário e materiais aceitos.
                </span>
              </div>
            </div>

            <div className="flex gap-4 p-4 bg-white rounded-xl border border-border">
              <div className="w-9 h-9 bg-acc-bg rounded-lg flex items-center justify-center text-accent shrink-0">
                <Users size={18} />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium text-fg">Comunidade valida os dados</span>
                <span className="text-sm text-fg-3">
                  Usuários confirmam ou contestam cada ponto. Quanto mais confirmações, maior a confiabilidade exibida no mapa.
                </span>
              </div>
            </div>

            <div className="flex gap-4 p-4 bg-white rounded-xl border border-border">
              <div className="w-9 h-9 bg-acc-bg rounded-lg flex items-center justify-center text-accent shrink-0">
                <ShieldCheck size={18} />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium text-fg">Informação confiável</span>
                <span className="text-sm text-fg-3">
                  O índice de confiabilidade combina votos da comunidade, data da última verificação e histórico de denúncias.
                </span>
              </div>
            </div>

          </div>
        </div>

        {/* Projeto */}
        <div className="flex flex-col gap-3 p-5 bg-white rounded-xl border border-border">
          <h2 className="text-base font-semibold text-fg">Projeto CS50</h2>
          <p className="text-sm text-fg-2 leading-relaxed">
            O Ecoponto Certo foi desenvolvido como projeto final do CS50 — Introduction to Computer Science de Harvard.
            O objetivo foi construir uma aplicação full-stack real com impacto local, combinando dados
            geoespaciais, autenticação e colaboração em comunidade.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            {["Next.js", "TypeScript", "Fastify", "Prisma", "Supabase", "MapLibre GL", "OpenFreeMap"].map((tech) => (
              <span
                key={tech}
                className="text-xs font-medium px-2.5 py-1 bg-bg text-fg-2 rounded-full border border-border"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/"
            className="flex-1 bg-accent hover:bg-[#0b8048] text-white text-sm font-medium py-2.5 rounded-lg text-center transition-colors"
          >
            Ver o mapa
          </Link>
          <Link
            href="/registro"
            className="flex-1 border border-border hover:bg-raised text-fg-2 text-sm font-medium py-2.5 rounded-lg text-center transition-colors"
          >
            Criar conta
          </Link>
        </div>

      </div>
    </AppShell>
  );
}
