'use client'

import Link from 'next/link'

import {
  CircleUser,
  Search,
  Megaphone,
  Compass,
  ArrowLeftRight,
  Heart,
  Package,
  Menu
} from 'lucide-react'

import {
  Suspense,
  useEffect,
  useState
} from 'react'

import {
  usePathname,
  useSearchParams
} from 'next/navigation'

import {
  getAlternateLanguageUrl
} from '@/lib/language-route'

type TopBarProps = {
  onFilterClick?: () => void
  theme?: 'dark' | 'light'
  onThemeToggle?: () => void
}

const GOLD = '#C7A44B'
const WHITE = '#FFFFFF'
const UTILITY_ORANGE = '#ff3b00'


function TopBarContent({
  onFilterClick,
  theme = 'dark',
  onThemeToggle
}: TopBarProps) {

  const pathname =
    usePathname()

  const searchParams =
    useSearchParams()


  const currentLanguage =
  pathname.startsWith('/es')
    ? 'es'
    : 'en'

const targetLanguage =
  currentLanguage === 'en'
    ? 'es'
    : 'en'

const languageHref =
  getAlternateLanguageUrl({
    pathname,
    searchParams,
    targetLanguage
  })

const isSpanish =
  currentLanguage === 'es'


  const [showLabels, setShowLabels] =
    useState(true)

  const [collapsed, setCollapsed] =
    useState(false)

  const [manuallyExpanded, setManuallyExpanded] =
    useState(false)

  const [isMobile, setIsMobile] =
    useState(false)

  const [hoveredItem, setHoveredItem] =
    useState<string | null>(null)

  useEffect(() => {

      const timer =
        window.setTimeout(() => {
          setShowLabels(false)
        }, 5000)

      return () =>
        window.clearTimeout(timer)

    }, [])


  useEffect(() => {

  let lastScrollY =
    window.scrollY

  function handleScroll() {

    const currentScrollY =
      window.scrollY

    /*
     * TOP OF PAGE
     *
     * Full navigation is always visible.
     */
    if (currentScrollY <= 12) {

      setCollapsed(false)
      setManuallyExpanded(false)

      lastScrollY =
        currentScrollY

      return
    }

    /*
     * SCROLLING DOWN
     *
     * Collapse full navigation into
     * the floating hamburger.
     */
    if (
      currentScrollY >
      lastScrollY + 6 &&
      !manuallyExpanded
    ) {
      setCollapsed(true)
    }

    /*
     * SCROLLING UP
     *
     * Restore full navigation immediately.
     */
    if (
      currentScrollY <
      lastScrollY - 6
    ) {
      setCollapsed(false)
      setManuallyExpanded(false)
    }

    lastScrollY =
      currentScrollY
  }

  window.addEventListener(
    'scroll',
    handleScroll,
    { passive: true }
  )

  return () =>
    window.removeEventListener(
      'scroll',
      handleScroll
    )

}, [manuallyExpanded])


  function labelVisible(
    item: string
  ) {

    if (showLabels) {
      return true
    }

    if (isMobile) {
      return false
    }

    return hoveredItem === item
  }


  function itemStyle() {

    return {
      display: 'flex',
      flexDirection:
        'column' as const,
      alignItems: 'center',
      justifyContent: 'flex-start',
      textDecoration: 'none',
      background: 'transparent',
      border: 'none',
      padding: '.25rem',
      minWidth: 0,
      cursor: 'pointer',
      WebkitTapHighlightColor:
        'transparent',
      transition:
        'opacity .2s ease'
    }
  }


  function labelStyle(
    visible: boolean,
    mobileLabel = false
  ) {

    return {
      color:
        theme === 'dark'
          ? '#d8d8d8'
          : '#000000',
      fontSize:
        mobileLabel
          ? '.62rem'
          : '.68rem',
      fontWeight: 400,
      lineHeight: 1.15,
      textAlign:
        'center' as const,
      whiteSpace:
        'pre-line' as const,
      marginTop: '.35rem',

      opacity:
        visible
          ? 1
          : 0,

      maxHeight:
        visible
          ? '3rem'
          : '0',

      transform:
        visible
          ? 'translateY(0)'
          : 'translateY(-4px)',

      overflow: 'hidden',

      transition:
        'opacity .45s ease, max-height .45s ease, transform .45s ease'
    }
  }


  if (collapsed) {

  return (
    <div
      style={floatingHamburgerShell(theme)}
    >
        <button
          type="button"
          aria-label={
            isSpanish
              ? 'Abrir navegación'
              : 'Open navigation'
          }
          onClick={() => {
            setCollapsed(false)
            setManuallyExpanded(true)
          }}
          style={hamburgerButton}
        >
          <Menu
            size={32}
            strokeWidth={0.8}
            color={
              theme === 'dark'
                ? WHITE
                : '#000000'
            }
          />
        </button>
      </div>
    )

  }


  return (

    <div
      style={
        manuallyExpanded
          ? floatingTopBarShell(theme)
          : stickyShell(theme)
      }
    >

      <nav style={navContainer}>

        {/* MARKETHUB */}
        <Link
          href={
            isSpanish
              ? '/es/centro-de-mercado'
              : '/en/market-hub'
          }
          style={itemStyle()}
          onMouseEnter={() =>
            setHoveredItem('hub')
          }
          onMouseLeave={() =>
            setHoveredItem(null)
          }
        >
          <CircleUser
            size={50}
            strokeWidth={0.65}
            color={
                theme === 'dark'
                  ? WHITE
                  : '#000000'
              }
          />

          <span
            style={labelStyle(
              labelVisible('hub'),
              isMobile
            )}
          >
            {isMobile
              ? 'Hub'
              : 'Market\nHub'}
          </span>
        </Link>


        {/* INTELLIGENCE HUB */}
        <Link
          href={
            isSpanish
              ? '/es/inteligencia-de-mercado'
              : '/en/market-intelligence'
          }
          style={itemStyle()}
          onMouseEnter={() =>
            setHoveredItem('intelligence')
          }
          onMouseLeave={() =>
            setHoveredItem(null)
          }
        >
          <Compass
            size={50}
            strokeWidth={0.65}
            color={
                theme === 'dark'
                  ? WHITE
                  : '#000000'
              }
          />

          <span
            style={labelStyle(
              labelVisible(
                'intelligence'
              ),
              isMobile
            )}
          >
            {isMobile
              ? 'IQ'
              : 'Intelligence\nHub'}
          </span>
        </Link>


        {/* BUY */}
        <Link
          href={
            isSpanish
              ? '/es?overlay=looking'
              : '/en?overlay=looking'
          }
          style={itemStyle()}
          onMouseEnter={() =>
            setHoveredItem('buy')
          }
          onMouseLeave={() =>
            setHoveredItem(null)
          }
        >
          <Search
            size={40}
            strokeWidth={0.65}
            color={GOLD}
          />

          <span
            style={labelStyle(
              labelVisible('buy'),
              isMobile
            )}
          >
            {isSpanish
            ? (
                isMobile
                  ? 'Compra'
                  : 'Comprar\nAlquilar\nArrendar'
              )
            : (
                isMobile
                  ? 'Buy'
                  : 'Buy\nRent\nLease'
              )}
          </span>
        </Link>


        {/* SELL */}
        <Link
          href={
              isSpanish
                ? '/es?overlay=posting'
                : '/en?overlay=posting'
            }
          style={itemStyle()}
          onMouseEnter={() =>
            setHoveredItem('sell')
          }
          onMouseLeave={() =>
            setHoveredItem(null)
          }
        >
          <Megaphone
            size={40}
            strokeWidth={0.65}
            color={GOLD}
          />

          <span
            style={labelStyle(
              labelVisible('sell'),
              isMobile
            )}
          >
            {isSpanish
            ? (
                isMobile
                  ? 'Vende'
                  : 'Vender\nAlquilar\nArrendar'
              )
            : (
                isMobile
                  ? 'Sell'
                  : 'Sell\nRent-Out\nLease-Out'
              )}
          </span>
        </Link>


        {/* SWIPE */}
        <Link
          href={
            isSpanish
              ? '/es/deslizar'
              : '/en/swipe'
          }
          style={itemStyle()}
          onMouseEnter={() =>
            setHoveredItem('swipe')
          }
          onMouseLeave={() =>
            setHoveredItem(null)
          }
        >
          <ArrowLeftRight
            size={30}
            strokeWidth={0.65}
            color={UTILITY_ORANGE}
          />

          <span
            style={labelStyle(
              labelVisible('swipe'),
              isMobile
            )}
          >
            {isSpanish
            ? 'Deslizar'
            : 'Swipe'}
          </span>
        </Link>


        {/* FAVORITES */}
        <Link
          href={
            isSpanish
              ? '/es/favoritos'
              : '/en/favorites'
          }
          style={itemStyle()}
          onMouseEnter={() =>
            setHoveredItem('favorites')
          }
          onMouseLeave={() =>
            setHoveredItem(null)
          }
        >
          <Heart
            size={30}
            strokeWidth={0.65}
            color={UTILITY_ORANGE}
          />

          <span
            style={labelStyle(
              labelVisible('favorites'),
              isMobile
            )}
          >
            {isSpanish
          ? (
              isMobile
                ? 'Favs'
                : 'Favoritos'
            )
          : (
              isMobile
                ? 'Favs'
                : 'Favorites'
            )}
          </span>
        </Link>


        {/* PACKAGES */}
        <Link
          href={
              isSpanish
                ? '/es/inteligencia-de-mercado/paquetes'
                : '/en/market-intelligence/packages'
            }
          style={itemStyle()}
          onMouseEnter={() =>
            setHoveredItem('packages')
          }
          onMouseLeave={() =>
            setHoveredItem(null)
          }
        >
          <Package
            size={30}
            strokeWidth={0.65}
            color={UTILITY_ORANGE}
          />

          <span
            style={labelStyle(
              labelVisible('packages'),
              isMobile
            )}
          >
            {isSpanish
            ? (
                isMobile
                  ? 'Paq.'
                  : 'Paquetes'
              )
            : (
                isMobile
                  ? 'Packs'
                  : 'Packages'
              )}
          </span>
        </Link>


        {/* LANGUAGE */}
        <Link
          href={languageHref}
          style={itemStyle()}
          onMouseEnter={() =>
            setHoveredItem('language')
          }
          onMouseLeave={() =>
            setHoveredItem(null)
          }
        >
          <span
            style={{
              color:
                theme === 'dark'
                  ? WHITE
                  : '#000000',
              fontSize: '12px',
              fontWeight: 300,
              lineHeight: '30px',
              letterSpacing: '.03em'
            }}
          >
            {isSpanish
            ? 'EN'
            : 'ES'}
          </span>

          <span
            style={labelStyle(
              labelVisible('language'),
              isMobile
            )}
          >
            {isSpanish
            ? 'English'
            : 'Español'}
          </span>
        </Link>

        {/* APPEARANCE */}
          <button
            type="button"
            aria-label={
              theme === 'dark'
                ? 'Switch to light mode'
                : 'Switch to dark mode'
            }
            title={
              theme === 'dark'
                ? 'Light mode'
                : 'Dark mode'
            }
            onClick={onThemeToggle}
            onMouseEnter={() =>
              setHoveredItem('appearance')
            }
            onMouseLeave={() =>
              setHoveredItem(null)
            }
            style={{
              ...itemStyle(),
            }}
          >
            <span
              style={{
                width: 42,
                height: 42,

                border:
                  theme === 'dark'
                    ? '1px solid rgba(255,255,255,.22)'
                    : '1px solid rgba(0,0,0,.22)',

                borderRadius: 999,

                background:
                  theme === 'dark'
                    ? 'rgba(255,255,255,.06)'
                    : 'rgba(0,0,0,.05)',

                color:
                  theme === 'dark'
                    ? '#ffffff'
                    : '#000000',

                fontSize: '1.35rem',
                lineHeight: 1,

                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',

                boxSizing: 'border-box',
                flexShrink: 0,

                transition:
                  'color .25s ease, background .25s ease, border-color .25s ease',
              }}
            >
              ◐
            </span>

            <span
              style={labelStyle(
                labelVisible('appearance'),
                isMobile
              )}
            >
              {theme === 'dark'
                ? 'Light Mode'
                : 'Dark Mode'}
            </span>
          </button>

            </nav>

    </div>

  )

}


