"use client"
import type {ReactNode} from 'react'
import './intelligence-packages-surface.css'

export default function IntelligencePackagesSurface({children}:{children:ReactNode}) {
  return <main className="intelligence-packages-surface" style={{backgroundImage:'var(--ih-background-image)'}}>{children}</main>
}
