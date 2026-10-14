import { Send } from 'lucide-react';

import { getMensagemPadrao, PONTO_CONFIG } from '@/features/ponto/helpers';
import type { ChatTabProps } from '@/features/ponto/types';

export function ChatTab({ msgs, input, quickChips, setInput, enviar }: ChatTabProps) {
  return (
    <div className="bg-white border border-border -mt-4 rounded-b-xl flex flex-col" style={{ minHeight: 400 }}>
      <div className="px-4 py-2 bg-raised border-b border-border">
        <p className="text-xs text-fg-3">💬 Chat anônimo · Apenas sobre este local</p>
      </div>
      <div className="flex gap-2 px-3 py-2 overflow-x-auto border-b border-border" style={{ scrollbarWidth: 'none' }}>
        {quickChips.map(chip => (
          <button
            key={chip}
            onClick={() => setInput(chip)}
            className="text-xs px-3 py-1.5 rounded-full border border-border bg-raised hover:border-accent hover:text-accent whitespace-nowrap shrink-0 transition-colors"
          >
            {chip}
          </button>
        ))}
      </div>
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
      <div className="flex gap-2 px-3 py-3 border-t border-border">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && enviar()}
          placeholder={getMensagemPadrao()}
          maxLength={PONTO_CONFIG.chat.maxLength}
          className="flex-1 bg-raised border border-border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-accent"
        />
        <button onClick={enviar} className="px-3 py-2 bg-accent hover:bg-[#0b8048] text-white rounded-lg transition-colors">
          <Send size={14} />
        </button>
        <button title="Denunciar" className="text-lg text-fg-3 hover:text-red-600">🚩</button>
      </div>
    </div>
  );
}
