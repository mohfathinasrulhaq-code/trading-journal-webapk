import { Card } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'
import { ProfileCard } from '@/features/profile/ProfileCard'
import { ThemeSelector } from '@/theme/ThemeSelector'
import { ConnectionCard } from './ConnectionCard'

export default function SettingsPage() {
  return (
    <>
      <PageHeader
        title="Pengaturan"
        description="Profil pengguna, preferensi tampilan, dan status koneksi backend."
      />
      <div className="space-y-4">
        <ProfileCard />
        <Card>
          <ThemeSelector />
        </Card>
        <ConnectionCard />
      </div>
    </>
  )
}
