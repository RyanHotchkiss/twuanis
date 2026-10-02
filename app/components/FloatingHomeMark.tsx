'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useSiteTheme } from './theme/ThemeProvider'

import {useHomepageEntrance} from './HomepageEntrance'

export default function FloatingHomeMark() {
  const stage = useHomepageEntrance()
  const pathname = usePathname()

  const isHomepage =
    pathname === '/en' ||
    pathname === '/es'

  return stage === 'complete'
    ? (
      <VisibleHomeMark
        delayEntrance={!isHomepage}
      />
    )
    : null
}

function VisibleHomeMark({
      delayEntrance
    }: {
      delayEntrance: boolean
    }) {
  const pathname = usePathname()
  const { theme } = useSiteTheme()
      
  const [showLabel, setShowLabel] = useState(true)

  const [visible, setVisible] =
      useState(!delayEntrance)

      useEffect(() => {
          if (!delayEntrance) {
            setVisible(true)
            return
          }

          const timer = window.setTimeout(() => {
            setVisible(true)
          }, 5000)

          return () =>
            window.clearTimeout(timer)
        }, [delayEntrance])

  const isSpanish =
    pathname === '/es' ||
    pathname.startsWith('/es/')

  const homeHref = isSpanish ? '/es' : '/en'

  const isHomepage =
    pathname === '/en' ||
    pathname === '/es'

  const logoSrc =
    theme === 'light'
      ? '/images/black-20S-logo.svg'
      : '/images/white-20s-logo.svg'

  useEffect(() => {
      if (!visible) {
        return
      }

      const timer = window.setTimeout(() => {
        setShowLabel(false)
      }, 5000)

      return () =>
        window.clearTimeout(timer)
    }, [visible])

    if (!visible) {
        return null
      }

  return (
    <Link
      href={homeHref}
      className="floating-home-mark"
      aria-label={isSpanish ? 'Inicio' : 'Home'}
      data-theme={theme}
      data-homepage={isHomepage}
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