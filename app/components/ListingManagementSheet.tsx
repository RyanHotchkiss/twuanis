'use client'

import Link from 'next/link'

import {
  Archive,
  Copy,
  EyeOff,
  Pencil,
  RefreshCcw,
  RotateCcw,
  Trash2,
  X
} from 'lucide-react'

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type TouchEvent
} from 'react'

type SupportedLanguage =
  | 'en'
  | 'es'

export type ListingStatus =
  | 'active'
  | 'draft'
  | 'expired'
  | 'archived'
  | 'deleted'

export type ManagedListing = {
  id: string
  title: string
  status: ListingStatus

  transactionType?:
    | 'buy'
    | 'rent'
    | 'sale'
}

type ListingManagementSheetProps = {
  language: SupportedLanguage
  listing: ManagedListing | null
  open: boolean
  onClose: () => void
  onDuplicate?: (
    listing: ManagedListing
  ) => void
  onRenew?: (
    listing: ManagedListing
  ) => void
    onUnpublish?: (
    listing: ManagedListing
  ) => void
  onArchive?: (
    listing: ManagedListing
  ) => void
  onRestore?: (
    listing: ManagedListing
  ) => void
  onRemove?: (
    listing: ManagedListing
  ) => void
}

const ANIMATION_DURATION =
  260

const SWIPE_CLOSE_DISTANCE =
  120

