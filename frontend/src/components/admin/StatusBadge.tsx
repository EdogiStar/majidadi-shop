import type { ReactNode } from 'react'

export function StatusBadge({ children, tone }: { children: ReactNode; tone?: string }) {
  const value = tone ?? String(children).toLowerCase().replace(/\s/g, '-')
  return <span className={`status status-${value}`}>{children}</span>
}
