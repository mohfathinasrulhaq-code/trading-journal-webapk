import { Card } from './Card'

interface PhaseNoticeProps {
  title: string
  description: string
  phase: string
}

/** Penanda jujur untuk modul yang belum dibangun: tidak menampilkan data apa pun. */
export function PhaseNotice({ title, description, phase }: PhaseNoticeProps) {
  return (
    <Card>
      <h2 className="text-base font-semibold">{title}</h2>
      <p className="mt-1 max-w-prose text-sm text-muted">{description}</p>
      <p className="mt-4 inline-block rounded-md bg-sunken px-2.5 py-1 text-xs font-medium text-muted">
        Dikerjakan di {phase}
      </p>
    </Card>
  )
}
