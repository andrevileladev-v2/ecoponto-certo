import { DIAS_SEMANA, DIA_SEMANA_LABEL, type HorarioSemana } from '@/features/map/types'

type HorarioEditorProps = {
  value: HorarioSemana
  onChange: (next: HorarioSemana) => void
}

export function HorarioEditor({ value, onChange }: HorarioEditorProps) {
  function setDia(dia: keyof HorarioSemana, patch: Partial<HorarioSemana[keyof HorarioSemana]>) {
    onChange({ ...value, [dia]: { ...value[dia], ...patch } })
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-semibold text-fg-2">Horário de funcionamento</p>
      <div className="flex flex-col gap-1.5 rounded-lg border border-border p-3">
        {DIAS_SEMANA.map((dia) => {
          const horarioDia = value[dia]
          return (
            <div key={dia} className="flex flex-wrap items-center gap-2 text-sm">
              <label className="flex w-28 shrink-0 items-center gap-2 font-medium text-fg">
                <input
                  type="checkbox"
                  checked={horarioDia.ativo}
                  onChange={(event) => setDia(dia, { ativo: event.target.checked })}
                  className="size-4 accent-accent"
                />
                {DIA_SEMANA_LABEL[dia]}
              </label>
              {horarioDia.ativo ? (
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    value={horarioDia.abertura}
                    onChange={(event) => setDia(dia, { abertura: event.target.value })}
                    className="rounded-lg border border-border px-2 py-1.5 text-sm text-fg outline-none focus:border-accent"
                  />
                  <span className="text-fg-3">até</span>
                  <input
                    type="time"
                    value={horarioDia.fechamento}
                    onChange={(event) => setDia(dia, { fechamento: event.target.value })}
                    className="rounded-lg border border-border px-2 py-1.5 text-sm text-fg outline-none focus:border-accent"
                  />
                </div>
              ) : (
                <span className="text-xs text-fg-3">Fechado</span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
