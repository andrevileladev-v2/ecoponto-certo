type ProgressItem = {
  name: string
  value: number
  color: string
  maxValue: number
  valueLabel: string
}

type ContributorItem = {
  position: number
  initial: string
  name: string
  value: number
  valueLabel: string
}

export function ProgressList({ items }: { items: ProgressItem[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-gray-400">Nenhuma entrega registrada ainda.</p>
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.name} className="flex items-center gap-3">
          <span className="w-28 text-sm text-gray-600 truncate">{item.name}</span>
          <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
            <div
              className="h-3 rounded-full transition-all"
              style={{
                width: `${(item.value / item.maxValue) * 100}%`,
                backgroundColor: item.color,
              }}
            />
          </div>
          <span className="w-16 text-sm text-right text-gray-500">{item.valueLabel}</span>
        </div>
      ))}
    </div>
  )
}

export function ContributorList({ items }: { items: ContributorItem[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-gray-400">Nenhuma entrega registrada ainda.</p>
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.name} className="flex items-center gap-3">
          <span className="w-6 text-sm text-gray-400 font-medium">{item.position}</span>
          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-sm font-semibold text-green-700">
            {item.initial}
          </div>
          <span className="flex-1 text-sm text-gray-700">{item.name}</span>
          <span className="text-sm font-medium text-gray-500">{item.valueLabel}</span>
        </div>
      ))}
    </div>
  )
}
