'use client'
import AppShell from "@/components/layout/AppShell";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";

type Aba = 'usuarios' | 'denuncias' | 'melhorias' | 'residuos';
type Pagina<T> = { total: number; data: T[] };
type UsuarioApi = { id: string; nome: string; email: string; role: string; status: string };
type DenunciaApi = {
  id: string;
  tipo: string;
  descricao: string | null;
  criado_em: string;
  denunciante: { nome: string };
  alvo_usuario: { nome: string } | null;
  alvo_mensagem: { conteudo: string } | null;
  alvo_ponto: { nome: string } | null;
};
type MelhoriaApi = { id: string; titulo: string; autor: { nome: string }; _count: { votos: number } };
type ResiduoApi = { id: string; nome: string; cor: string; pontos?: number; solicitado_por_id?: string | null };
type UsuarioAdmin = { id: string; i: string; nome: string; email: string; role: string; cor: string; bg: string };
type DenunciaAdmin = { id: string; tipo: string; cor: string; texto: string; info: string };
type MelhoriaAdmin = { id: string; titulo: string; votos: number; autor: string };
type ResiduoAdmin = { id: string; nome: string; cor: string; pontos: string | number };
type ResiduoPendente = { id: string; nome: string; autor: string };

export default function AdminPage() {
  const [aba, setAba] = useState<Aba>('usuarios');
  const [usuarios, setUsuarios] = useState<UsuarioAdmin[]>([]);
  const [denuncias, setDenuncias] = useState<DenunciaAdmin[]>([]);
  const [melhorias, setMelhorias] = useState<MelhoriaAdmin[]>([]);
  const [residuos, setResiduos] = useState<ResiduoAdmin[]>([]);
  const [pendentesRes, setPendentesRes] = useState<ResiduoPendente[]>([]);

  useEffect(() => {
    let isMounted = true;

    async function loadAdminData() {
      try {
        const [usuariosResult, denunciasResult, melhoriasResult, residuosResult, pendentesResult] = await Promise.all([
          api.get<Pagina<UsuarioApi>>('/usuarios'),
          api.get<Pagina<DenunciaApi>>('/denuncias?status=PENDENTE'),
          api.get<MelhoriaApi[]>('/melhorias?status=PENDENTE'),
          api.get<ResiduoApi[]>('/residuos'),
          api.get<ResiduoApi[]>('/residuos?status=PENDENTE'),
        ]);

        if (!isMounted) return;
        setUsuarios(usuariosResult.data.map(usuario => {
          const bloqueado = usuario.status === 'BLOQUEADO';
          return {
            id: usuario.id,
            i: usuario.nome.charAt(0).toUpperCase(),
            nome: usuario.nome,
            email: usuario.email,
            role: bloqueado ? 'Bloqueado' : usuario.role === 'ADMIN' ? 'Admin' : 'Ativo',
            cor: bloqueado ? '#DC2626' : '#0D9858',
            bg: bloqueado ? '#FEE2E2' : '#E8F5ED',
          };
        }));
        setDenuncias(denunciasResult.data.map(denuncia => {
          const alvo = denuncia.alvo_usuario?.nome
            ?? denuncia.alvo_ponto?.nome
            ?? denuncia.alvo_mensagem?.conteudo;
          return {
            id: denuncia.id,
            tipo: denuncia.tipo,
            cor: '#D97706',
            texto: denuncia.descricao ?? (alvo ? `Alvo: ${alvo}` : 'Sem descrição'),
            info: `${denuncia.denunciante.nome} · ${new Date(denuncia.criado_em).toLocaleDateString('pt-BR')}`,
          };
        }));
        setMelhorias(melhoriasResult.map(melhoria => ({
          id: melhoria.id,
          titulo: melhoria.titulo,
          votos: melhoria._count.votos,
          autor: melhoria.autor.nome,
        })));
        setResiduos(residuosResult.map(residuo => ({
          id: residuo.id,
          nome: residuo.nome,
          cor: residuo.cor,
          pontos: residuo.pontos ?? '—',
        })));
        setPendentesRes(pendentesResult.map(residuo => ({
          id: residuo.id,
          nome: residuo.nome,
          autor: residuo.solicitado_por_id ? 'Solicitação da comunidade' : 'Solicitação pendente',
        })));
      } catch (error) {
        console.error('Erro ao carregar dados administrativos:', error);
      }
    }

    void loadAdminData();
    return () => {
      isMounted = false;
    };
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
                    ? 'bg-bg text-fg'
                    : 'text-white/40 hover:text-white/75'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="bg-bg rounded-b-xl p-5 flex flex-col gap-4">

          {/* Usuários */}
          {aba === 'usuarios' && (
            <>
              <div className="flex items-center justify-between">
                <p className="font-semibold text-fg">Usuários ({usuarios.length})</p>
                <input placeholder="Buscar..." className="border border-border rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-accent w-40" />
              </div>
              <div className="bg-white rounded-xl border border-border divide-y divide-border">
                {usuarios.map(({ i, nome, email, role, cor, bg }) => (
                  <div key={nome} className="flex items-center gap-3 px-4 py-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0"
                      style={{ background: bg, color: cor }}>{i}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-fg">{nome}</p>
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
              <p className="font-semibold text-fg">Denúncias pendentes ({denuncias.length})</p>
              {denuncias.map(({ id, tipo, cor, texto, info }) => (
                <div key={id} className="bg-white rounded-xl border-l-4 p-4 flex flex-col gap-2" style={{ borderLeftColor: cor }}>
                  <p className="text-xs font-bold" style={{ color: cor }}>{tipo}</p>
                  <p className="text-sm text-fg leading-relaxed">{texto}</p>
                  <p className="text-xs text-fg-3">{info}</p>
                  <div className="flex gap-2 mt-1">
                    <button className="px-3 py-1.5 border border-border rounded-lg text-xs font-semibold text-fg-2 hover:bg-raised transition-colors">Ignorar</button>
                    <button className="px-3 py-1.5 border border-border rounded-lg text-xs font-semibold text-fg-2 hover:bg-raised transition-colors">Reverter edição</button>
                    <button className="px-3 py-1.5 bg-red-100 text-red-600 rounded-lg text-xs font-semibold hover:bg-red-600 hover:text-white transition-colors">Bloquear usuário</button>
                  </div>
                </div>
              ))}
            </>
          )}

          {/* Melhorias */}
          {aba === 'melhorias' && (
            <>
              <p className="font-semibold text-fg">Melhorias reportadas ({melhorias.length})</p>
              {melhorias.map(({ id, titulo, votos, autor }) => (
                <div key={id} className="bg-white rounded-xl border border-border p-4 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-fg">{titulo}</p>
                    <p className="text-xs text-fg-3 mt-0.5">{votos} votos · {autor}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button className="px-3 py-1.5 border border-border rounded-lg text-xs font-semibold text-fg-2 hover:bg-raised transition-colors">Arquivar</button>
                    <button className="px-3 py-1.5 bg-accent text-white rounded-lg text-xs font-semibold hover:bg-[#0b8048] transition-colors">Priorizar</button>
                  </div>
                </div>
              ))}
            </>
          )}

          {/* Resíduos */}
          {aba === 'residuos' && (
            <>
              <div className="flex items-center justify-between">
                <p className="font-semibold text-fg">Tipos de resíduos</p>
                <button className="px-3 py-1.5 bg-accent text-white text-xs font-semibold rounded-lg hover:bg-[#0b8048] transition-colors">+ Novo tipo</button>
              </div>
              <div className="bg-white rounded-xl border border-border divide-y divide-border">
                <div className="flex items-center gap-3 px-4 py-2 bg-raised rounded-t-xl">
                  <div className="w-2.5 h-2.5 shrink-0" />
                  <span className="flex-1 text-xs font-bold text-fg-3">NOME</span>
                  <span className="text-xs font-bold text-fg-3 w-16">PONTOS</span>
                  <div className="w-14" />
                </div>
                {residuos.map(({ cor, nome, pontos }) => (
                  <div key={nome} className="flex items-center gap-3 px-4 py-3">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cor }} />
                    <span className="flex-1 text-sm text-fg">{nome}</span>
                    <span className="text-sm text-fg-3 w-16">{pontos}</span>
                    <button className="w-14 py-1 border border-border rounded-lg text-xs font-semibold text-fg-2 hover:bg-raised transition-colors">Editar</button>
                  </div>
                ))}
              </div>

              <p className="text-sm font-semibold text-amber-600 mt-2">⏳ Aguardando aprovação ({pendentesRes.length})</p>
              {pendentesRes.map(({ id, nome, autor }) => (
                <div key={id} className="bg-white rounded-xl border border-border p-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-fg">{nome}</p>
                    <p className="text-xs text-fg-3 mt-0.5">{autor}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button className="px-3 py-1.5 border border-border rounded-lg text-xs font-semibold text-fg-2 hover:bg-raised transition-colors">Rejeitar</button>
                    <button className="px-3 py-1.5 bg-accent text-white rounded-lg text-xs font-semibold hover:bg-[#0b8048] transition-colors">Aprovar</button>
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
