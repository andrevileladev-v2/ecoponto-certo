import { AlertTriangle, Battery, Cpu, Droplet, Leaf, Newspaper, Package, Recycle, Shirt, Wine, Zap, type LucideIcon } from 'lucide-react'

export const RESIDUO_ICONS: Record<string, LucideIcon> = {
  Newspaper,
  Package,
  Wine,
  Cpu,
  Battery,
  Shirt,
  Recycle,
  Leaf,
  Zap,
  Droplet,
  AlertTriangle,
}

export const PERFIL_TABS: AbaPerfil[] = ['entregas', 'salvos', 'config']

export type AbaPerfil = 'entregas' | 'salvos' | 'config'
