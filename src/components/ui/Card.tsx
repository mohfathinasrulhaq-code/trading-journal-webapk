import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

interface CardProps {
  children: ReactNode
  className?: string
}

export function Card({ children, className }: CardProps) {
  return (
    <section className={cn('rounded-xl border border-line bg-surface p-4 sm:p-5', className)}>
      {children}
    </section>
  )
}
