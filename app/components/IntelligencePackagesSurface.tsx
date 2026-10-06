"use client"
import type {ReactNode} from 'react'
import {useSiteTheme} from './theme/ThemeProvider'
import './intelligence-packages-surface.css'

export default function IntelligencePackagesSurface({children}:{children:ReactNode}) {
  const {theme}=useSiteTheme()
  return <main className="intelligence-packages-surface" style={{backgroundImage:`url(/images/packages-bg-${theme}.webp)`}}>{children}</main>
}
