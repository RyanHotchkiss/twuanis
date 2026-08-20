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
}


const GOLD = '#C7A44B'
const WHITE = '#FFFFFF'
const UTILITY_ORANGE = '#ff3b00'


function TopBarContent({
  onFilterClick
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

    function handleResize() {
      setIsMobile(
        window.innerWidth <= 768
      )
    }

    handleResize()

    window.addEventListener(
      'resize',
      handleResize
    )

    return () =>
      window.removeEventListener(
        'resize',
        handleResize
      )

  }, [])


  useEffect(() => {

    let lastScrollY =
      window.scrollY

    function handleScroll() {

      const currentScrollY =
        window.scrollY

      if (currentScrollY <= 12) {

        setCollapsed(false)
        setManuallyExpanded(false)

        lastScrollY =
          currentScrollY

        return
      }

      if (
        currentScrollY >
        lastScrollY + 6 &&
        !manuallyExpanded
      ) {
        setCollapsed(true)
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
      color: '#d8d8d8',
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
      <div style={stickyShell}>
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
            color={WHITE}
          />
        </button>
      </div>
    )

  }


  return (

    <div style={stickyShell}>

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
            color={WHITE}
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
            color={WHITE}
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
              color: WHITE,
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


const stickyShell = {
  position:
    'sticky' as const,

  top: '1rem',

  zIndex: 3000,

  width: 'fit-content',

  maxWidth: '100%',

  margin: '0 auto',

  padding: '.55rem .7rem',

  background:
    'rgba(0, 0, 0, .88)',

  backdropFilter:
    'blur(14px)',

  WebkitBackdropFilter:
    'blur(14px)',

  border:
    '1px solid rgba(255,255,255,.07)',

  borderRadius:
    '18px',

  boxShadow:
    '0 8px 30px rgba(0,0,0,.28)'
}


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