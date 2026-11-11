import type { ReactNode } from 'react'

// Keep wide analytical labels reachable without widening the containing page.
export default function PriceMeterChartViewport({ children, label }: { children: ReactNode; label: string }) {
  return <div role="region" aria-label={label} tabIndex={0} style={{ width: '100%', maxWidth: '100%', minWidth: 0, overflowX: 'auto' }}>
    <div style={{ minWidth: 760 }}>{children}</div>
  </div>
}
