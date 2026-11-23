import { Outlet } from 'react-router-dom'
import { OfflineSyncBanner } from '@/components/ui/OfflineSyncBanner'
import { PwaInstallBanner } from '@/components/ui/PwaInstallBanner'
import { BottomNav } from './BottomNav'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'

export function AppShell() {
  return (
    <div className="min-h-dvh md:flex">
      <Sidebar />
      <div className="flex min-h-dvh min-w-0 flex-1 flex-col">
        <PwaInstallBanner />
        <OfflineSyncBanner />
        <TopBar />
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 pb-28 md:px-8 md:pb-10">
          <Outlet />
        </main>
      </div>
      <BottomNav />
    </div>
  )
}
