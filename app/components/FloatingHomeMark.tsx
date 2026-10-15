'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
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
      <Suspense fallback={null}>
        <VisibleHomeMark delayEntrance={!isHomepage} />
      </Suspense>
    )
    : null
}

function VisibleHomeMark({
      delayEntrance
    }: {
      delayEntrance: boolean
    }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
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
    pathname.startsWith('/es/') ||
    ((pathname === '/remates' || pathname.startsWith('/remates/')) &&
      searchParams.get('lang') === 'es')

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
    <div className="homepage-floating-controls" data-homepage={isHomepage}>
    {isHomepage && <button type="button" className="homepage-scroll-top" aria-label={isSpanish ? 'Volver arriba' : 'Scroll to top'} onClick={()=>window.scrollTo({top:0,behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'})}>↑</button>}
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
    {isHomepage && <div id="homepage-mobile-admin-slot"/>}
    </div>
  )
}