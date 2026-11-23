import { Link } from 'react-router-dom'
import { Card } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'

export default function NotFoundPage() {
  return (
    <>
      <PageHeader title="Halaman tidak ditemukan" />
      <Card>
        <p className="text-sm text-muted">Alamat yang Anda buka tidak ada di aplikasi ini.</p>
        <Link
          to="/"
          className="mt-4 inline-flex min-h-11 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-fg hover:opacity-90"
        >
          Kembali ke Dashboard
        </Link>
      </Card>
    </>
  )
}