export default function TopBar(
  props: TopBarProps
) {

  return (
    <Suspense fallback={null}>
      <TopBarContent {...props} />
    </Suspense>
  )

}


const stickyShell = (
  theme: 'dark' | 'light'
) => ({
  position:
    'sticky' as const,

  top: '1rem',

  zIndex: 3000,

  width: 'fit-content',

  maxWidth: '100%',

  margin: '0 auto',

  padding: '.55rem .7rem',

  background:
    theme === 'dark'
      ? 'rgba(0, 0, 0, .88)'
      : 'rgba(255, 255, 255, .92)',

  backdropFilter:
    'blur(14px)',

  WebkitBackdropFilter:
    'blur(14px)',

  border:
    theme === 'dark'
      ? '1px solid rgba(255,255,255,.07)'
      : '1px solid rgba(0,0,0,.10)',

  borderRadius:
    '18px',

  boxShadow:
    theme === 'dark'
      ? '0 8px 30px rgba(0,0,0,.28)'
      : '0 8px 30px rgba(0,0,0,.14)',

  transition:
    'background .25s ease, border-color .25s ease, box-shadow .25s ease',
})


const navContainer = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'center',
  gap: 'clamp(.35rem, 1.5vw, 1.15rem)',
  flexWrap: 'nowrap' as const,
  width: '100%',
  overflowX: 'auto' as const,
  scrollbarWidth: 'none' as const,
  msOverflowStyle: 'none' as const
}