export default function ListingManagementSheet({
  language,
  listing,
  open,
  onClose,
  onDuplicate,
  onRenew,
  onUnpublish,
  onArchive,
  onRestore,
  onRemove
}: ListingManagementSheetProps) {
  const [
    mounted,
    setMounted
  ] = useState(open)

  const [
    entered,
    setEntered
  ] = useState(false)

  const [
    dragOffset,
    setDragOffset
  ] = useState(0)

  const [
    prefersReducedMotion,
    setPrefersReducedMotion
  ] = useState(false)

  const [
    removeConfirmationOpen,
    setRemoveConfirmationOpen
  ] = useState(false)

  const sheetRef =
    useRef<HTMLElement | null>(
      null
    )

  const previouslyFocusedRef =
    useRef<HTMLElement | null>(
      null
    )

  const touchStartYRef =
    useRef<number | null>(
      null
    )

  const closeTimerRef =
    useRef<
      ReturnType<
        typeof setTimeout
      > | null
    >(null)

  const closingRef =
    useRef(false)

  const animationDuration =
    prefersReducedMotion
      ? 0
      : ANIMATION_DURATION

  const requestClose =
    useCallback(() => {
      if (
        closingRef.current
      ) {
        return
      }

      closingRef.current =
        true

      setDragOffset(0)
      setEntered(false)
      setRemoveConfirmationOpen(
        false
      )

      closeTimerRef.current =
        setTimeout(() => {
          onClose()

          closingRef.current =
            false
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
          setRemoveConfirmationOpen(
            false
          )
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
        if (
          removeConfirmationOpen
        ) {
          setRemoveConfirmationOpen(
            false
          )
          return
        }

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
    requestClose,
    removeConfirmationOpen
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
      window.clearTimeout(
        focusTimer
      )

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

    if (
      focusable.length === 0
    ) {
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
      event.touches[0]?.clientY ??
      null

    setDragOffset(0)
  }

  function handleTouchMove(
    event: TouchEvent<HTMLDivElement>
  ) {
    if (
      touchStartYRef.current ===
      null
    ) {
      return
    }

    const currentY =
      event.touches[0]?.clientY

    if (
      currentY === undefined
    ) {
      return
    }

    const movement =
      currentY -
      touchStartYRef.current

    setDragOffset(
      Math.max(0, movement)
    )
  }

  function handleTouchEnd() {
    touchStartYRef.current =
      null

    if (
      dragOffset >=
      SWIPE_CLOSE_DISTANCE
    ) {
      requestClose()
      return
    }

    setDragOffset(0)
  }
    if (
        !mounted ||
        !listing
        ) {
        return null
        }

        const currentListing = listing

        const labels =
    language === 'es'
      ? {
          title:
            'Administrar Publicación',
          intro:
            'Administre esta publicación y su estado.',
          edit:
            'Editar Publicación',
          editDescription:
            'Actualice los detalles, las fotos y el precio de la publicación.',
          duplicate:
            'Duplicar Publicación',
          duplicateDescription:
            'Cree una copia de esta publicación. La copia se abrirá como borrador.',
          renew:
            'Renovar Publicación',
          renewDescription:
            'Actualice la fecha de publicación y extienda su visibilidad.',
                    unpublish:
            'Despublicar',
          unpublishDescription:
            'Retire la publicación del mercado público y devuélvala a borrador.',
          archive:
            'Archivar Publicación',
          archiveDescription:
            'Retire la publicación del mercado público y conserve su historial.',
          restore:
            'Restaurar Publicación',
          restoreDescription:
            'Devuelva esta publicación archivada a borrador para revisarla antes de publicarla.',
          remove:
            'Eliminar de MarketHub',
          removeDescription:
            'Retire esta publicación de su MarketHub y del mercado público.',
          confirmRemoveTitle:
            '¿Eliminar esta publicación de MarketHub?',
          confirmRemoveDescription:
            'La publicación dejará de aparecer en su MarketHub y en el mercado público. Twuanis conservará el registro internamente.',
          cancel:
            'Cancelar',
          confirmRemove:
            'Eliminar Publicación',
          close:
            'Cerrar'
        }
      : {
          title:
            'Manage Listing',
          intro:
            'Manage this listing and its publication status.',
          edit:
            'Edit Listing',
          editDescription:
            'Update the listing details, photos, and pricing.',
          duplicate:
            'Duplicate Listing',
          duplicateDescription:
            'Create a copy of this listing. The copy opens as a draft.',
          renew:
            'Renew Listing',
          renewDescription:
            'Refresh the publication date and extend its visibility.',
                    unpublish:
            'Unpublish Listing',
          unpublishDescription:
            'Remove the listing from the public marketplace and return it to draft.',
          archive:
            'Archive Listing',
          archiveDescription:
            'Remove the listing from the public marketplace while preserving its history.',
          restore:
            'Restore Listing',
          restoreDescription:
            'Return this archived listing to draft for review before publishing.',
          remove:
            'Remove from MarketHub',
          removeDescription:
            'Remove this listing from your MarketHub and the public marketplace.',
          confirmRemoveTitle:
            'Remove this listing from MarketHub?',
          confirmRemoveDescription:
            'The listing will no longer appear in your MarketHub or the public marketplace. Twuanis will retain the record internally.',
          cancel:
            'Cancel',
          confirmRemove:
            'Remove Listing',
          close:
            'Close'
        }

    const isRental =
      currentListing.transactionType ===
        'rent'

    const editHref =
      language === 'es'
        ? isRental
          ? `/es/alquilar-arrendar/editar/${currentListing.id}`
          : `/es/vender/editar/${currentListing.id}`
        : isRental
          ? `/en/rent-out-lease-out/edit/${currentListing.id}`
          : `/en/sell/edit/${currentListing.id}`

  const canRenew =
    currentListing.status === 'active' ||
    currentListing.status === 'expired'
  const canUnpublish =
    currentListing.status === 'active'
  const canArchive =
    currentListing.status === 'active'
  const canRestore =
    currentListing.status === 'archived'
  const canRemove =
    currentListing.status !== 'deleted'
  function handleDuplicate() {
    onDuplicate?.(currentListing)
  }
  function handleRenew() {
    if (!canRenew) return
    onRenew?.(currentListing)
  }
    function handleUnpublish() {
    if (
      !canUnpublish
    ) {
      return
    }
    onUnpublish?.(
      currentListing
    )
    requestClose()
  }
  
  function handleArchive() {
    if (!canArchive) return
    onArchive?.(currentListing)
    requestClose()
  }

  function handleRestore() {
    if (!canRestore) return
    onRestore?.(currentListing)
    requestClose()
  }

  function openRemoveConfirmation() {
    if (!canRemove) return

    setRemoveConfirmationOpen(
      true
    )
  }

  function closeRemoveConfirmation() {
    setRemoveConfirmationOpen(
      false
    )
  }

  function confirmRemove() {
    if (!canRemove) return

    onRemove?.(currentListing)

    setRemoveConfirmationOpen(
      false
    )

    requestClose()
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
        aria-labelledby="listing-management-title"
        aria-describedby="listing-management-description"
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
              id="listing-management-title"
              style={title}
            >
              {labels.title}
            </h2>

            <p
              id="listing-management-description"
              style={description}
            >
              {currentListing.title}
            </p>

            <p style={introText}>
              {labels.intro}
            </p>
          </div>

          <button
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
          {!removeConfirmationOpen ? (
            <div style={actionList}>
              <Link
                href={editHref}
                style={actionCard}
              >
                <div style={actionIconWrap}>
                  <Pencil
                    size={30}
                    strokeWidth={1}
                    color="#C7A44B"
                  />
                </div>

                <div>
                  <div style={actionTitle}>
                    {labels.edit}
                  </div>

                  <div style={actionDescription}>
                    {labels.editDescription}
                  </div>
                </div>
              </Link>

              <button
                type="button"
                onClick={handleDuplicate}
                style={actionButton}
              >
                <div style={actionIconWrap}>
                  <Copy
                    size={30}
                    strokeWidth={1}
                    color="#C7A44B"
                  />
                </div>

                <div>
                  <div style={actionTitle}>
                    {labels.duplicate}
                  </div>

                  <div style={actionDescription}>
                    {labels.duplicateDescription}
                  </div>
                </div>
              </button>

              {canRenew && (
                <button
                  type="button"
                  onClick={handleRenew}
                  style={actionButton}
                >
                  <div style={actionIconWrap}>
                    <RefreshCcw
                      size={30}
                      strokeWidth={1}
                      color="#C7A44B"
                    />
                  </div>

                  <div>
                    <div style={actionTitle}>
                      {labels.renew}
                    </div>

                    <div style={actionDescription}>
                      {labels.renewDescription}
                    </div>
                  </div>
                </button>
              )}

              {canUnpublish && (
                <button
                  type="button"
                  onClick={
                    handleUnpublish
                  }
                  style={
                    actionButton
                  }
                >
                  <div
                    style={
                      actionIconWrap
                    }
                  >
                    <EyeOff
                      size={30}
                      strokeWidth={1}
                      color="#C7A44B"
                    />
                  </div>

                  <div>
                    <div
                      style={
                        actionTitle
                      }
                    >
                      {
                        labels.unpublish
                      }
                    </div>

                    <div
                      style={
                        actionDescription
                      }
                    >
                      {
                        labels.unpublishDescription
                      }
                    </div>
                  </div>
                </button>
              )}

              {canArchive && (
                <button
                  type="button"
                  onClick={handleArchive}
                  style={actionButton}
                >
                  <div style={actionIconWrap}>
                    <Archive
                      size={30}
                      strokeWidth={1}
                      color="#C7A44B"
                    />
                  </div>

                  <div>
                    <div style={actionTitle}>
                      {labels.archive}
                    </div>

                    <div style={actionDescription}>
                      {labels.archiveDescription}
                    </div>
                  </div>
                </button>
              )}

              {canRestore && (
                <button
                  type="button"
                  onClick={handleRestore}
                  style={actionButton}
                >
                  <div style={actionIconWrap}>
                    <RotateCcw
                      size={30}
                      strokeWidth={1}
                      color="#C7A44B"
                    />
                  </div>

                  <div>
                    <div style={actionTitle}>
                      {labels.restore}
                    </div>

                    <div style={actionDescription}>
                      {labels.restoreDescription}
                    </div>
                  </div>
                </button>
              )}

              {canRemove && (
                <button
                  type="button"
                  onClick={openRemoveConfirmation}
                  style={{
                    ...actionButton,
                    ...dangerAction
                  }}
                >
                  <div style={actionIconWrap}>
                    <Trash2
                      size={30}
                      strokeWidth={1}
                      color="#dc143c"
                    />
                  </div>

                  <div>
                    <div
                      style={{
                        ...actionTitle,
                        color: '#dc143c'
                      }}
                    >
                      {labels.remove}
                    </div>

                    <div style={actionDescription}>
                      {labels.removeDescription}
                    </div>
                  </div>
                </button>
              )}
            </div>
          ) : (
            <div style={confirmationCard}>
              <div style={confirmationIconWrap}>
                <Trash2
                  size={42}
                  strokeWidth={1}
                  color="#dc143c"
                />
              </div>

              <h3 style={confirmationTitle}>
                {labels.confirmRemoveTitle}
              </h3>

              <p style={confirmationDescription}>
                {labels.confirmRemoveDescription}
              </p>

              <div style={confirmationButtons}>
                <button
                  type="button"
                  onClick={closeRemoveConfirmation}
                  style={cancelButton}
                >
                  {labels.cancel}
                </button>

                <button
                  type="button"
                  onClick={confirmRemove}
                  style={removeButton}
                >
                  {labels.confirmRemove}
                </button>
              </div>
            </div>
          )}
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
  zIndex: 1200
}

const sheet = {
  width: '100%',
  maxWidth: '760px',
  maxHeight: '92vh',
  display: 'grid',
  gridTemplateRows:
    'auto auto auto minmax(0, 1fr)',
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
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: '1.5rem',
  padding: '1rem 1.5rem 1.5rem',
  borderBottom: '1px solid #2d2d2d',
  background: '#141414',
  zIndex: 2
}

const title = {
  margin: 0,
  paddingRight: '2.75rem',
  color: '#fff',
  fontSize:
    'clamp(1.6rem, 5vw, 2.3rem)',
  lineHeight: 1.15
}

const description = {
  margin: '.7rem 0 0',
  color: '#C7A44B',
  fontSize: '1rem',
  fontWeight: 600,
  lineHeight: 1.45
}

const introText = {
  margin: '.45rem 0 0',
  color: '#999',
  fontSize: '.9rem',
  lineHeight: 1.5
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
  WebkitTapHighlightColor: 'transparent'
}

const scrollContent = {
  minHeight: 0,
  overflowY: 'auto' as const,
  overscrollBehavior: 'contain' as const,
  padding: '1.5rem',
  WebkitOverflowScrolling: 'touch' as const
}

const actionList = {
  display: 'grid',
  gap: '.9rem'
}

const actionCard = {
  display: 'grid',
  gridTemplateColumns:
    'auto minmax(0, 1fr)',
  alignItems: 'start',
  gap: '1rem',
  width: '100%',
  padding: '1rem',
  color: '#fff',
  background: '#1b1b1b',
  border: '1px solid #303030',
  borderRadius: '14px',
  textDecoration: 'none',
  textAlign: 'left' as const,
  WebkitTapHighlightColor: 'transparent'
}

const actionButton = {
  display: 'grid',
  gridTemplateColumns:
    'auto minmax(0, 1fr)',
  alignItems: 'start',
  gap: '1rem',
  width: '100%',
  padding: '1rem',
  color: '#fff',
  background: '#1b1b1b',
  border: '1px solid #303030',
  borderRadius: '14px',
  fontFamily: 'inherit',
  textAlign: 'left' as const,
  cursor: 'pointer',
  WebkitTapHighlightColor: 'transparent'
}

const dangerAction = {
  borderColor: 'rgba(220, 20, 60, .45)',
  background: 'rgba(220, 20, 60, .06)'
}

const actionIconWrap = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '2.75rem',
  height: '2.75rem'
}

const actionTitle = {
  color: '#fff',
  fontSize: '1rem',
  fontWeight: 650,
  lineHeight: 1.3
}

const actionDescription = {
  marginTop: '.3rem',
  color: '#999',
  fontSize: '.86rem',
  lineHeight: 1.5
}

const confirmationCard = {
  maxWidth: '560px',
  margin: '0 auto',
  padding: '2rem',
  background: '#1b1b1b',
  border: '1px solid rgba(220, 20, 60, .45)',
  borderRadius: '16px',
  textAlign: 'center' as const
}

const confirmationIconWrap = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '4rem',
  height: '4rem',
  margin: '0 auto',
  background: 'rgba(220, 20, 60, .08)',
  border: '1px solid rgba(220, 20, 60, .35)',
  borderRadius: '999px'
}

const confirmationTitle = {
  margin: '1.25rem 0 0',
  color: '#fff',
  fontSize: '1.35rem',
  lineHeight: 1.3
}

const confirmationDescription = {
  margin: '.85rem 0 0',
  color: '#999',
  fontSize: '.92rem',
  lineHeight: 1.6
}

const confirmationButtons = {
  display: 'grid',
  gridTemplateColumns:
    'repeat(2, minmax(0, 1fr))',
  gap: '.8rem',
  marginTop: '1.5rem'
}

const cancelButton = {
  padding: '.9rem 1rem',
  color: '#ddd',
  background: '#222',
  border: '1px solid #3a3a3a',
  borderRadius: '10px',
  fontFamily: 'inherit',
  fontWeight: 600,
  cursor: 'pointer'
}

const removeButton = {
  padding: '.9rem 1rem',
  color: '#fff',
  background: '#dc143c',
  border: '1px solid #dc143c',
  borderRadius: '10px',
  fontFamily: 'inherit',
  fontWeight: 700,
  cursor: 'pointer'
}