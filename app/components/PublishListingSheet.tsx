'use client'

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type TouchEvent
} from 'react'

import Link from 'next/link'

import {
  BadgeDollarSign,
  CalendarClock,
  X
} from 'lucide-react'

type SupportedLanguage = 'en' | 'es'

type PublishListingSheetProps = {
  language: SupportedLanguage
  open: boolean
  onClose: () => void
}

const ANIMATION_DURATION = 260
const SWIPE_CLOSE_DISTANCE = 120

export default function PublishListingSheet({
  language,
  open,
  onClose
}: PublishListingSheetProps) {
  const [mounted, setMounted] =
    useState(open)

  const [entered, setEntered] =
    useState(false)

  const [dragOffset, setDragOffset] =
    useState(0)

  const [prefersReducedMotion, setPrefersReducedMotion] =
    useState(false)

  const sheetRef =
    useRef<HTMLElement | null>(null)

  const closeButtonRef =
    useRef<HTMLButtonElement | null>(null)

  const previouslyFocusedRef =
    useRef<HTMLElement | null>(null)

  const touchStartYRef =
    useRef<number | null>(null)

  const closeTimerRef =
    useRef<ReturnType<typeof setTimeout> | null>(
      null
    )

  const closingRef =
    useRef(false)

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
  }, [
    mounted,
    requestClose
  ])

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

  if (!mounted) return null

  const labels =
    language === 'es'
      ? {
          title: 'Publicar una Propiedad',
          intro:
            'Elija cómo desea publicar su propiedad.',
          sale: 'Propiedad en Venta',
          saleDescription:
            'Publique una propiedad disponible para compra.',
          rent: 'Propiedad en Alquiler o Arrendamiento',
          rentDescription:
            'Publique una propiedad disponible para alquiler o arrendamiento.',
          close: 'Cerrar'
        }
      : {
          title: 'Publish a Property',
          intro:
            'Choose how you want to publish your property.',
          sale: 'Property for Sale',
          saleDescription:
            'Publish a property available for purchase.',
          rent: 'Property for Rent or Lease',
          rentDescription:
            'Publish a property available for rent or lease.',
          close: 'Close'
        }

  const saleHref =
    language === 'es'
      ? '/es/vender'
      : '/en/sell'

  const rentHref =
    language === 'es'
      ? '/es/alquilar-arrendar'
      : '/en/rent-out-lease-out'

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
          transform: sheetTransform,
          transition:
            dragOffset > 0 ||
            prefersReducedMotion
              ? 'none'
              : `transform ${animationDuration}ms cubic-bezier(.16, 1, .3, 1)`
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="publish-listing-sheet-title"
        aria-describedby="publish-listing-sheet-description"
        onClick={event => {
          event.stopPropagation()
        }}
      >
        <div style={accentBar} />

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
          <div>
            <h2
              id="publish-listing-sheet-title"
              style={title}
            >
              {labels.title}
            </h2>

            <p
              id="publish-listing-sheet-description"
              style={description}
            >
              {labels.intro}
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

        <div style={optionGrid}>
          <Link
            href={saleHref}
            style={optionCard}
          >
            <div style={iconWrap}>
              <BadgeDollarSign
                size={42}
                strokeWidth={0.8}
                color="#C7A44B"
              />
            </div>

            <div>
              <div style={optionTitle}>
                {labels.sale}
              </div>

              <div style={optionDescription}>
                {labels.saleDescription}
              </div>
            </div>
          </Link>

          <Link
            href={rentHref}
            style={optionCard}
          >
            <div style={iconWrap}>
              <CalendarClock
                size={42}
                strokeWidth={0.8}
                color="#C7A44B"
              />
            </div>

            <div>
              <div style={optionTitle}>
                {labels.rent}
              </div>

              <div style={optionDescription}>
                {labels.rentDescription}
              </div>
            </div>
          </Link>
        </div>
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
  WebkitBackdropFilter: 'blur(8px)',
  zIndex: 1100
}

const sheet = {
  width: '100%',
  maxWidth: '760px',
  background: '#141414',
  border: '1px solid #333',
  borderRadius: '24px 24px 0 0',
  overflow: 'hidden',
  boxShadow:
    '0 -24px 80px rgba(0, 0, 0, .6)',
  willChange: 'transform'
}

const accentBar = {
  width: '100%',
  height: '.22rem',
  background: '#C7A44B'
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
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: '1.5rem',
  padding: '1rem 1.5rem 1.5rem',
  borderBottom: '1px solid #2d2d2d'
}

const title = {
  margin: 0,
  paddingRight: '2.5rem',
  color: '#fff',
  fontSize:
    'clamp(1.6rem, 5vw, 2.3rem)',
  lineHeight: 1.15
}

const description = {
  margin: '.75rem 0 0',
  color: '#aaa',
  fontSize: '1rem',
  lineHeight: 1.55
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
  cursor: 'pointer'
}

const optionGrid = {
  display: 'grid',
  gridTemplateColumns:
    'repeat(auto-fit, minmax(250px, 1fr))',
  gap: '1rem',
  padding: '1.5rem'
}

const optionCard = {
  display: 'grid',
  gridTemplateColumns:
    'auto minmax(0, 1fr)',
  alignItems: 'start',
  gap: '1rem',
  padding: '1.25rem',
  color: '#fff',
  background: '#1b1b1b',
  border: '1px solid #333',
  borderRadius: '16px',
  textDecoration: 'none',
  WebkitTapHighlightColor: 'transparent'
}

const iconWrap = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '3.25rem',
  height: '3.25rem'
}

const optionTitle = {
  color: '#fff',
  fontSize: '1.1rem',
  fontWeight: 600,
  lineHeight: 1.3
}

const optionDescription = {
  marginTop: '.4rem',
  color: '#999',
  fontSize: '.88rem',
  lineHeight: 1.5
}