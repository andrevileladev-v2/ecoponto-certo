import { getItemAvaliacaoStatus } from '@/features/ponto/helpers';
import type { AceitaTabProps } from '@/features/ponto/types';

export function AceitaTab({ itens, votar }: AceitaTabProps) {
  return (
    <div className="bg-white border border-border -mt-4 rounded-b-xl overflow-hidden">
      <div className="px-4 py-2 bg-raised border-b border-border">
        <p className="text-xs text-fg-3">A porcentagem mostra a proporção de relatos da comunidade que conseguiram reciclar cada item.</p>
      </div>
      <div className="divide-y divide-border">
        {itens.map((item, i) => {
          const status = getItemAvaliacaoStatus(item);
          return (
            <div key={item.nome} className="flex items-center gap-3 px-4 py-3">
              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.cor }} />
              <span className="flex-1 text-sm font-medium text-fg">{item.nome}</span>
              <span className="text-xs font-semibold" style={{ color: status.cor }}>{status.label}</span>
              <div className="flex gap-1.5 shrink-0">
                <button onClick={() => votar(i, true)} className="px-2 py-1 rounded text-xs font-bold bg-acc-bg text-accent hover:bg-accent hover:text-white transition-colors">✓</button>
                <button onClick={() => votar(i, false)} className="px-2 py-1 rounded text-xs font-bold bg-red-100 text-red-600 hover:bg-red-600 hover:text-white transition-colors">✕</button>
              </div>
              <span className="text-xs text-fg-3 w-16 text-right shrink-0">
                {item.votos} {item.votos === 1 ? 'relato' : 'relatos'}
              </span>
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
  );
}
