'use client'
import AppShell from "@/components/layout/AppShell";
import Link from "next/link";
import { useState, useEffect } from "react";
import { ChevronLeft, Clock, Moon, ThumbsUp, ThumbsDown, Flag, Send } from "lucide-react";
import { useParams } from 'next/navigation';
import { api } from "@/lib/api";

const RES_COR: Record<string, string> = {
  vidro: "#2563EB", papel: "#0891B2", plástico: "#DC2626",
  metal: "#D97706", eletrônico: "#7C3AED", óleo: "#EA580C",
  bateria: "#DB2777", tetra: "#059669",
};

function relCor(s: number) {
  if (s >= 0.8) return "#0D9858";
  if (s >= 0.65) return "#D97706";
  return "#DC2626";
}

type Aba = 'info' | 'aceita' | 'chat';
type ResiduoPonto = { nome: string; cor: string; tipo?: string };
type PontoResiduo = { residuo?: ResiduoPonto; confirmacoes?: number };
type PontoDetalhe = {
  nome: string;
  bairro?: string;
  cidade?: string;
  confiabilidade: number;
  horario?: string;
  noturno?: boolean;
  residuos?: PontoResiduo[];
};
type ItemAceito = { nome: string; cor: string; aceita: boolean; votos: number; conf: number };
type Mensagem = { texto: string; hora: string; proprio: boolean };

