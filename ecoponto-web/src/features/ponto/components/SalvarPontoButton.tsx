import { Bookmark, BookmarkCheck } from 'lucide-react'

type SalvarPontoButtonProps = {
  saved: boolean
  loading?: boolean
  onClick: () => void
  compact?: boolean
}

export function SalvarPontoButton({
  saved,
  loading = false,
  onClick,
  compact = false,
}: SalvarPontoButtonProps) {
  const Icon = saved ? BookmarkCheck : Bookmark

  return (
    <button
      type="button"
      aria-label={saved ? 'Remover ponto dos salvos' : 'Salvar ponto'}
      aria-pressed={saved}
      disabled={loading}
      onClick={onClick}
      className={`flex items-center justify-center gap-2 rounded-lg border border-border font-semibold transition-colors disabled:cursor-wait disabled:opacity-60 ${
        compact ? 'px-3 py-2 text-xs' : 'px-3 py-2 text-sm'
      } ${saved ? 'bg-acc-bg text-accent' : 'bg-white text-fg-2 hover:bg-raised'}`}
    >
      <Icon size={compact ? 16 : 18} />
      {!compact && (loading ? 'Salvando…' : saved ? 'Salvo' : 'Salvar ponto')}
    </button>
  )
}
