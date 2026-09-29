'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useSiteTheme } from './theme/ThemeProvider'

import {useHomepageEntrance} from './HomepageEntrance'

export default function FloatingHomeMark() {
  const stage = useHomepageEntrance()
  return stage === 'complete' ? <VisibleHomeMark /> : null
}

function VisibleHomeMark() {
  const pathname = usePathname()
  const { theme } = useSiteTheme()
  const [showLabel, setShowLabel] = useState(true)

  const isSpanish =
    pathname === '/es' ||
    pathname.startsWith('/es/')

  const homeHref = isSpanish ? '/es' : '/en'

  const logoSrc =
    theme === 'light'
      ? '/images/black-20S-logo.svg'
      : '/images/white-20s-logo.svg'

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setShowLabel(false)
    }, 5000)

    return () => window.clearTimeout(timer)
  }, [])

  return (
    <Link
      href={homeHref}
      className="floating-home-mark"
      aria-label={isSpanish ? 'Inicio' : 'Home'}
    >
      <span
        className="floating-home-logo"
        aria-hidden="true"
      >
        <img
          src={logoSrc}
          alt=""
        />
      </span>

      <span
        className="floating-home-label"
        data-visible={showLabel}
        aria-hidden="true"
      >
        {isSpanish ? 'Inicio' : 'Home'}
      </span>
    </Link>
  )
}