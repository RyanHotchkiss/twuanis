'use client'

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type TouchEvent
} from 'react'

import {
  X,
  LayoutDashboard
} from 'lucide-react'

import type {
  MarketIntelligencePackage,
  SupportedLanguage
} from '@/lib/marketIntelligencePackages'

type PackageModalProps = {
  pkg: MarketIntelligencePackage | null
  language: SupportedLanguage
  open: boolean
  onClose: () => void
  onChoosePackage?: (
    pkg: MarketIntelligencePackage
  ) => void
}

const ANIMATION_DURATION = 260
const SWIPE_CLOSE_DISTANCE = 120

export default function PackageModal({
  pkg,
  language,
  open,
  onClose,
  onChoosePackage
}: PackageModalProps) {
  const [mounted, setMounted] =
    useState(open)

  const [entered, setEntered] =
    useState(false)

  const [dragOffset, setDragOffset] =
    useState(0)

  const closeTimerRef =
    useRef<ReturnType<typeof setTimeout> | null>(
      null
    )

  const touchStartYRef =
    useRef<number | null>(null)

  const closingRef =
    useRef(false)

    const sheetRef =
    useRef<HTMLElement | null>(null)

    const closeButtonRef =
    useRef<HTMLButtonElement | null>(null)

    const previouslyFocusedRef =
    useRef<HTMLElement | null>(null)

    const [prefersReducedMotion, setPrefersReducedMotion] =
    useState(false)

    const animationDuration =
        prefersReducedMotion
            ? 0
            : ANIMATION_DURATION

  const requestClose =
    useCallback(() => {
      if (closingRef.current) return

      closingRef.current = true
      setDragOffset(0)
      setEntered(false)

      closeTimerRef.current =
        setTimeout(() => {
          onClose()
          closingRef.current = false
        }, animationDuration)
    }, [
        animationDuration,
        onClose
        ])

    useEffect(() => {
        const mediaQuery =
            window.matchMedia(
            '(prefers-reduced-motion: reduce)'
            )

        const updatePreference = () => {
            setPrefersReducedMotion(
            mediaQuery.matches
            )
        }

        updatePreference()

        mediaQuery.addEventListener(
            'change',
            updatePreference
        )

        return () => {
            mediaQuery.removeEventListener(
            'change',
            updatePreference
            )
        }
        }, [])

  useEffect(() => {
    if (open) {
      setMounted(true)
      closingRef.current = false

      const frame =
        requestAnimationFrame(() => {
          setEntered(true)
        })

      return () => {
        cancelAnimationFrame(frame)
      }
    }

    if (mounted) {
      setEntered(false)

      const timer =
        setTimeout(() => {
          setMounted(false)
          setDragOffset(0)
        }, animationDuration)

      return () => {
        clearTimeout(timer)
      }
    }
  }, [
  open,
  mounted,
  animationDuration
])

  useEffect(() => {
    if (!mounted) return

    const previousOverflow =
      document.body.style.overflow

    document.body.style.overflow =
      'hidden'

    const handleKeyDown = (
      event: KeyboardEvent
    ) => {
      if (event.key === 'Escape') {
        requestClose()
      }
    }

    window.addEventListener(
      'keydown',
      handleKeyDown
    )

    return () => {
      document.body.style.overflow =
        previousOverflow

      window.removeEventListener(
        'keydown',
        handleKeyDown
      )
    }
  }, [mounted, requestClose])

  useEffect(() => {
        if (!mounted) return

        previouslyFocusedRef.current =
            document.activeElement instanceof HTMLElement
            ? document.activeElement
            : null

        const focusTimer =
            window.setTimeout(() => {
            sheetRef.current?.focus()
            }, animationDuration)

        return () => {
            window.clearTimeout(focusTimer)

            previouslyFocusedRef.current?.focus()
        }
        }, [
        mounted,
        animationDuration
        ])

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) {
        clearTimeout(
          closeTimerRef.current
        )
      }
    }
  }, [])

  if (!mounted || !pkg) {
    return null
  }

  const labels =
    language === 'es'
      ? {
          included: 'Motores incluidos',
          free: 'Gratis',
          monthly: 'por mes',
          future: 'Motor futuro',
          dashboard: 'Panel Inmobiliario',
          choose: 'Elegir paquete',
          close: 'Cerrar'
        }
      : {
          included: 'Included Engines',
          free: 'Free',
          monthly: 'per month',
          future: 'Future Engine',
          dashboard: 'Real Estate Dashboard',
          choose: 'Choose Package',
          close: 'Close'
        }

  function handleSheetKeyDown(
        event: ReactKeyboardEvent<HTMLElement>
        ) {
        if (event.key !== 'Tab') return

        const sheet =
            sheetRef.current

        if (!sheet) return

        const focusable =
            Array.from(
            sheet.querySelectorAll<HTMLElement>(
                [
                'button:not([disabled])',
                'a[href]',
                'input:not([disabled])',
                'select:not([disabled])',
                'textarea:not([disabled])',
                '[tabindex]:not([tabindex="-1"])'
                ].join(',')
            )
            )

        if (focusable.length === 0) {
            event.preventDefault()
            return
        }

        const first =
            focusable[0]

        const last =
            focusable[
            focusable.length - 1
            ]

        if (
            event.shiftKey &&
            document.activeElement === first
        ) {
            event.preventDefault()
            last.focus()
            return
        }

        if (
            !event.shiftKey &&
            document.activeElement === last
        ) {
            event.preventDefault()
            first.focus()
        }
        }

  function handleTouchStart(
    event: TouchEvent<HTMLDivElement>
  ) {
    touchStartYRef.current =
      event.touches[0]?.clientY ?? null

    setDragOffset(0)
  }

  function handleTouchMove(
    event: TouchEvent<HTMLDivElement>
  ) {
    if (
      touchStartYRef.current === null
    ) {
      return
    }

    const currentY =
      event.touches[0]?.clientY

    if (currentY === undefined) return

    const movement =
      currentY -
      touchStartYRef.current

    setDragOffset(
      Math.max(0, movement)
    )
  }

  function handleTouchEnd() {
    touchStartYRef.current = null

    if (
      dragOffset >=
      SWIPE_CLOSE_DISTANCE
    ) {
      requestClose()
      return
    }

    setDragOffset(0)
  }

  const sheetTransform =
    dragOffset > 0
      ? `translateY(${dragOffset}px)`
      : entered
        ? 'translateY(0)'
        : 'translateY(105%)'

  return (
    <div
      style={{
        ...backdrop,
        transition:
            `opacity ${animationDuration}ms ease`,
        opacity:
            entered
            ? 1
            : 0,
        pointerEvents:
            entered
            ? 'auto'
            : 'none'
        }}
      onClick={requestClose}
      role="presentation"
    >
      <section
            ref={sheetRef}
            tabIndex={-1}
            onKeyDown={handleSheetKeyDown}
            style={{
          ...sheet,
          borderTopColor: pkg.color,
          transform: sheetTransform,
          transition:
            dragOffset > 0 ||
            prefersReducedMotion
                ? 'none'
                : `transform ${animationDuration}ms cubic-bezier(.16, 1, .3, 1)`
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="package-sheet-title"
        aria-describedby="package-sheet-description"                
        onClick={event => {
          event.stopPropagation()
        }}
      >

        <div
            style={{
                ...accentBar,
                background: pkg.color
            }}
            />

        <div
          style={grabArea}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
        >
          <div style={grabHandle} />
        </div>

        <header style={sheetHeader}>
          <div style={headerText}>
            <h2
              id="package-sheet-title"
              style={title}
            >
              {pkg.name[language]}
            </h2>

            <p
            id="package-sheet-description"
            style={description}
            >
              {pkg.description[language]}
            </p>
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            onClick={requestClose}
            style={closeButton}
            aria-label={labels.close}
          >
            <X
              size={28}
              strokeWidth={1}
            />
          </button>
        </header>

        <div style={scrollContent}>
          <section style={priceSection}>
            {pkg.price ? (
              <>
                <div style={priceRow}>
                  <div
                    style={{
                      ...primaryPrice,
                      color: pkg.color
                    }}
                  >
                    $
                    {pkg.price.usd.toLocaleString()}
                  </div>

                  <div style={priceDivider}>
                    /
                  </div>

                  <div style={secondaryPrice}>
                    ₡
                    {pkg.price.crc.toLocaleString()}
                  </div>
                </div>

                <div style={monthly}>
                  {labels.monthly}
                </div>
              </>
            ) : (
              <div
                style={{
                  ...primaryPrice,
                  color: pkg.color
                }}
              >
                {labels.free}
              </div>
            )}
          </section>

          <section style={enginesSection}>
            <h3 style={heading}>
              {labels.included}
            </h3>

            <div style={engineList}>
              {pkg.engines.map(
                engine => {
                  const Icon =
                    engine.icon

                  return (
                    <article
                      key={engine.id}
                      style={{
                        ...engineCard,
                        opacity:
                            engine.future
                            ? .62
                            : 1,
                        borderStyle:
                            engine.future
                            ? 'dashed'
                            : 'solid'
                        }}
                    >
                      <div
                        style={
                          engineIconWrap
                        }
                      >
                        <Icon
                          size={34}
                          strokeWidth={1}
                          color="#C7A44B"
                        />
                      </div>

                      <div>
                        <div
                          style={engineName}
                        >
                          {
                            engine.name[
                              language
                            ]
                          }
                        </div>

                        <div
                          style={
                            enginePurpose
                          }
                        >
                          {
                            engine.purpose[
                              language
                            ]
                          }
                        </div>

                        {engine.future && (
                          <div
                            style={{
                              ...futureLabel,
                              color:
                                pkg.color
                            }}
                          >
                            {labels.future}
                          </div>
                        )}
                      </div>
                    </article>
                  )
                }
              )}
            </div>
          </section>
        </div>

              <article style={dashboardCard}>
                <div style={engineIconWrap}>
                    <LayoutDashboard
                    size={34}
                    strokeWidth={1}
                    color="#C7A44B"
                    />
                </div>

                <div>
                    <div style={engineName}>
                    {labels.dashboard}
                    </div>

                    <div style={enginePurpose}>
                    {pkg.dashboardDescription[language]}
                    </div>
                </div>
                </article>

        <footer style={sheetFooter}>
          <button
            type="button"
            onClick={() => {
              onChoosePackage?.(pkg)
            }}
            style={{
              ...chooseButton,
              borderColor: pkg.color,
              color: pkg.color
            }}
          >
            {labels.choose}
          </button>
        </footer>
      </section>
    </div>
  )
}

const backdrop = {
  position: 'fixed' as const,
  inset: 0,
  display: 'flex',
  alignItems: 'flex-end',
  justifyContent: 'center',
  background: 'rgba(0, 0, 0, .78)',
  backdropFilter: 'blur(8px)',
  WebkitBackdropFilter:
    'blur(8px)',
  zIndex: 1000
}

const sheet = {
  width: '100%',
  maxWidth: '960px',
  height: 'min(92vh, 900px)',
  display: 'grid',
  gridTemplateRows:
  'auto auto auto minmax(0, 1fr) auto',
  background: '#141414',
  border: '1px solid #333',
  borderTop: '3px solid',
  borderRadius: '24px 24px 0 0',
  overflow: 'hidden',
  boxShadow:
    '0 -24px 80px rgba(0, 0, 0, .6)',
  willChange: 'transform'
}

const grabArea = {
  display: 'flex',
  justifyContent: 'center',
  padding: '.75rem 0 .35rem',
  cursor: 'grab',
  touchAction: 'none'
}

const grabHandle = {
  width: '3.5rem',
  height: '.3rem',
  borderRadius: '999px',
  background: '#555'
}

const sheetHeader = {
  position: 'relative' as const,
  display: 'flex',
  justifyContent:
    'space-between',
  alignItems: 'flex-start',
  gap: '1.5rem',
  padding:
    '1rem 1.5rem 1.25rem',
  borderBottom:
    '1px solid #2d2d2d',
  background: '#141414',
  zIndex: 2
}

const headerText = {
  minWidth: 0
}

const title = {
  margin: 0,
  paddingRight: '2.5rem',
  color: '#fff',
  fontSize:
    'clamp(1.6rem, 4vw, 2.35rem)',
  lineHeight: 1.15
}

const description = {
  maxWidth: '760px',
  margin: '.75rem 0 0',
  color: '#aaa',
  fontSize: '1rem',
  lineHeight: 1.6
}

const closeButton = {
  position: 'absolute' as const,
  top: '.8rem',
  right: '1rem',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '2.75rem',
  height: '2.75rem',
  padding: 0,
  color: '#aaa',
  background: '#222',
  border: '1px solid #3a3a3a',
  borderRadius: '999px',
  cursor: 'pointer',
  WebkitTapHighlightColor:
    'transparent'
}

const scrollContent = {
  minHeight: 0,
  overflowY: 'auto' as const,
  overscrollBehavior:
    'contain' as const,
  padding: '1.5rem',
  WebkitOverflowScrolling:
    'touch' as const
}

const priceSection = {
  paddingBottom: '1.5rem',
  borderBottom:
    '1px solid #2d2d2d'
}

const priceRow = {
  display: 'flex',
  flexWrap: 'wrap' as const,
  alignItems: 'baseline',
  gap: '.65rem'
}

const primaryPrice = {
  fontSize:
    'clamp(2rem, 7vw, 3rem)',
  fontWeight: 700,
  lineHeight: 1
}

const priceDivider = {
  color: '#555',
  fontSize: '1.5rem'
}

const secondaryPrice = {
  color: '#ddd',
  fontSize:
    'clamp(1.25rem, 4vw, 1.75rem)',
  fontWeight: 600
}

const monthly = {
  marginTop: '.5rem',
  color: '#777',
  fontSize: '.9rem'
}

const enginesSection = {
  paddingTop: '1.5rem'
}

const heading = {
  margin: '0 0 1rem',
  color: '#ff3b00',
  fontSize: '1rem',
  textTransform:
    'uppercase' as const,
  letterSpacing: '.08em'
}

const engineList = {
  display: 'grid',
  gridTemplateColumns:
    'repeat(auto-fit, minmax(260px, 1fr))',
  gap: '1rem'
}

const engineCard = {
  display: 'grid',
  gridTemplateColumns:
    'auto 1fr',
  gap: '1rem',
  alignItems: 'start',
  padding: '1rem',
  background: '#1b1b1b',
  border: '1px solid #303030',
  borderRadius: '14px'
}

const engineIconWrap = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '2.75rem',
  height: '2.75rem'
}

