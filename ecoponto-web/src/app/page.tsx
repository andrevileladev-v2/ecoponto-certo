import MapClient from "@/components/map/MapClient"
import AppShell from '@/components/layout/AppShell'

export default function DashboardPage() {
  return (
    <AppShell fullWidth>
      <MapClient/>
    </AppShell>
  )
}
