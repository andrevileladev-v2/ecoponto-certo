import type { PerfilTabsProps } from '@/features/perfil/types'
import { PERFIL_TABS } from '@/features/perfil/config'

export function PerfilTabs({ aba, onChange }: PerfilTabsProps) {
  return (
    <div className="flex border-x border-b border-border bg-white">
      {PERFIL_TABS.map((id) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          className={`flex-1 py-3 text-xs font-semibold border-b-2 transition-colors capitalize ${
            aba === id ? 'border-accent text-accent' : 'border-transparent text-fg-3 hover:text-fg-2'
          }`}
        >
          {id === 'config' ? 'Config.' : id.charAt(0).toUpperCase() + id.slice(1)}
        </button>
      ))}
    </div>
  )
}
