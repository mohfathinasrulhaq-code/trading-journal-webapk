import type { ComponentType, SVGProps } from 'react'
import {
  AccountsIcon,
  CashIcon,
  DashboardIcon,
  SettingsIcon,
  TradesIcon,
} from '@/components/ui/icons'

export interface NavItem {
  to: string
  label: string
  icon: ComponentType<SVGProps<SVGSVGElement>>
  end?: boolean
}

export const NAV_ITEMS: readonly NavItem[] = [
  { to: '/', label: 'Dashboard', icon: DashboardIcon, end: true },
  { to: '/trades', label: 'Trades', icon: TradesIcon },
  { to: '/cash', label: 'Kas', icon: CashIcon },
  { to: '/accounts', label: 'Akun', icon: AccountsIcon },
  { to: '/settings', label: 'Pengaturan', icon: SettingsIcon },
]
