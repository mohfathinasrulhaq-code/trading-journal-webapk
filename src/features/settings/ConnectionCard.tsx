import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { loadEnv } from '@/lib/env'
import { getSupabase } from '@/lib/supabase'
import { checkSupabaseConnection, type ConnectionCheck } from '@/lib/supabase-health'

type CheckState =
  | { status: 'idle' }
  | { status: 'checking' }
  | { status: 'done'; result: ConnectionCheck }

function describeResult(result: ConnectionCheck): { ok: boolean; text: string } {
  switch (result.state) {
    case 'ok':
      return { ok: true, text: `Server Supabase dapat dijangkau (${result.latencyMs} ms).` }
    case 'http-error':
      return {
        ok: false,
        text: `Server menjawab dengan status HTTP ${result.httpStatus}. Periksa URL dan key di .env.local.`,
      }
    case 'timeout':
      return { ok: false, text: 'Tidak ada jawaban dalam 8 detik. Periksa koneksi internet dan URL project.' }
    case 'network-error':
      return { ok: false, text: 'Server tidak dapat dijangkau. Periksa koneksi internet dan URL project.' }
  }
}

export function ConnectionCard() {
  const envResult = loadEnv()
  const [clientReady] = useState<boolean>(() => {
    try {
      getSupabase()
      return true
    } catch {
      return false
    }
  })
  const [check, setCheck] = useState<CheckState>({ status: 'idle' })

  if (!envResult.ok) return null
  const { env } = envResult

  async function handleCheck() {
    setCheck({ status: 'checking' })
    const result = await checkSupabaseConnection(env)
    setCheck({ status: 'done', result })
  }

  const outcome = check.status === 'done' ? describeResult(check.result) : null

  return (
    <Card>
      <h2 className="text-sm font-medium">Koneksi Supabase</h2>
      <dl className="mt-3 space-y-2 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-muted">Konfigurasi env</dt>
          <dd className="text-profit">Valid</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted">Project</dt>
          <dd className="min-w-0 truncate">{new URL(env.supabaseUrl).host}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted">Klien Supabase</dt>
          <dd className={clientReady ? 'text-profit' : 'text-loss'}>{clientReady ? 'Siap' : 'Gagal dibuat'}</dd>
        </div>
      </dl>

      <div className="mt-4">
        <Button variant="secondary" onClick={handleCheck} disabled={check.status === 'checking'}>
          {check.status === 'checking' ? 'Memeriksa...' : 'Tes koneksi'}
        </Button>
      </div>

      <p aria-live="polite" className={`mt-3 text-sm ${outcome ? (outcome.ok ? 'text-profit' : 'text-loss') : 'text-muted'}`}>
        {outcome ? outcome.text : 'Tes koneksi hanya memeriksa apakah server dapat dijangkau. Belum ada login atau data pengguna.'}
      </p>
    </Card>
  )
}
