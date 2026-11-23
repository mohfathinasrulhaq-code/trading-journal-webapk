import type { ReactNode } from 'react'
import { loadEnv } from '@/lib/env'

function ConfigErrorScreen({ errors }: { errors: string[] }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center gap-4 px-4 py-10">
      <h1 className="text-xl font-semibold">Konfigurasi belum lengkap</h1>
      <p className="text-sm text-muted">
        Aplikasi tidak dapat dijalankan karena variabel lingkungan Supabase bermasalah:
      </p>
      <ul className="list-disc space-y-1 pl-5 text-sm text-loss">
        {errors.map((message) => (
          <li key={message}>{message}</li>
        ))}
      </ul>
      <ol className="list-decimal space-y-1 pl-5 text-sm">
        <li>
          Salin <code className="rounded bg-sunken px-1.5 py-0.5">.env.example</code> menjadi{' '}
          <code className="rounded bg-sunken px-1.5 py-0.5">.env.local</code>.
        </li>
        <li>Isi URL project dan anon/publishable key dari Supabase Dashboard.</li>
        <li>
          Hentikan lalu jalankan ulang <code className="rounded bg-sunken px-1.5 py-0.5">npm run dev</code>.
        </li>
      </ol>
    </main>
  )
}

/** Menahan render aplikasi sampai konfigurasi env valid. */
export function ConfigGate({ children }: { children: ReactNode }) {
  const result = loadEnv()
  if (!result.ok) return <ConfigErrorScreen errors={result.errors} />
  return <>{children}</>
}
