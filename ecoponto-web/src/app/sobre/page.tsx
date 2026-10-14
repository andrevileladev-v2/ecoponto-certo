import {
  ArrowDownRight,
  ArrowUpRight,
  Code2,
  Heart,
  Lightbulb,
  Recycle,
  Users,
} from 'lucide-react'
import Link from 'next/link'

import AppShell from '@/components/layout/AppShell'

const repositoryUrl = 'https://github.com/andrevileladev-v2/ecoponto-certo'

const projectFacts = [
  {
    label: 'Missão',
    text: 'Tornar o descarte correto acessível para todos.',
    className: 'bg-acc-bg',
    labelClassName: 'text-accent',
  },
  {
    label: 'Dados',
    text: 'Fontes abertas e colaboração da comunidade.',
    className: 'bg-raised',
    labelClassName: 'text-fg-3',
  },
  {
    label: 'Código',
    text: 'Open source · TypeScript · MIT.',
    className: 'bg-raised',
    labelClassName: 'text-fg-3',
  },
]

export default function SobrePage() {
  return (
    <AppShell>
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-7 py-2 sm:gap-8 sm:py-4">
        <section className="px-3 py-7 text-center sm:px-8 sm:py-10">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-acc-bg text-accent shadow-sm">
            <Recycle size={34} strokeWidth={2.2} />
          </div>
          <h1 className="text-[clamp(1.5rem,5vw,2.125rem)] font-bold leading-tight text-fg">
            Ecoponto Certo
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-fg-2 sm:text-base">
            Mapeamento colaborativo e inteligente de pontos de coleta seletiva.
            Criado pela comunidade, para a comunidade.
          </p>
          <span className="mt-4 inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-xs font-semibold text-blue-700">
            🎓 Projeto Final — Harvard CS50x 2026
          </span>
        </section>

        <section className="rounded-2xl border border-border bg-white p-5 shadow-sm sm:p-6">
          <h2 className="mb-3 text-lg font-bold text-fg">Sobre o projeto</h2>
          <p className="text-sm leading-7 text-fg-2">
            O Ecoponto Certo nasceu da frustração de não saber onde descartar
            corretamente óleo de cozinha, pilhas velhas e eletrônicos. As
            informações existem, mas muitas vezes estão espalhadas e
            desatualizadas.
          </p>
          <p id="privacidade" className="mt-3 scroll-mt-6 text-sm leading-7 text-fg-2">
            É um projeto independente, sem fins lucrativos e sem vínculos
            comerciais. Não vendemos dados, não exibimos anúncios e não
            recebemos nada por indicar pontos de coleta.
          </p>
          <div className="mt-5 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
            {projectFacts.map((fact) => (
              <div key={fact.label} className={`rounded-xl p-4 text-center ${fact.className}`}>
                <p className={`mb-1 text-[10px] font-bold tracking-wide ${fact.labelClassName}`}>
                  {fact.label}
                </p>
                <p className="text-xs leading-5 text-fg-2">{fact.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="contribuir" className="scroll-mt-6">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-fg">Quer contribuir?</h2>
            <p className="mt-1 text-sm text-fg-3">
              O projeto existe porque pessoas se importam com o meio ambiente.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <article className="flex flex-col rounded-2xl border border-border bg-white p-5 shadow-sm">
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-raised text-fg">
                <Code2 size={23} />
              </div>
              <h3 className="text-sm font-bold text-fg">Sou desenvolvedor</h3>
              <p className="mt-2 flex-1 text-sm leading-6 text-fg-2">
                Veja as issues abertas, faça um fork e envie um PR. A stack usa
                Next.js, Fastify e TypeScript.
              </p>
              <a
                href={repositoryUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-semibold text-fg transition-colors hover:bg-raised"
              >
                <Code2 size={15} /> Ver no GitHub <ArrowUpRight size={14} />
              </a>
            </article>

            <article className="flex flex-col rounded-2xl border border-border bg-white p-5 shadow-sm">
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-acc-bg text-accent">
                <Heart size={23} />
              </div>
              <h3 className="text-sm font-bold text-fg">Quero fazer uma doação</h3>
              <p className="mt-2 flex-1 text-sm leading-6 text-fg-2">
                Usamos serviços gratuitos e qualquer apoio ajuda o projeto a
                continuar ativo e crescer.
              </p>
              <span className="mt-4 inline-flex min-h-10 items-center justify-center rounded-lg bg-raised px-3 py-2 text-xs font-semibold text-fg-3">
                Doações via Pix em breve
              </span>
            </article>

            <article className="flex flex-col rounded-2xl border border-border bg-white p-5 shadow-sm">
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                <Lightbulb size={23} />
              </div>
              <h3 className="text-sm font-bold text-fg">Tenho uma ideia</h3>
              <p className="mt-2 flex-1 text-sm leading-6 text-fg-2">
                Tem uma dica de reciclagem, ideia de melhoria ou feedback?
                Envie uma sugestão para o projeto.
              </p>
              <a
                href="/sugestoes"
                className="mt-4 inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-semibold text-fg transition-colors hover:bg-raised"
              >
                Enviar sugestão <ArrowUpRight size={14} />
              </a>
            </article>
          </div>
        </section>

        <section id="b2b" className="scroll-mt-6 overflow-hidden rounded-2xl bg-[#10251A] p-6 text-white shadow-sm sm:p-8">
          <div className="mb-2 inline-flex items-center gap-2 text-[10px] font-bold tracking-[0.12em] text-green-400">
            <Users size={14} /> PARA EMPRESAS
          </div>
          <h2 className="text-xl font-bold">Compra ou coleta recicláveis?</h2>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-white/75">
            Se sua empresa compra ou resgata materiais recicláveis, o Ecoponto
            Certo ajuda a encontrar onde eles são gerados, acompanhar volumes
            por região e tipo e se conectar com cooperativas locais.
          </p>
          <Link
            href="/registro"
            className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-green-500 px-4 py-2.5 text-sm font-bold text-[#10251A] transition-colors hover:bg-green-400"
          >
            Criar conta empresarial <ArrowDownRight size={16} />
          </Link>
        </section>

      </div>
    </AppShell>
  )
}
