'use client'
import AppShell from "@/components/layout/AppShell";
import { AdminTabBar } from "@/components/admin/AdminTabBar";
import Link from "next/link";
import { useState } from "react";
import { ChevronLeft, Clock, Moon } from "lucide-react";
import { useParams, useRouter } from 'next/navigation';
import { InfoTab } from "@/features/ponto/components/InfoTab";
import { AceitaTab } from "@/features/ponto/components/AceitaTab";
import { ChatTab } from "@/features/ponto/components/ChatTab";
import { EntregaTab } from "@/features/ponto/components/EntregaTab";
import { EdicoesTab } from "@/features/ponto/components/EdicoesTab";
import { getPontoConfiabilidadeLabel, getPontoHeaderText, getPontoTabs, getStatusBadges, relCor } from "@/features/ponto/helpers";
import { usePontoData } from "@/features/ponto/usePonto";
import type { AbaPonto, ResultadoEntrega } from "@/features/ponto/types";
import { useAuth } from '@/lib/auth';
import { useSavedPoints } from '@/features/ponto/useSavedPoints';
import { SalvarPontoButton } from '@/features/ponto/components/SalvarPontoButton';

export default function PontoPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [aba, setAba] = useState<AbaPonto>('info');
  const { user } = useAuth();
  const { savedPointIds, pendingPointIds, error: savedPointsError, toggleSavedPoint } = useSavedPoints(user);
  const {
    ponto,
    itens,
    msgs,
    input,
    entregas,
    propostas,
    relatos,
    isLoading,
    setInput,
    votar,
    votarEdicao,
    votarRelato,
    enviar,
  } = usePontoData(id);
  const confiabilidade = ponto?.confiabilidade ?? 0;
  const cor = relCor(confiabilidade);
  const tabs = getPontoTabs(msgs.length, entregas.length, propostas.length);
  const quickChips = getStatusBadges();
  const pontoHeader = getPontoHeaderText(ponto);

  const renderTab = () => {
    switch (aba) {
      case 'info':
        return (
          <InfoTab
            ponto={ponto}
            onStartReport={(resultado: ResultadoEntrega) => {
              const formPath = `/ponto/${id}/descarte?resultado=${resultado}`
              router.push(user ? formPath : `/login?returnTo=${encodeURIComponent(formPath)}`)
            }}
          />
        );
      case 'aceita':
        return <AceitaTab itens={itens} votar={votar} />;
      case 'entregas':
        return (
          <EntregaTab entregas={entregas} />
        );
      case 'edicoes':
        return (
          <EdicoesTab
            propostas={propostas}
            relatos={relatos}
            isLoggedIn={Boolean(user)}
            onVotar={votarEdicao}
            onVotarRelato={votarRelato}
          />
        );
      case 'chat':
        return (
          <ChatTab
            msgs={msgs}
            input={input}
            quickChips={quickChips}
            setInput={setInput}
            enviar={enviar}
          />
        );
      default:
        return null;
    }
  };

  return (
    <AppShell>
      <div className="max-w-lg mx-auto flex flex-col gap-4">
        <Link href="/" className="flex items-center gap-1.5 text-sm text-fg-3 hover:text-accent transition-colors w-fit">
          <ChevronLeft size={16} /> Voltar ao mapa
        </Link>

        <div className="bg-white rounded-t-xl border border-border px-4 py-4 flex flex-col gap-3">
          {isLoading ? (
            <div className="animate-pulse space-y-3">
              <div className="h-4 w-32 rounded bg-slate-200" />
              <div className="h-3 w-48 rounded bg-slate-200" />
              <div className="h-2 w-full rounded bg-slate-200" />
              <div className="h-3 w-28 rounded bg-slate-200" />
            </div>
          ) : (
            <>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h1 className="text-base font-bold text-fg">{ponto?.nome}</h1>
                  <p className="text-xs text-fg-3 mt-0.5">{pontoHeader}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-acc-bg text-accent">Ativo</span>
                  {ponto?.id && (
                    <SalvarPontoButton
                      saved={savedPointIds.has(ponto.id)}
                      loading={pendingPointIds.has(ponto.id)}
                      onClick={() => {
                        if (!user) {
                          router.push(`/login?returnTo=${encodeURIComponent(`/ponto/${ponto.id}`)}`)
                          return
                        }
                        void toggleSavedPoint(ponto.id!)
                      }}
                    />
                  )}
                </div>
              </div>
              {savedPointsError && <p role="alert" className="text-xs text-red-700">{savedPointsError}</p>}
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-bg rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${confiabilidade * 100}%`, backgroundColor: cor }} />
                </div>
                <span className="text-xs font-semibold shrink-0" style={{ color: cor }}>
                  {getPontoConfiabilidadeLabel(confiabilidade)}
                </span>
              </div>
              <div className="flex flex-wrap gap-3 text-xs text-fg-2">
                <span className="flex items-center gap-1"><Clock size={12} className="text-fg-3" />{ponto?.horario}</span>
                {ponto?.noturno && <span className="flex items-center gap-1 text-fg-3"><Moon size={12} />Acesso noturno</span>}
              </div>
            </>
          )}
        </div>

        <div className="bg-white border-x border-border -mt-4">
          <AdminTabBar tabs={tabs} activeTab={aba} onChange={setAba} />
        </div>

        {renderTab()}
      </div>
    </AppShell>
  );
}
