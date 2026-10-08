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

export default function PontoPage() {
  const { id } = useParams<{ id: string }>();
  const [ponto, setPonto] = useState<any>(null);
  const [aba, setAba] = useState<Aba>('info');
  const [itens, setItens] = useState<any[]>([]);
  const [msgs, setMsgs] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const cor = ponto ? relCor(ponto.confiabilidade) : '#DC2626';

  useEffect(() => {
    api.get('/pontos/' + id).then((p: any) => {
      if (p) {
        setPonto(p);
        console.log('residuos:', JSON.stringify(p.residuos))
        setItens(p.residuos?.map((r: any) => ({
          nome: r.nome ?? r,
          cor: RES_COR[r.tipo ?? r] ?? '#0D9858',
          aceita: true, votos: 0, conf: 0,
        })) ?? []);
      }
    });
  }, [id]);

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

        <Link href="/mapa" className="flex items-center gap-1.5 text-sm text-[#7A9480] hover:text-[#0D9858] transition-colors w-fit">
          <ChevronLeft size={16} /> Voltar ao mapa
        </Link>

        {/* Header do ponto */}
        <div className="bg-white rounded-t-xl border border-[#D4DAD4] px-4 py-4 flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-base font-bold text-[#0F1C12]">{ponto?.nome}</h1>
              <p className="text-xs text-[#7A9480] mt-0.5">{ponto?.bairro} · {ponto?.cidade}</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#E8F5ED] text-[#0D9858] shrink-0">Ativo</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-[#EFF2EF] rounded-full overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${ponto?.confiabilidade * 100}%`, backgroundColor: cor }} />
            </div>
            <span className="text-xs font-semibold shrink-0" style={{ color: cor }}>
              {Math.round(ponto?.confiabilidade * 100)}% confiável · 234 confirmações
            </span>
          </div>
          <div className="flex flex-wrap gap-3 text-xs text-[#3D5444]">
            <span className="flex items-center gap-1"><Clock size={12} className="text-[#7A9480]" />{ponto?.horario}</span>
            {ponto?.noturno && <span className="flex items-center gap-1 text-[#7A9480]"><Moon size={12} />Acesso noturno</span>}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex bg-white border-x border-[#D4DAD4] -mt-4">
          {([['info', 'Informações'], ['aceita', 'Aceita'], ['chat', 'Chat 3']] as [Aba, string][]).map(([tabId, label]) => (
            <button
              key={tabId}
              onClick={() => setAba(tabId)}
              className={`flex-1 py-3 text-xs font-semibold border-b-2 transition-colors ${
                aba === tabId ? 'border-[#0D9858] text-[#0D9858]' : 'border-transparent text-[#7A9480] hover:text-[#3D5444]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Pane: Informações */}
        {aba === 'info' && (
          <div className="bg-white border border-[#D4DAD4] -mt-4 rounded-b-xl flex flex-col divide-y divide-[#D4DAD4]">
            <div className="px-4 py-3 flex flex-wrap gap-2">
            {ponto?.residuos?.map((r: any, i: number) => {
              const tipo = typeof r === 'string' ? r : (r.tipo ?? r.nome ?? '');
              const nome = typeof r === 'string' ? r : (r.nome ?? r.tipo ?? '');
              return (
                <span key={i} className="text-xs px-2.5 py-1 rounded-full font-semibold"
                  style={{ backgroundColor: `${RES_COR[tipo]}18`, color: RES_COR[tipo] }}>
                  {nome}
                </span>
              );
            })}
            </div>
            <div className="px-4 py-3">
              <div className="rounded-xl p-3 bg-[#FEF3C7] border-l-4 border-[#D97706]">
                <p className="text-xs font-bold text-[#D97706] mb-1">⚠ Atenção</p>
                <p className="text-xs text-[#3D5444]">Não vá à noite. Confirme o horário antes de sair de casa.</p>
              </div>
            </div>
            <div className="px-4 py-3">
              <p className="text-xs font-bold tracking-widest text-[#7A9480] mb-2">ESTE LOCAL AINDA FUNCIONA?</p>
              <div className="grid grid-cols-2 gap-2">
                <button className="py-2.5 rounded-lg text-xs font-semibold bg-[#E8F5ED] text-[#0D9858] hover:bg-[#0D9858] hover:text-white transition-colors">
                  ✓ Sim, funcionando
                </button>
                <button className="py-2.5 rounded-lg text-xs font-semibold bg-[#FEE2E2] text-[#DC2626] hover:bg-[#DC2626] hover:text-white transition-colors">
                  ✕ Parece fechado
                </button>
              </div>
            </div>
            <div className="px-4 py-3 flex flex-col gap-2">
              <p className="text-xs font-bold tracking-widest text-[#7A9480]">O QUE VOCÊ TROUXE HOJE?</p>
              <div className="flex flex-wrap gap-2">
                {["📦 Papelão","🧴 Plástico","🥫 Metal","📱 Eletrônicos","🍳 Óleo"].map(item => (
                  <button key={item} className="text-xs px-3 py-1.5 rounded-full border border-[#D4DAD4] hover:border-[#0D9858] hover:text-[#0D9858] hover:bg-[#E8F5ED] transition-colors font-medium">
                    {item}
                  </button>
                ))}
              </div>
              <button className="w-full py-2.5 bg-[#0D9858] hover:bg-[#0b8048] text-white text-sm font-semibold rounded-lg transition-colors mt-1">
                Registrar entrega
              </button>
            </div>
            <div className="px-4 py-3 flex gap-2">
              <button className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-[#D4DAD4] hover:bg-[#F7F8F7] text-[#3D5444] text-xs font-semibold rounded-lg transition-colors">
                <ThumbsUp size={13} /> Confirmar ponto
              </button>
              <button className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-[#D4DAD4] hover:bg-[#F7F8F7] text-[#3D5444] text-xs font-semibold rounded-lg transition-colors">
                <ThumbsDown size={13} /> Contestar
              </button>
            </div>
            <div className="px-4 py-3">
              <button className="flex items-center gap-1.5 text-xs text-[#7A9480] hover:text-[#DC2626] transition-colors">
                <Flag size={11} /> Denunciar informação incorreta
              </button>
            </div>
          </div>
        )}

        {/* Pane: Aceita */}
        {aba === 'aceita' && (
          <div className="bg-white border border-[#D4DAD4] -mt-4 rounded-b-xl overflow-hidden">
            <div className="px-4 py-2 bg-[#F7F8F7] border-b border-[#D4DAD4]">
              <p className="text-xs text-[#7A9480]">Mantido pela comunidade. Vote para confirmar ou contestar cada item.</p>
            </div>
            <div className="divide-y divide-[#D4DAD4]">
              {itens.map((item, i) => {
                const pct = item.votos > 0 ? Math.round(item.conf / item.votos * 100) : 0;
                const cor = item.aceita ? "#0D9858" : "#DC2626";
                const label = item.aceita ? "Aceita" : "Não aceita";
                return (
                  <div key={item.nome} className="flex items-center gap-3 px-4 py-3">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.cor }} />
                    <span className="flex-1 text-sm font-medium text-[#0F1C12]">{item.nome}</span>
                    <span className="text-xs font-semibold" style={{ color: cor }}>{label}</span>
                    <div className="flex gap-1.5 shrink-0">
                      <button onClick={() => votar(i, true)} className="px-2 py-1 rounded text-xs font-bold bg-[#E8F5ED] text-[#0D9858] hover:bg-[#0D9858] hover:text-white transition-colors">✓</button>
                      <button onClick={() => votar(i, false)} className="px-2 py-1 rounded text-xs font-bold bg-[#FEE2E2] text-[#DC2626] hover:bg-[#DC2626] hover:text-white transition-colors">✕</button>
                    </div>
                    <span className="text-xs text-[#7A9480] w-16 text-right shrink-0">{pct}% · {item.votos}</span>
                  </div>
                );
              })}
            </div>
            <div className="px-4 py-3 border-t border-[#D4DAD4]">
              <button className="w-full py-2 border border-[#D4DAD4] rounded-lg text-xs font-semibold text-[#3D5444] hover:bg-[#F7F8F7] transition-colors">
                + Sugerir novo tipo de resíduo
              </button>
            </div>
          </div>
        )}

        {/* Pane: Chat */}
        {aba === 'chat' && (
          <div className="bg-white border border-[#D4DAD4] -mt-4 rounded-b-xl flex flex-col" style={{ minHeight: 400 }}>
            <div className="px-4 py-2 bg-[#F7F8F7] border-b border-[#D4DAD4]">
              <p className="text-xs text-[#7A9480]">💬 Chat anônimo · Apenas sobre este local</p>
            </div>
            {/* Quick chips */}
            <div className="flex gap-2 px-3 py-2 overflow-x-auto border-b border-[#D4DAD4]" style={{ scrollbarWidth: 'none' }}>
              {["✓ Funcionando", "🚫 Estava fechado", "♻ Aceitou sem problema", "⚠ Fila grande", "🕐 Horário diferente"].map(chip => (
                <button
                  key={chip}
                  onClick={() => setInput(chip)}
                  className="text-xs px-3 py-1.5 rounded-full border border-[#D4DAD4] bg-[#F7F8F7] hover:border-[#0D9858] hover:text-[#0D9858] whitespace-nowrap shrink-0 transition-colors"
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
                    m.proprio ? 'bg-[#E8F5ED] text-[#0D9858] rounded-br-sm' : 'bg-[#F7F8F7] text-[#0F1C12] rounded-bl-sm'
                  }`}>
                    {m.texto}
                  </div>
                  <span className="text-xs text-[#7A9480] mt-0.5">{m.hora}</span>
                </div>
              ))}
            </div>
            {/* Input */}
            <div className="flex gap-2 px-3 py-3 border-t border-[#D4DAD4]">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && enviar()}
                placeholder="Algo sobre este local..."
                maxLength={120}
                className="flex-1 bg-[#F7F8F7] border border-[#D4DAD4] rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#0D9858]"
              />
              <button onClick={enviar} className="px-3 py-2 bg-[#0D9858] hover:bg-[#0b8048] text-white rounded-lg transition-colors">
                <Send size={14} />
              </button>
              <button title="Denunciar" className="text-lg text-[#7A9480] hover:text-[#DC2626]">🚩</button>
            </div>
          </div>
        )}

      </div>
    </AppShell>
  );
}