const engineName = {
  color: '#fff',
  fontSize: '1.05rem',
  fontWeight: 600,
  lineHeight: 1.3
}

const enginePurpose = {
  marginTop: '.35rem',
  color: '#999',
  fontSize: '.9rem',
  lineHeight: 1.5
}

const futureLabel = {
  marginTop: '.55rem',
  fontSize: '.72rem',
  fontWeight: 700,
  textTransform:
    'uppercase' as const,
  letterSpacing: '.08em'
}

const accentBar = {
  width: '100%',
  height: '.22rem',
  flexShrink: 0
}

const sheetFooter = {
  padding: '1rem 1.5rem',
  background:
    'linear-gradient(to top, #141414 70%, rgba(20, 20, 20, .92))',
  borderTop:
    '1px solid #2d2d2d',
  zIndex: 2
}

const chooseButton = {
  width: '100%',
  padding: '1rem 1.25rem',
  background: '#1b1b1b',
  border: '2px solid',
  borderRadius: '12px',
  fontSize: '1rem',
  fontWeight: 700,
  cursor: 'pointer',
  WebkitTapHighlightColor:
    'transparent'
}

const dashboardCard = {
  display: 'grid',
  gridTemplateColumns: 'auto 1fr',
  gap: '1rem',
  alignItems: 'start',
  marginTop: '1rem',
  padding: '1rem',
  background: '#1b1b1b',
  border: '1px solid #303030',
  borderRadius: '14px'
}