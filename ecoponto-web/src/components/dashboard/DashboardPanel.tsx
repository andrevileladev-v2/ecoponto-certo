import type { ReactNode } from 'react'

export function DashboardPanel({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <h2 className="text-base font-semibold text-gray-700 mb-4">{title}</h2>
      {children}
    </div>
  )
}
