import { REGISTRO_CONFIG } from '@/features/registro/config'
import type { RegistroFormProps } from '@/features/registro/types'

export function RegistroStepSelector({ tipo, onTipoChange }: RegistroFormProps) {
  return (
    <div className="grid gap-3">
      {REGISTRO_CONFIG.tipos.map((item) => {
        const selected = tipo === item.id

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onTipoChange(item.id)}
            className={`w-full rounded-2xl border p-4 text-left transition-colors ${
              selected
                ? 'border-accent bg-emerald-50 shadow-sm'
                : 'border-border bg-white hover:border-accent/60'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="text-2xl leading-none">{item.emoji}</div>
              <div>
                <div className="font-semibold text-fg">{item.label}</div>
                <div className="text-sm text-fg-3 mt-1">{item.subtitle}</div>
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}