const hamburgerButton = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'transparent',
  border: 'none',
  padding: '.2rem',
  cursor: 'pointer',
  WebkitTapHighlightColor:
    'transparent'
}

const floatingHamburgerShell = (
  theme: 'dark' | 'light'
) => ({
  position:
    'fixed' as const,

  top:
    '1rem',

  left:
    '50%',

  transform:
    'translateX(-50%)',

  zIndex:
    9999,

  width:
    'fit-content',

  padding:
    '.55rem .7rem',

  background:
    theme === 'dark'
      ? 'rgba(0, 0, 0, .88)'
      : 'rgba(255, 255, 255, .92)',

  backdropFilter:
    'blur(14px)',

  WebkitBackdropFilter:
    'blur(14px)',

  border:
    theme === 'dark'
      ? '1px solid rgba(255,255,255,.07)'
      : '1px solid rgba(0,0,0,.10)',

  borderRadius:
    '18px',

  boxShadow:
    theme === 'dark'
      ? '0 8px 30px rgba(0,0,0,.28)'
      : '0 8px 30px rgba(0,0,0,.14)',

  transition:
    'background .25s ease, border-color .25s ease, box-shadow .25s ease'
})

const floatingTopBarShell = (
  theme: 'dark' | 'light'
) => ({
  position:
    'fixed' as const,

  top:
    '1rem',

  left:
    '50%',

  transform:
    'translateX(-50%)',

  zIndex:
    9999,

  width:
    'fit-content',

  maxWidth:
    'calc(100vw - 2rem)',

  margin:
    0,

  padding:
    '.55rem .7rem',

  background:
    theme === 'dark'
      ? 'rgba(0, 0, 0, .88)'
      : 'rgba(255, 255, 255, .92)',

  backdropFilter:
    'blur(14px)',

  WebkitBackdropFilter:
    'blur(14px)',

  border:
    theme === 'dark'
      ? '1px solid rgba(255,255,255,.07)'
      : '1px solid rgba(0,0,0,.10)',

  borderRadius:
    '18px',

  boxShadow:
    theme === 'dark'
      ? '0 8px 30px rgba(0,0,0,.28)'
      : '0 8px 30px rgba(0,0,0,.14)',

  transition:
    'background .25s ease, border-color .25s ease, box-shadow .25s ease'
})