export default function PontoPage() {
  const { id } = useParams<{ id: string }>();
  const [ponto, setPonto] = useState<PontoDetalhe | null>(null);
  const [aba, setAba] = useState<Aba>('info');
  const [itens, setItens] = useState<ItemAceito[]>([]);
  const [msgs, setMsgs] = useState<Mensagem[]>([]);
  const [input, setInput] = useState('');
  const confiabilidade = ponto?.confiabilidade ?? 0;
  const cor = relCor(confiabilidade);

  useEffect(() => {
  let isMounted = true

  async function loadPonto() {
    try {
      // Faz a busca usando o ID real recebido via props/params
      const p = await api.get<PontoDetalhe>(`/pontos/${id}`)
      
      if (p && isMounted) {
        setPonto(p)

        const itensMapeados = p.residuos?.map((item) => {
          const residuoData = item.residuo
          const nome = residuoData?.nome ?? 'Resíduo'
          const tipo = residuoData?.tipo ?? nome.toLowerCase()
          return {
            nome,
            cor: residuoData?.cor ?? RES_COR[tipo] ?? '#0D9858',
            aceita: true,
            votos: item.confirmacoes ?? 0,
            conf: item.confirmacoes ?? 0,
          }
        }) ?? []

        setItens(itensMapeados)
      }
    } catch (err) {
      console.error('Erro ao carregar o ponto:', err)
    }
  }

  if (id) {
    loadPonto()
  }

  return () => {
    isMounted = false // Evita setPonto em componente desmontado
  }
}, [id])

  function votar(i: number, sim: boolean) {
    setItens(prev => prev.map((item, idx) => {
      if (idx !== i) return item;
      const votos = item.votos + 1;
      const conf  = sim ? item.conf + 1 : item.conf;
      const aceita = votos >= 5 ? conf / votos >= 0.6 : item.aceita;
      return { ...item, votos, conf, aceita };
    }));
  }

  function enviar() {
    if (!input.trim()) return;
    setMsgs(prev => [...prev, { texto: input.trim(), hora: "agora", proprio: true }]);
    setInput('');
  }

  return (
    <AppShell>
      <div className="max-w-lg mx-auto flex flex-col gap-4">

        <Link href="/" className="flex items-center gap-1.5 text-sm text-fg-3 hover:text-accent transition-colors w-fit">
          <ChevronLeft size={16} /> Voltar ao mapa
        </Link>

        {/* Header do ponto */}
        <div className="bg-white rounded-t-xl border border-border px-4 py-4 flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-base font-bold text-fg">{ponto?.nome}</h1>
              <p className="text-xs text-fg-3 mt-0.5">{ponto?.bairro} · {ponto?.cidade}</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-acc-bg text-accent shrink-0">Ativo</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-bg rounded-full overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${confiabilidade * 100}%`, backgroundColor: cor }} />
            </div>
            <span className="text-xs font-semibold shrink-0" style={{ color: cor }}>
              {Math.round(confiabilidade * 100)}% confiável · 234 confirmações
            </span>
          </div>
          <div className="flex flex-wrap gap-3 text-xs text-fg-2">
            <span className="flex items-center gap-1"><Clock size={12} className="text-fg-3" />{ponto?.horario}</span>
            {ponto?.noturno && <span className="flex items-center gap-1 text-fg-3"><Moon size={12} />Acesso noturno</span>}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex bg-white border-x border-border -mt-4">
          {([['info', 'Informações'], ['aceita', 'Aceita'], ['chat', 'Chat 3']] as [Aba, string][]).map(([tabId, label]) => (
            <button
              key={tabId}
              onClick={() => setAba(tabId)}
              className={`flex-1 py-3 text-xs font-semibold border-b-2 transition-colors ${
                aba === tabId ? 'border-accent text-accent' : 'border-transparent text-fg-3 hover:text-fg-2'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Pane: Informações */}
        {aba === 'info' && (
          <div className="bg-white border border-border -mt-4 rounded-b-xl flex flex-col divide-y divide-border">
            <div className="px-4 py-3 flex flex-wrap gap-2">
            {ponto?.residuos?.map((r, i) => {
              const residuo = r.residuo;
              const nome = residuo?.nome ?? 'Resíduo';
              const tipo = residuo?.tipo ?? nome.toLowerCase();
              const cor = residuo?.cor ?? RES_COR[tipo] ?? '#0D9858';
              return (
                <span key={i} className="text-xs px-2.5 py-1 rounded-full font-semibold"
                  style={{ backgroundColor: `${cor}18`, color: cor }}>
                  {nome}
                </span>
              );
            })}
            </div>
            <div className="px-4 py-3">
              <div className="rounded-xl p-3 bg-amber-100 border-l-4 border-amber-600">
                <p className="text-xs font-bold text-amber-600 mb-1">⚠ Atenção</p>
                <p className="text-xs text-fg-2">Não vá à noite. Confirme o horário antes de sair de casa.</p>
              </div>
            </div>
            <div className="px-4 py-3">
              <p className="text-xs font-bold tracking-widest text-fg-3 mb-2">ESTE LOCAL AINDA FUNCIONA?</p>
              <div className="grid grid-cols-2 gap-2">
                <button className="py-2.5 rounded-lg text-xs font-semibold bg-acc-bg text-accent hover:bg-accent hover:text-white transition-colors">
                  ✓ Sim, funcionando
                </button>
                <button className="py-2.5 rounded-lg text-xs font-semibold bg-red-100 text-red-600 hover:bg-red-600 hover:text-white transition-colors">
                  ✕ Parece fechado
                </button>
              </div>
            </div>
            <div className="px-4 py-3 flex flex-col gap-2">
              <p className="text-xs font-bold tracking-widest text-fg-3">O QUE VOCÊ TROUXE HOJE?</p>
              <div className="flex flex-wrap gap-2">
                {["📦 Papelão","🧴 Plástico","🥫 Metal","📱 Eletrônicos","🍳 Óleo"].map(item => (
                  <button key={item} className="text-xs px-3 py-1.5 rounded-full border border-border hover:border-accent hover:text-accent hover:bg-acc-bg transition-colors font-medium">
                    {item}
                  </button>
                ))}
              </div>
              <button className="w-full py-2.5 bg-accent hover:bg-[#0b8048] text-white text-sm font-semibold rounded-lg transition-colors mt-1">
                Registrar entrega
              </button>
            </div>
            <div className="px-4 py-3 flex gap-2">
              <button className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-border hover:bg-raised text-fg-2 text-xs font-semibold rounded-lg transition-colors">
                <ThumbsUp size={13} /> Confirmar ponto
              </button>
              <button className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-border hover:bg-raised text-fg-2 text-xs font-semibold rounded-lg transition-colors">
                <ThumbsDown size={13} /> Contestar
              </button>
            </div>
            <div className="px-4 py-3">
              <button className="flex items-center gap-1.5 text-xs text-fg-3 hover:text-red-600 transition-colors">
                <Flag size={11} /> Denunciar informação incorreta
              </button>
            </div>
          </div>
        )}

        {/* Pane: Aceita */}
        {aba === 'aceita' && (
          <div className="bg-white border border-border -mt-4 rounded-b-xl overflow-hidden">
            <div className="px-4 py-2 bg-raised border-b border-border">
              <p className="text-xs text-fg-3">Mantido pela comunidade. Vote para confirmar ou contestar cada item.</p>
            </div>
            <div className="divide-y divide-border">
              {itens.map((item, i) => {
                const pct = item.votos > 0 ? Math.round(item.conf / item.votos * 100) : 0;
                const cor = item.aceita ? "#0D9858" : "#DC2626";
                const label = item.aceita ? "Aceita" : "Não aceita";
                return (
                  <div key={item.nome} className="flex items-center gap-3 px-4 py-3">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.cor }} />
                    <span className="flex-1 text-sm font-medium text-fg">{item.nome}</span>
                    <span className="text-xs font-semibold" style={{ color: cor }}>{label}</span>
                    <div className="flex gap-1.5 shrink-0">
                      <button onClick={() => votar(i, true)} className="px-2 py-1 rounded text-xs font-bold bg-acc-bg text-accent hover:bg-accent hover:text-white transition-colors">✓</button>
                      <button onClick={() => votar(i, false)} className="px-2 py-1 rounded text-xs font-bold bg-red-100 text-red-600 hover:bg-red-600 hover:text-white transition-colors">✕</button>
                    </div>
                    <span className="text-xs text-fg-3 w-16 text-right shrink-0">{pct}% · {item.votos}</span>
                  </div>
                );
              })}
            </div>
            <div className="px-4 py-3 border-t border-border">
              <button className="w-full py-2 border border-border rounded-lg text-xs font-semibold text-fg-2 hover:bg-raised transition-colors">
                + Sugerir novo tipo de resíduo
              </button>
            </div>
          </div>
        )}

        {/* Pane: Chat */}
        {aba === 'chat' && (
          <div className="bg-white border border-border -mt-4 rounded-b-xl flex flex-col" style={{ minHeight: 400 }}>
            <div className="px-4 py-2 bg-raised border-b border-border">
              <p className="text-xs text-fg-3">💬 Chat anônimo · Apenas sobre este local</p>
            </div>
            {/* Quick chips */}
            <div className="flex gap-2 px-3 py-2 overflow-x-auto border-b border-border" style={{ scrollbarWidth: 'none' }}>
              {["✓ Funcionando", "🚫 Estava fechado", "♻ Aceitou sem problema", "⚠ Fila grande", "🕐 Horário diferente"].map(chip => (
                <button
                  key={chip}
                  onClick={() => setInput(chip)}
                  className="text-xs px-3 py-1.5 rounded-full border border-border bg-raised hover:border-accent hover:text-accent whitespace-nowrap shrink-0 transition-colors"
                >
                  {chip}
                </button>
              ))}
            </div>
            {/* Mensagens */}
            <div className="flex-1 flex flex-col gap-2 px-4 py-3 overflow-y-auto">
              {msgs.map((m, i) => (
                <div key={i} className={`flex flex-col ${m.proprio ? 'items-end' : 'items-start'}`}>
                  <div className={`max-w-[78%] px-3 py-2 rounded-xl text-xs leading-relaxed ${
                    m.proprio ? 'bg-acc-bg text-accent rounded-br-sm' : 'bg-raised text-fg rounded-bl-sm'
                  }`}>
                    {m.texto}
                  </div>
                  <span className="text-xs text-fg-3 mt-0.5">{m.hora}</span>
                </div>
              ))}
            </div>
            {/* Input */}
            <div className="flex gap-2 px-3 py-3 border-t border-border">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && enviar()}
                placeholder="Algo sobre este local..."
                maxLength={120}
                className="flex-1 bg-raised border border-border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-accent"
              />
              <button onClick={enviar} className="px-3 py-2 bg-accent hover:bg-[#0b8048] text-white rounded-lg transition-colors">
                <Send size={14} />
              </button>
              <button title="Denunciar" className="text-lg text-fg-3 hover:text-red-600">🚩</button>
            </div>
          </div>
        )}

      </div>
    </AppShell>
  );
}
