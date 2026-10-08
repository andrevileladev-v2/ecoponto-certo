'use client'
import AppShell from "@/components/layout/AppShell";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Eye, Trash2 } from "lucide-react";
import { api } from "@/lib/api";

type Aba = 'usuarios' | 'denuncias' | 'melhorias' | 'residuos';

export default function AdminPage() {
  const [aba, setAba] = useState<Aba>('usuarios');
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [denuncias, setDenuncias] = useState<any[]>([]);
  const [melhorias, setMelhorias] = useState<any[]>([]);
  const [residuos, setResiduos] = useState<any[]>([]);
  const [pendentesRes, setPendentesRes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get('/usuarios'),
      api.get('/denuncias'),
      api.get('/melhorias'),
      api.get('/residuos'),
      api.get('/melhorias?status=pendente'),
    ]).then(([u, d, m, r, pr]) => {
      setUsuarios(Array.isArray(u) ? u : []);
      setDenuncias(Array.isArray(d) ? d : []);
      setMelhorias(Array.isArray(m) ? m : []);
      setResiduos(Array.isArray(r) ? r : []);
      setPendentesRes(Array.isArray(pr) ? pr : []);
    }).finally(() => setLoading(false));
  }, []);

  return (
    <AppShell fullWidth>
      <div className="min-h-screen flex flex-col gap-0">

        {/* Header escuro */}
        <div className="px-5 pt-5 pb-0" style={{ background: "#0F1C12" }}>
          <h1 className="text-xl font-bold text-white">⚙ Painel Admin</h1>
          <div className="flex gap-1 mt-4">
            {([
              ['usuarios', 'Usuários'],
              ['denuncias', 'Denúncias 4'],
              ['melhorias', 'Melhorias'],
              ['residuos', 'Resíduos'],
            ] as [Aba, string][]).map(([id, label]) => (
              <button
                key={id}
                onClick={() => setAba(id)}
                className={`px-3 py-2 text-xs font-semibold rounded-t-lg transition-colors ${
                  aba === id
                    ? 'bg-[#EFF2EF] text-[#0F1C12]'
                    : 'text-white/40 hover:text-white/75'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="bg-[#EFF2EF] rounded-b-xl p-5 flex flex-col gap-4">

          {/* Usuários */}
          {aba === 'usuarios' && (
            <>
              <div className="flex items-center justify-between">
                <p className="font-semibold text-[#0F1C12]">Usuários (128)</p>
                <input placeholder="Buscar..." className="border border-[#D4DAD4] rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0D9858] w-40" />
              </div>
              <div className="bg-white rounded-xl border border-[#D4DAD4] divide-y divide-[#D4DAD4]">
                {usuarios.map(({ i, nome, email, role, cor, bg }) => (
                  <div key={nome} className="flex items-center gap-3 px-4 py-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0"
                      style={{ background: bg, color: cor }}>{i}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#0F1C12]">{nome}</p>
                      <p className="text-xs truncate" style={{ color: role === 'Bloqueado' ? cor : '#7A9480' }}>{email}</p>
                    </div>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full shrink-0"
                      style={{ background: bg, color: cor }}>{role}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Denúncias */}
          {aba === 'denuncias' && (
            <>
              <p className="font-semibold text-[#0F1C12]">Denúncias pendentes ({denuncias.length})</p>
              {denuncias.map(({ tipo, cor, texto, info }) => (
                <div key={tipo} className="bg-white rounded-xl border-l-4 p-4 flex flex-col gap-2" style={{ borderLeftColor: cor }}>
                  <p className="text-xs font-bold" style={{ color: cor }}>{tipo}</p>
                  <p className="text-sm text-[#0F1C12] leading-relaxed">{texto}</p>
                  <p className="text-xs text-[#7A9480]">{info}</p>
                  <div className="flex gap-2 mt-1">
                    <button className="px-3 py-1.5 border border-[#D4DAD4] rounded-lg text-xs font-semibold text-[#3D5444] hover:bg-[#F7F8F7] transition-colors">Ignorar</button>
                    <button className="px-3 py-1.5 border border-[#D4DAD4] rounded-lg text-xs font-semibold text-[#3D5444] hover:bg-[#F7F8F7] transition-colors">Reverter edição</button>
                    <button className="px-3 py-1.5 bg-[#FEE2E2] text-[#DC2626] rounded-lg text-xs font-semibold hover:bg-[#DC2626] hover:text-white transition-colors">Bloquear usuário</button>
                  </div>
                </div>
              ))}
            </>
          )}

          {/* Melhorias */}
          {aba === 'melhorias' && (
            <>
              <p className="font-semibold text-[#0F1C12]">Melhorias reportadas (7)</p>
              {melhorias.map(({ titulo, votos, autor }) => (
                <div key={titulo} className="bg-white rounded-xl border border-[#D4DAD4] p-4 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[#0F1C12]">{titulo}</p>
                    <p className="text-xs text-[#7A9480] mt-0.5">{votos} votos · {autor}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button className="px-3 py-1.5 border border-[#D4DAD4] rounded-lg text-xs font-semibold text-[#3D5444] hover:bg-[#F7F8F7] transition-colors">Arquivar</button>
                    <button className="px-3 py-1.5 bg-[#0D9858] text-white rounded-lg text-xs font-semibold hover:bg-[#0b8048] transition-colors">Priorizar</button>
                  </div>
                </div>
              ))}
            </>
          )}

          {/* Resíduos */}
          {aba === 'residuos' && (
            <>
              <div className="flex items-center justify-between">
                <p className="font-semibold text-[#0F1C12]">Tipos de resíduos</p>
                <button className="px-3 py-1.5 bg-[#0D9858] text-white text-xs font-semibold rounded-lg hover:bg-[#0b8048] transition-colors">+ Novo tipo</button>
              </div>
              <div className="bg-white rounded-xl border border-[#D4DAD4] divide-y divide-[#D4DAD4]">
                <div className="flex items-center gap-3 px-4 py-2 bg-[#F7F8F7] rounded-t-xl">
                  <div className="w-2.5 h-2.5 shrink-0" />
                  <span className="flex-1 text-xs font-bold text-[#7A9480]">NOME</span>
                  <span className="text-xs font-bold text-[#7A9480] w-16">PONTOS</span>
                  <div className="w-14" />
                </div>
                {residuos.map(({ cor, nome, pontos }) => (
                  <div key={nome} className="flex items-center gap-3 px-4 py-3">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cor }} />
                    <span className="flex-1 text-sm text-[#0F1C12]">{nome}</span>
                    <span className="text-sm text-[#7A9480] w-16">{pontos}</span>
                    <button className="w-14 py-1 border border-[#D4DAD4] rounded-lg text-xs font-semibold text-[#3D5444] hover:bg-[#F7F8F7] transition-colors">Editar</button>
                  </div>
                ))}
              </div>

              <p className="text-sm font-semibold text-[#D97706] mt-2">⏳ Aguardando aprovação ({pendentesRes.length})</p>
              {pendentesRes.map(({ nome, autor, solicitantes }) => (
                <div key={nome} className="bg-white rounded-xl border border-[#D4DAD4] p-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[#0F1C12]">{nome}</p>
                    <p className="text-xs text-[#7A9480] mt-0.5">{autor} · {solicitantes} pontos querem adicionar</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button className="px-3 py-1.5 border border-[#D4DAD4] rounded-lg text-xs font-semibold text-[#3D5444] hover:bg-[#F7F8F7] transition-colors">Rejeitar</button>
                    <button className="px-3 py-1.5 bg-[#0D9858] text-white rounded-lg text-xs font-semibold hover:bg-[#0b8048] transition-colors">Aprovar</button>
                  </div>
                </div>
              ))}
            </>
          )}

        </div>
      </div>
    </AppShell>
  );
}
