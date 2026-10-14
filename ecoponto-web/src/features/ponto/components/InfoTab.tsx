import { Flag, Recycle } from 'lucide-react';

import { getCorResiduo } from '@/features/ponto/helpers';
import type { InfoTabProps } from '@/features/ponto/types';

export function InfoTab({ ponto, onStartReport }: InfoTabProps) {
  return (
    <div className="bg-white border border-border -mt-4 rounded-b-xl flex flex-col divide-y divide-border">
      <div className="px-4 py-3 flex flex-wrap gap-2">
        {ponto?.residuos?.map((r, i) => {
          const cor = getCorResiduo(r.residuo);
          return (
            <span key={i} className="text-xs px-2.5 py-1 rounded-full font-semibold"
              style={{ backgroundColor: `${cor}18`, color: cor }}>
              {r.residuo?.nome ?? 'Resíduo'}
            </span>
          );
        })}
      </div>
      <div className="px-4 py-3">
        <div className="rounded-xl p-3 bg-amber-100 border-l-4 border-amber-600">
          <p className="text-xs font-bold text-amber-600 mb-1">⚠ Atenção</p>
          <p className="text-xs text-fg-2">Não vá à noite. Confira o horário antes de sair de casa.</p>
        </div>
      </div>
      <div className="px-4 py-3 flex flex-col gap-2">
        <p className="text-xs font-bold tracking-widest text-fg-3">VOCÊ CONSEGUIU RECICLAR AQUI?</p>
        <button
          type="button"
          onClick={() => onStartReport('CONSEGUIU')}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#0b8048]"
        >
          <Recycle size={16} /> Consegui reciclar
        </button>
        <button
          type="button"
          onClick={() => onStartReport('NAO_CONSEGUIU')}
          className="w-full rounded-lg border border-red-200 bg-red-50 py-2.5 text-sm font-semibold text-red-700 transition-colors hover:bg-red-100"
        >
          Não consegui reciclar
        </button>
      </div>
      <div className="px-4 py-3">
        <button className="flex items-center gap-1.5 text-xs text-fg-3 hover:text-red-600 transition-colors">
          <Flag size={11} /> Denunciar informação incorreta
        </button>
      </div>
    </div>
  );
}
