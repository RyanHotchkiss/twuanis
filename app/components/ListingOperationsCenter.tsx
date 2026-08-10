'use client'

import Link from 'next/link'

import {
  resolveListingLifecycle,
  type ListingStatus
} from '@/lib/listing-lifecycle-engine'

import type {
  ResolvedListingCapabilities
} from '@/lib/listing-capabilities'

import type {
  ResolvedListingTimeline
} from '@/lib/listing-timeline'

import {
  supabase
} from '@/lib/supabase'

import {
  AlertTriangle,
  Archive,
  CheckCircle2,
  CirclePlus,
  Clock3,
  Copy,
  EyeOff,
  Pencil,
  RefreshCcw,
  RotateCcw,
  Sparkles,
  Trash2,
  Upload,
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

export type {
  ListingStatus
} from '@/lib/listing-lifecycle-engine'

export type ManagedListing = {
  id: string
  title: string
  status: ListingStatus

  transactionType?:
    | 'buy'
    | 'rent'
    | 'sale'
}

type ListingOperationsCenterProps = {
  language: SupportedLanguage
  listing: ManagedListing | null
  open: boolean
    capabilities:
    ResolvedListingCapabilities | null

  capabilitiesLoading:
    boolean

  capabilitiesError:
    string
  onClose: () => void
  onPublish?: (
  listing: ManagedListing
  ) => void
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

  onPermanentDelete?: (
    listing: ManagedListing
  ) => void
}

const ANIMATION_DURATION =
  260

const SWIPE_CLOSE_DISTANCE =
  120

export default function ListingOperationsCenter({
  language,
  listing,
  open,
  capabilities,
  capabilitiesLoading,
  capabilitiesError,
  onClose,
  onPublish,
  onDuplicate,
  onRenew,
  onUnpublish,
  onArchive,
  onRestore,
  onRemove,
  onPermanentDelete
  }: ListingOperationsCenterProps) {
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
      confirmationMode,
      setConfirmationMode
    ] = useState<
      | 'soft-delete'
      | 'permanent-delete'
      | null
    >(null)

  const [
      timeline,
      setTimeline
    ] = useState<
      ResolvedListingTimeline | null
    >(null)

    const [
      timelineLoading,
      setTimelineLoading
    ] = useState(false)

    const [
      timelineError,
      setTimelineError
    ] = useState<
      string | null
    >(null)

    const loadListingTimeline =
      useCallback(
        async () => {

          if (!listing) {
            return
          }

          try {

            setTimelineLoading(
              true
            )

            setTimelineError(
              null
            )

            const {
              data: {
                session
              }
            } =
              await supabase.auth.getSession()

            if (
              !session
            ) {
              throw new Error(
                'Authentication required.'
              )
            }

            const response =
              await fetch(
                '/api/listing-timeline',
                {
                  method:
                    'POST',

                  headers: {
                    'Content-Type':
                      'application/json',

                    Authorization:
                      `Bearer ${session.access_token}`
                  },

                  body:
                    JSON.stringify({
                      listingId:
                        listing.id
                    })
                }
              )

            const result =
              await response.json()

            if (
              !response.ok ||
              !result.success
            ) {
              throw new Error(
                result.error ??
                'Timeline could not be loaded.'
              )
            }

            setTimeline(
              result.timeline
            )

          } catch (error) {

            setTimeline(
              null
            )

            setTimelineError(
              error instanceof Error
                ? error.message
                : 'Timeline could not be loaded.'
            )

          } finally {

            setTimelineLoading(
              false
            )

          }

        },
        [
          listing
        ]
      )

      useEffect(() => {
        if (
          !open ||
          !listing
        ) {
          return
        }

        setTimeline(
          null
        )

        setTimelineError(
          null
        )

        void loadListingTimeline()
      }, [
        open,
        listing,
        loadListingTimeline
      ])

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
      setConfirmationMode(
        null
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
          setConfirmationMode(
            null
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
          confirmationMode
        ) {
          setConfirmationMode(
            null
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
    confirmationMode
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

        const lifecycle =
          resolveListingLifecycle(
            currentListing.status
          )

        const canPublish =
          lifecycle.availableActions.includes(
            'publish'
          )

        const canEdit =
          lifecycle.availableActions.includes(
            'edit'
          )

        const canDuplicate =
          lifecycle.availableActions.includes(
            'duplicate'
          )

        const canRenew =
          lifecycle.availableActions.includes(
            'renew'
          )

        const canUnpublish =
          lifecycle.availableActions.includes(
            'unpublish'
          )

        const canArchive =
          lifecycle.availableActions.includes(
            'archive'
          )

        const canRestore =
          lifecycle.availableActions.includes(
            'restore'
          )

        const canRemove =
          lifecycle.availableActions.includes(
            'soft-delete'
          )
        
        const canPermanentDelete =
          lifecycle.availableActions.includes(
            'permanent-delete'
          )

        const labels =

    language === 'es'
      ? {
          title:
            'Administrar Publicación',

          intro:
            'Administre esta publicación y su estado.',
          
           lifecycle:
            'Ciclo de Vida',

          lifecycleDescription:
            'Administre la publicación, el estado y la permanencia de este anuncio.',
          
          timeline:
            'Cronología',

          timelineDescription:
            'Vea el registro operativo completo de esta publicación.',

          timelineLoading:
            'Cargando cronología...',

          timelineEmpty:
            'Esta publicación todavía no tiene eventos en su cronología.',

          timelineSource:
            'Fuente',

          timelineState:
            'Estado',

          timelineUpdatedFields:
            'Campos actualizados',

          timelineStarts:
            'Comienza',

          timelineExpires:
            'Vence',

          timelineAssignedBy:
            'Asignado por',

          timelineRevokedBy:
            'Revocado por',

          timelineRevocationReason:
            'Motivo de revocación',

          capabilities:
            'Capacidades',

          capabilitiesDescription:
            'Vea las capacidades activas, programadas y disponibles para esta publicación.',

          capabilitiesLoading:
            'Cargando capacidades...',

          capabilitiesEmpty:
            'Esta publicación no tiene capacidades activas, programadas o disponibles.',

          activeCapabilities:
            'Capacidades Activas',

          scheduledCapabilities:
            'Capacidades Programadas',

          availableCapabilities:
            'Capacidades Disponibles',

          statusActive:
            'Activa',

          statusScheduled:
            'Programada',

          statusAvailable:
            'Disponible',

          source:
            'Fuente',

          starts:
            'Comienza',

          expires:
            'Vence',

          duration:
            'Duración',

          quantity:
            'Cantidad',

          approval:
            'Aprobación',

          approvalRequired:
            'Requerida',

          approvalNotRequired:
            'No requerida',

          unlimited:
            'Ilimitada',

          days:
            'días',

          listingLifetime:
            'Durante la vida de la publicación',

          permanent:
            'Permanente',

          singleUse:
            'Uso único',

          sourcePackageCredit:
            'Crédito del paquete',

          sourcePurchase:
            'Compra',

          sourceManual:
            'Asignación manual',

          sourceSystem:
            'Sistema',

          noStartDate:
            'Inmediatamente',

          noExpiration:
            'Sin vencimiento',
          publish:
            'Publicar Anuncio',

          publishDescription:
            'Publique este borrador en el mercado después de verificar los límites de su paquete.',
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
            'Eliminar Publicación',
          removeDescription:
            'Mueva esta publicación al estado eliminado. Más adelante podrá restaurarla o eliminarla permanentemente.',
          confirmRemoveTitle:
            '¿Eliminar esta publicación?',
          confirmRemoveDescription:
            'La publicación pasará al estado eliminado. Más adelante podrá restaurarla o eliminarla permanentemente.',
          cancel:
            'Cancelar',
          confirmRemove:
            'Eliminar',
          close:
            'Cerrar',
          permanentDelete:
            'Eliminar Permanentemente',

          permanentDeleteDescription:
            'Elimine definitivamente esta publicación y sus archivos. Esta acción no se puede deshacer.',

          confirmPermanentDeleteTitle:
            '¿Eliminar permanentemente esta publicación?',

          confirmPermanentDeleteDescription:
            'La publicación y sus archivos se eliminarán definitivamente. Esta acción no se puede deshacer.',

          confirmPermanentDelete:
            'Eliminar Permanentemente',
        }
      : {
          title:
            'Manage Listing',

          intro:
            'Manage this listing and its publication status.',
         
          lifecycle:
            'Lifecycle',

          lifecycleDescription:
            'Manage this listing’s publication, status, and continued existence.',
          
          timeline:
            'Timeline',

          timelineDescription:
            'View the complete operational record of this listing.',

          timelineLoading:
            'Loading timeline...',

          timelineEmpty:
            'This listing does not have any timeline events yet.',

          timelineSource:
            'Source',

          timelineState:
            'State',

          timelineUpdatedFields:
            'Updated Fields',

          timelineStarts:
            'Starts',

          timelineExpires:
            'Expires',

          timelineAssignedBy:
            'Assigned By',

          timelineRevokedBy:
            'Revoked By',

          timelineRevocationReason:
            'Revocation Reason',

          capabilities:
            'Capabilities',

          capabilitiesDescription:
            'View the active, scheduled, and available capabilities for this listing.',

          capabilitiesLoading:
            'Loading capabilities...',

          capabilitiesEmpty:
            'This listing has no active, scheduled, or available capabilities.',

          activeCapabilities:
            'Active Capabilities',

          scheduledCapabilities:
            'Scheduled Capabilities',

          availableCapabilities:
            'Available Capabilities',

          statusActive:
            'Active',

          statusScheduled:
            'Scheduled',

          statusAvailable:
            'Available',

          source:
            'Source',

          starts:
            'Starts',

          expires:
            'Expires',

          duration:
            'Duration',

          quantity:
            'Quantity',

          approval:
            'Approval',

          approvalRequired:
            'Required',

          approvalNotRequired:
            'Not required',

          unlimited:
            'Unlimited',

          days:
            'days',

          listingLifetime:
            'Listing lifetime',

          permanent:
            'Permanent',

          singleUse:
            'Single use',

          sourcePackageCredit:
            'Package credit',

          sourcePurchase:
            'Purchase',

          sourceManual:
            'Manual assignment',

          sourceSystem:
            'System',

          noStartDate:
            'Immediately',

          noExpiration:
            'No expiration',
          publish:
            'Publish Listing',

          publishDescription:
            'Publish this draft to the marketplace after verifying your package limits.',
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
            'Soft Delete Listing',
          removeDescription:
            'Move this listing into the deleted state. It can still be permanently deleted later.',
          confirmRemoveTitle:
            'Soft delete this listing?',
          confirmRemoveDescription:
            'The listing will be moved into the deleted state. It can still be restored or permanently deleted later.',
          cancel:
            'Cancel',
          confirmRemove:
            'Soft Delete',
          close:
            'Close',
          permanentDelete:
            'Permanently Delete Listing',

          permanentDeleteDescription:
            'Permanently delete this listing and its files. This action cannot be undone.',

          confirmPermanentDeleteTitle:
            'Permanently delete this listing?',

          confirmPermanentDeleteDescription:
            'The listing and its files will be permanently deleted. This action cannot be undone.',

          confirmPermanentDelete:
            'Permanently Delete',
        }

        function formatTimelineDate(
          value: string
        ): string {
          const date =
            new Date(value)

          if (
            Number.isNaN(
              date.getTime()
            )
          ) {
            return value
          }

          return new Intl.DateTimeFormat(
            language === 'es'
              ? 'es-CR'
              : 'en-US',
            {
              year:
                'numeric',

              month:
                'short',

              day:
                'numeric',

              hour:
                'numeric',

              minute:
                '2-digit'
            }
          ).format(date)
        }

      function formatCapabilityDate(
          value: string | null,
          fallback: string
        ): string {
          if (!value) {
            return fallback
          }

          const date =
            new Date(value)

          if (
            Number.isNaN(
              date.getTime()
            )
          ) {
            return fallback
          }

          return new Intl.DateTimeFormat(
            language === 'es'
              ? 'es-CR'
              : 'en-US',
            {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            }
          ).format(date)
        }

        function formatCapabilitySource(
            sourceType: string | null
          ): string {
            switch (sourceType) {
              case 'package_credit':
                return labels
                  .sourcePackageCredit

              case 'purchase':
                return labels
                  .sourcePurchase

              case 'manual':
                return labels
                  .sourceManual

              case 'system':
                return labels
                  .sourceSystem

              default:
                return '—'
            }
          }

        function formatCapabilityDuration({
            durationType,
            durationDays
          }: {
            durationType:
              string | null

            durationDays:
              number | null
          }): string {
            switch (durationType) {
              case 'days':
                return durationDays === null
                  ? '—'
                  : `${durationDays} ${labels.days}`

              case 'listing_lifetime':
                return labels
                  .listingLifetime

              case 'permanent':
                return labels
                  .permanent

              case 'single_use':
                return labels
                  .singleUse

              default:
                return '—'
            }
          }

      function formatCapabilityQuantity({
            assignedQuantity,
            maximumQuantity,
            remainingQuantity
          }: {
            assignedQuantity: number

            maximumQuantity:
              number | null

            remainingQuantity:
              number | null
          }): string {
            if (
              maximumQuantity ===
              null
            ) {
              return (
                `${assignedQuantity} / ` +
                labels.unlimited
              )
            }

            return (
              `${assignedQuantity} / ` +
              `${maximumQuantity} ` +
              `(${remainingQuantity ?? 0} remaining)`
            )
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
  function handlePublish() {
      if (!canPublish) {
        return
      }

      onPublish?.(
        currentListing
      )
    }

  function handleDuplicate() {
    if (!canDuplicate) {
      return
    }

    onDuplicate?.(
      currentListing
    )
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
  if (!canRemove) {
    return
  }

  setConfirmationMode(
    'soft-delete'
  )
}

function openPermanentDeleteConfirmation() {
  if (!canPermanentDelete) {
    return
  }

  setConfirmationMode(
    'permanent-delete'
  )
}

function closeConfirmation() {
  setConfirmationMode(
    null
  )
}

function confirmDestructiveAction() {
  if (
    confirmationMode ===
    'soft-delete'
  ) {
    if (!canRemove) {
      return
    }

    onRemove?.(
      currentListing
    )
  }

  if (
    confirmationMode ===
    'permanent-delete'
  ) {
    if (!canPermanentDelete) {
      return
    }

    onPermanentDelete?.(
      currentListing
    )
  }

  setConfirmationMode(
    null
  )

  requestClose()
}

const confirmationTitleLabel =
  confirmationMode ===
  'permanent-delete'
    ? labels
        .confirmPermanentDeleteTitle
    : labels
        .confirmRemoveTitle

const confirmationDescriptionLabel =
  confirmationMode ===
  'permanent-delete'
    ? labels
        .confirmPermanentDeleteDescription
    : labels
        .confirmRemoveDescription

const confirmationButtonLabel =
  confirmationMode ===
  'permanent-delete'
    ? labels
        .confirmPermanentDelete
    : labels
        .confirmRemove

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
        aria-labelledby="listing-operations-center-title"
        aria-describedby="listing-operations-center-description"
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
              id="listing-operations-center-title"
              style={title}
            >
              {labels.title}
            </h2>

            <p
              id="listing-operations-center-description"
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
          {!confirmationMode ? (
            <div style={managementSections}>
              <section style={managementSection}>
                <div style={sectionHeader}>
                  <div>
                    <h3 style={sectionTitle}>
                      {labels.lifecycle}
                    </h3>

                    <p style={sectionDescription}>
                      {labels.lifecycleDescription}
                    </p>
                  </div>
                </div>

           <div style={actionList}>
              {canPublish && (
                <button
                  type="button"
                  onClick={handlePublish}
                  style={actionButton}
                >
                  <div style={actionIconWrap}>
                    <Upload
                      size={30}
                      strokeWidth={1}
                      color="#C7A44B"
                    />
                  </div>

                  <div>
                    <div style={actionTitle}>
                      {labels.publish}
                    </div>

                    <div style={actionDescription}>
                      {labels.publishDescription}
                    </div>
                  </div>
                </button>
              )}
              {canEdit && (
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
              )}

              {canDuplicate && (
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
              )}

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
              {canPermanentDelete && (
                <button
                  type="button"
                  onClick={
                    openPermanentDeleteConfirmation
                  }
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
                      {labels.permanentDelete}
                    </div>

                    <div style={actionDescription}>
                      {
                        labels
                          .permanentDeleteDescription
                      }
                    </div>
                  </div>
                </button>
              )}
            </div>
          </section>

                  <section style={managementSection}>
            <div style={sectionHeader}>
              <div>
                <h3 style={sectionTitle}>
                  {labels.capabilities}
                </h3>

                <p style={sectionDescription}>
                  {
                    labels
                      .capabilitiesDescription
                  }
                </p>
              </div>
            </div>

            {capabilitiesLoading ? (
              <div style={capabilityMessage}>
                <Clock3
                  size={22}
                  strokeWidth={1}
                  color="#C7A44B"
                />

                <span>
                  {
                    labels
                      .capabilitiesLoading
                  }
                </span>
              </div>
            ) : capabilitiesError ? (
              <div
                style={{
                  ...capabilityMessage,
                  ...capabilityErrorMessage
                }}
              >
                <AlertTriangle
                  size={22}
                  strokeWidth={1}
                  color="#ff7676"
                />

                <span>
                  {capabilitiesError}
                </span>
              </div>
            ) : capabilities ? (
              <div style={capabilityGroups}>
                {capabilities
                  .activeCapabilities
                  .length > 0 && (
                  <div style={capabilityGroup}>
                    <h4 style={capabilityGroupTitle}>
                      {
                        labels
                          .activeCapabilities
                      }
                    </h4>

                    <div style={capabilityList}>
                      {capabilities
                        .activeCapabilities
                        .map(
                          (
                            capability,
                            index
                          ) => (
                            <article
                              key={
                                `${capability.slug}-active-${index}`
                              }
                              style={capabilityCard}
                            >
                              <div style={capabilityCardHeader}>
                                <div style={capabilityIdentity}>
                                  <CheckCircle2
                                    size={23}
                                    strokeWidth={1}
                                    color="#2ecc71"
                                  />

                                  <div>
                                    <div style={capabilityName}>
                                      {
                                        language === 'es'
                                          ? capability.nameEs
                                          : capability.nameEn
                                      }
                                    </div>

                                    <div style={activeStatusBadge}>
                                      {
                                        labels
                                          .statusActive
                                      }
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {(language === 'es'
                                ? capability.descriptionEs
                                : capability.descriptionEn
                              ) && (
                                <p style={capabilityDescription}>
                                  {
                                    language === 'es'
                                      ? capability.descriptionEs
                                      : capability.descriptionEn
                                  }
                                </p>
                              )}

                              <div style={capabilityDetails}>
                                <div style={capabilityDetail}>
                                  <span style={capabilityDetailLabel}>
                                    {labels.source}
                                  </span>

                                  <span style={capabilityDetailValue}>
                                    {
                                      formatCapabilitySource(
                                        capability.sourceType
                                      )
                                    }
                                  </span>
                                </div>

                                <div style={capabilityDetail}>
                                  <span style={capabilityDetailLabel}>
                                    {labels.starts}
                                  </span>

                                  <span style={capabilityDetailValue}>
                                    {
                                      formatCapabilityDate(
                                        capability.startsAt,
                                        labels.noStartDate
                                      )
                                    }
                                  </span>
                                </div>

                                <div style={capabilityDetail}>
                                  <span style={capabilityDetailLabel}>
                                    {labels.expires}
                                  </span>

                                  <span style={capabilityDetailValue}>
                                    {
                                      formatCapabilityDate(
                                        capability.expiresAt,
                                        labels.noExpiration
                                      )
                                    }
                                  </span>
                                </div>

                                <div style={capabilityDetail}>
                                  <span style={capabilityDetailLabel}>
                                    {labels.duration}
                                  </span>

                                  <span style={capabilityDetailValue}>
                                    {
                                      formatCapabilityDuration(
                                        capability
                                      )
                                    }
                                  </span>
                                </div>

                                <div style={capabilityDetail}>
                                  <span style={capabilityDetailLabel}>
                                    {labels.quantity}
                                  </span>

                                  <span style={capabilityDetailValue}>
                                    {
                                      formatCapabilityQuantity(
                                        capability
                                      )
                                    }
                                  </span>
                                </div>

                                <div style={capabilityDetail}>
                                  <span style={capabilityDetailLabel}>
                                    {labels.approval}
                                  </span>

                                  <span style={capabilityDetailValue}>
                                    {
                                      capability
                                        .requiresManualApproval
                                        ? labels
                                            .approvalRequired
                                        : labels
                                            .approvalNotRequired
                                    }
                                  </span>
                                </div>
                              </div>
                            </article>
                          )
                        )}
                    </div>
                  </div>
                )}

                {capabilities
                  .scheduledCapabilities
                  .length > 0 && (
                  <div style={capabilityGroup}>
                    <h4 style={capabilityGroupTitle}>
                      {
                        labels
                          .scheduledCapabilities
                      }
                    </h4>

                    <div style={capabilityList}>
                      {capabilities
                        .scheduledCapabilities
                        .map(
                          (
                            capability,
                            index
                          ) => (
                            <article
                              key={
                                `${capability.slug}-scheduled-${index}`
                              }
                              style={capabilityCard}
                            >
                              <div style={capabilityIdentity}>
                                <Clock3
                                  size={23}
                                  strokeWidth={1}
                                  color="#f1c40f"
                                />

                                <div>
                                  <div style={capabilityName}>
                                    {
                                      language === 'es'
                                        ? capability.nameEs
                                        : capability.nameEn
                                    }
                                  </div>

                                  <div style={scheduledStatusBadge}>
                                    {
                                      labels
                                        .statusScheduled
                                    }
                                  </div>
                                </div>
                              </div>

                              {(language === 'es'
                                ? capability.descriptionEs
                                : capability.descriptionEn
                              ) && (
                                <p style={capabilityDescription}>
                                  {
                                    language === 'es'
                                      ? capability.descriptionEs
                                      : capability.descriptionEn
                                  }
                                </p>
                              )}

                              <div style={capabilityDetails}>
                                <div style={capabilityDetail}>
                                  <span style={capabilityDetailLabel}>
                                    {labels.source}
                                  </span>

                                  <span style={capabilityDetailValue}>
                                    {
                                      formatCapabilitySource(
                                        capability.sourceType
                                      )
                                    }
                                  </span>
                                </div>

                                <div style={capabilityDetail}>
                                  <span style={capabilityDetailLabel}>
                                    {labels.starts}
                                  </span>

                                  <span style={capabilityDetailValue}>
                                    {
                                      formatCapabilityDate(
                                        capability.startsAt,
                                        labels.noStartDate
                                      )
                                    }
                                  </span>
                                </div>

                                <div style={capabilityDetail}>
                                  <span style={capabilityDetailLabel}>
                                    {labels.expires}
                                  </span>

                                  <span style={capabilityDetailValue}>
                                    {
                                      formatCapabilityDate(
                                        capability.expiresAt,
                                        labels.noExpiration
                                      )
                                    }
                                  </span>
                                </div>

                                <div style={capabilityDetail}>
                                  <span style={capabilityDetailLabel}>
                                    {labels.duration}
                                  </span>

                                  <span style={capabilityDetailValue}>
                                    {
                                      formatCapabilityDuration(
                                        capability
                                      )
                                    }
                                  </span>
                                </div>

                                <div style={capabilityDetail}>
                                  <span style={capabilityDetailLabel}>
                                    {labels.quantity}
                                  </span>

                                  <span style={capabilityDetailValue}>
                                    {
                                      formatCapabilityQuantity(
                                        capability
                                      )
                                    }
                                  </span>
                                </div>

                                <div style={capabilityDetail}>
                                  <span style={capabilityDetailLabel}>
                                    {labels.approval}
                                  </span>

                                  <span style={capabilityDetailValue}>
                                    {
                                      capability
                                        .requiresManualApproval
                                        ? labels
                                            .approvalRequired
                                        : labels
                                            .approvalNotRequired
                                    }
                                  </span>
                                </div>
                              </div>
                            </article>
                          )
                        )}
                    </div>
                  </div>
                )}

                {capabilities
                  .availableCapabilities
                  .length > 0 && (
                  <div style={capabilityGroup}>
                    <h4 style={capabilityGroupTitle}>
                      {
                        labels
                          .availableCapabilities
                      }
                    </h4>

                    <div style={capabilityList}>
                      {capabilities
                        .availableCapabilities
                        .map(
                          (
                            capability,
                            index
                          ) => (
                            <article
                              key={
                                `${capability.slug}-available-${index}`
                              }
                              style={capabilityCard}
                            >
                              <div style={capabilityIdentity}>
                                <CirclePlus
                                  size={23}
                                  strokeWidth={1}
                                  color="#C7A44B"
                                />

                                <div>
                                  <div style={capabilityName}>
                                    {
                                      language === 'es'
                                        ? capability.nameEs
                                        : capability.nameEn
                                    }
                                  </div>

                                  <div style={availableStatusBadge}>
                                    {
                                      labels
                                        .statusAvailable
                                    }
                                  </div>
                                </div>
                              </div>

                              {(language === 'es'
                                ? capability.descriptionEs
                                : capability.descriptionEn
                              ) && (
                                <p style={capabilityDescription}>
                                  {
                                    language === 'es'
                                      ? capability.descriptionEs
                                      : capability.descriptionEn
                                  }
                                </p>
                              )}

                              <div style={capabilityDetails}>
                                <div style={capabilityDetail}>
                                  <span style={capabilityDetailLabel}>
                                    {labels.duration}
                                  </span>

                                  <span style={capabilityDetailValue}>
                                    {
                                      formatCapabilityDuration(
                                        capability
                                      )
                                    }
                                  </span>
                                </div>

                                <div style={capabilityDetail}>
                                  <span style={capabilityDetailLabel}>
                                    {labels.quantity}
                                  </span>

                                  <span style={capabilityDetailValue}>
                                    {
                                      formatCapabilityQuantity(
                                        capability
                                      )
                                    }
                                  </span>
                                </div>

                                <div style={capabilityDetail}>
                                  <span style={capabilityDetailLabel}>
                                    {labels.approval}
                                  </span>

                                  <span style={capabilityDetailValue}>
                                    {
                                      capability
                                        .requiresManualApproval
                                        ? labels
                                            .approvalRequired
                                        : labels
                                            .approvalNotRequired
                                    }
                                  </span>
                                </div>
                              </div>
                            </article>
                          )
                        )}
                    </div>
                  </div>
                )}

                {
                  capabilities
                    .activeCapabilities
                    .length === 0 &&
                  capabilities
                    .scheduledCapabilities
                    .length === 0 &&
                  capabilities
                    .availableCapabilities
                    .length === 0 && (
                    <div style={capabilityMessage}>
                      <Sparkles
                        size={22}
                        strokeWidth={1}
                        color="#777"
                      />

                      <span>
                        {
                          labels
                            .capabilitiesEmpty
                        }
                      </span>
                    </div>
                  )
                }
              </div>
            ) : (
              <div style={capabilityMessage}>
                <Sparkles
                  size={22}
                  strokeWidth={1}
                  color="#777"
                />

                <span>
                  {
                    labels
                      .capabilitiesEmpty
                  }
                </span>
              </div>
            )}
          </section>

          <section style={managementSection}>
            <div style={sectionHeader}>
              <div>
                <h3 style={sectionTitle}>
                  {labels.timeline}
                </h3>

                <p style={sectionDescription}>
                  {
                    labels
                      .timelineDescription
                  }
                </p>
              </div>
            </div>

            {timelineLoading ? (
              <div style={timelineMessage}>
                <Clock3
                  size={22}
                  strokeWidth={1}
                  color="#C7A44B"
                />

                <span>
                  {labels.timelineLoading}
                </span>
              </div>
            ) : timelineError ? (
              <div
                style={{
                  ...timelineMessage,
                  ...timelineErrorMessage
                }}
              >
                <AlertTriangle
                  size={22}
                  strokeWidth={1}
                  color="#ff7676"
                />

                <span>
                  {timelineError}
                </span>
              </div>
            ) : timeline &&
                timeline.events.length > 0 ? (
              <div style={timelineList}>
                {timeline.events.map(
                  event => (
                    <article
                      key={event.id}
                      style={timelineCard}
                    >
                      <div style={timelineCardHeader}>
                        <div>
                          <div style={timelineEventTitle}>
                            {event.title}
                          </div>

                          <div style={timelineTimestamp}>
                            {
                              formatTimelineDate(
                                event.occurredAt
                              )
                            }
                          </div>
                        </div>

                        {event.source && (
                          <div style={timelineSourceBadge}>
                            {event.source}
                          </div>
                        )}
                      </div>

                      {(
                        event.previousState ||
                        event.resultingState
                      ) && (
                        <div style={timelineDetail}>
                          <span style={timelineDetailLabel}>
                            {labels.timelineState}
                          </span>

                          <span style={timelineDetailValue}>
                            {
                              event.previousState ??
                              '—'
                            }
                            {' → '}
                            {
                              event.resultingState ??
                              '—'
                            }
                          </span>
                        </div>
                      )}

                      {event.metadata
                        .updatedFields &&
                        event.metadata
                          .updatedFields
                          .length > 0 && (
                        <div style={timelineDetail}>
                          <span style={timelineDetailLabel}>
                            {
                              labels
                                .timelineUpdatedFields
                            }
                          </span>

                          <span style={timelineDetailValue}>
                            {
                              event.metadata
                                .updatedFields
                                .join(', ')
                            }
                          </span>
                        </div>
                      )}

                      {event.metadata
                        .capabilityNameEn && (
                        <div style={timelineDetail}>
                          <span style={timelineDetailLabel}>
                            {labels.capabilities}
                          </span>

                          <span style={timelineDetailValue}>
                            {
                              language === 'es'
                                ? (
                                    event.metadata
                                      .capabilityNameEs ??
                                    event.metadata
                                      .capabilityNameEn
                                  )
                                : event.metadata
                                    .capabilityNameEn
                            }
                          </span>
                        </div>
                      )}

                      {event.metadata
                        .startsAt && (
                        <div style={timelineDetail}>
                          <span style={timelineDetailLabel}>
                            {labels.timelineStarts}
                          </span>

                          <span style={timelineDetailValue}>
                            {
                              formatTimelineDate(
                                event.metadata
                                  .startsAt
                              )
                            }
                          </span>
                        </div>
                      )}

                      {event.metadata
                        .expiresAt && (
                        <div style={timelineDetail}>
                          <span style={timelineDetailLabel}>
                            {labels.timelineExpires}
                          </span>

                          <span style={timelineDetailValue}>
                            {
                              formatTimelineDate(
                                event.metadata
                                  .expiresAt
                              )
                            }
                          </span>
                        </div>
                      )}

                      {event.actor
                        .assignedBy && (
                        <div style={timelineDetail}>
                          <span style={timelineDetailLabel}>
                            {
                              labels
                                .timelineAssignedBy
                            }
                          </span>

                          <span style={timelineDetailValue}>
                            {
                              event.actor
                                .assignedBy
                            }
                          </span>
                        </div>
                      )}

                      {event.actor
                        .revokedBy && (
                        <div style={timelineDetail}>
                          <span style={timelineDetailLabel}>
                            {
                              labels
                                .timelineRevokedBy
                            }
                          </span>

                          <span style={timelineDetailValue}>
                            {
                              event.actor
                                .revokedBy
                            }
                          </span>
                        </div>
                      )}

                      {event.metadata
                        .revocationReason && (
                        <div style={timelineDetail}>
                          <span style={timelineDetailLabel}>
                            {
                              labels
                                .timelineRevocationReason
                            }
                          </span>

                          <span style={timelineDetailValue}>
                            {
                              event.metadata
                                .revocationReason
                            }
                          </span>
                        </div>
                      )}
                    </article>
                  )
                )}
              </div>
            ) : (
              <div style={timelineMessage}>
                <Clock3
                  size={22}
                  strokeWidth={1}
                  color="#777"
                />

                <span>
                  {labels.timelineEmpty}
                </span>
              </div>
            )}
          </section>

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
                {confirmationTitleLabel}
              </h3>

              <p style={confirmationDescription}>
                {confirmationDescriptionLabel}
              </p>

              <div style={confirmationButtons}>
                <button
                  type="button"
                  onClick={closeConfirmation}
                  style={cancelButton}
                >
                  {labels.cancel}
                </button>

                <button
                  type="button"
                  onClick={
                    confirmDestructiveAction
                  }
                  style={removeButton}
                >
                  {confirmationButtonLabel}
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

const managementSections = {
  display: 'grid',
  gap: '1.5rem'
}

const managementSection = {
  padding: '1.15rem',
  background: '#181818',
  border: '1px solid #303030',
  borderRadius: '16px'
}

const sectionHeader = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: '1rem',
  marginBottom: '1rem',
  paddingBottom: '1rem',
  borderBottom: '1px solid #303030'
}

const sectionTitle = {
  margin: 0,
  color: '#C7A44B',
  fontSize: '1.1rem'
}

const sectionDescription = {
  margin: '.4rem 0 0',
  color: '#888',
  fontSize: '.85rem',
  lineHeight: 1.5
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

const capabilityGroups = {
  display: 'grid',
  gap: '1.25rem'
}

const capabilityGroup = {
  display: 'grid',
  gap: '.75rem'
}

const capabilityGroupTitle = {
  margin: 0,
  color: '#ddd',
  fontSize: '.92rem',
  fontWeight: 650
}

const capabilityList = {
  display: 'grid',
  gap: '.85rem'
}

const capabilityCard = {
  padding: '1rem',
  background: '#1b1b1b',
  border: '1px solid #303030',
  borderRadius: '14px'
}

const capabilityCardHeader = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: '1rem'
}

const capabilityIdentity = {
  display: 'grid',
  gridTemplateColumns:
    'auto minmax(0, 1fr)',
  alignItems: 'start',
  gap: '.75rem'
}

const capabilityName = {
  color: '#fff',
  fontSize: '.98rem',
  fontWeight: 650,
  lineHeight: 1.3
}

const activeStatusBadge = {
  display: 'inline-flex',
  marginTop: '.35rem',
  padding: '.2rem .5rem',
  color: '#72e59a',
  background:
    'rgba(46, 204, 113, .1)',
  border:
    '1px solid rgba(46, 204, 113, .3)',
  borderRadius: '999px',
  fontSize: '.7rem',
  fontWeight: 700
}

const scheduledStatusBadge = {
  display: 'inline-flex',
  marginTop: '.35rem',
  padding: '.2rem .5rem',
  color: '#f5d76e',
  background:
    'rgba(241, 196, 15, .08)',
  border:
    '1px solid rgba(241, 196, 15, .3)',
  borderRadius: '999px',
  fontSize: '.7rem',
  fontWeight: 700
}

const availableStatusBadge = {
  display: 'inline-flex',
  marginTop: '.35rem',
  padding: '.2rem .5rem',
  color: '#d8bc72',
  background:
    'rgba(199, 164, 75, .08)',
  border:
    '1px solid rgba(199, 164, 75, .3)',
  borderRadius: '999px',
  fontSize: '.7rem',
  fontWeight: 700
}

const capabilityDescription = {
  margin: '.75rem 0 0',
  color: '#999',
  fontSize: '.84rem',
  lineHeight: 1.5
}

const capabilityDetails = {
  display: 'grid',
  gridTemplateColumns:
    'repeat(auto-fit, minmax(130px, 1fr))',
  gap: '.65rem',
  marginTop: '.9rem',
  paddingTop: '.9rem',
  borderTop: '1px solid #303030'
}

const capabilityDetail = {
  display: 'grid',
  gap: '.2rem',
  minWidth: 0
}

const capabilityDetailLabel = {
  color: '#777',
  fontSize: '.67rem',
  fontWeight: 650,
  letterSpacing: '.035em',
  textTransform:
    'uppercase' as const
}

const capabilityDetailValue = {
  color: '#ddd',
  fontSize: '.8rem',
  lineHeight: 1.35,
  overflowWrap:
    'anywhere' as const
}

const capabilityMessage = {
  display: 'flex',
  alignItems: 'center',
  gap: '.7rem',
  padding: '1rem',
  color: '#999',
  background: '#171717',
  border: '1px dashed #333',
  borderRadius: '12px',
  fontSize: '.86rem',
  lineHeight: 1.5
}

const capabilityErrorMessage = {
  color: '#ffb4b4',
  background: '#2a1010',
  border:
    '1px solid #6b2222'
}

const timelineList = {
  display:
    'grid',

  gap:
    '.85rem'
}

const timelineCard = {
  padding:
    '1rem',

  background:
    '#1b1b1b',

  border:
    '1px solid #303030',

  borderRadius:
    '14px'
}

const timelineCardHeader = {
  display:
    'flex',

  justifyContent:
    'space-between',

  alignItems:
    'flex-start',

  gap:
    '1rem',

  paddingBottom:
    '.8rem',

  marginBottom:
    '.8rem',

  borderBottom:
    '1px solid #303030'
}

const timelineEventTitle = {
  color:
    '#fff',

  fontSize:
    '.98rem',

  fontWeight:
    650,

  lineHeight:
    1.3
}

const timelineTimestamp = {
  marginTop:
    '.3rem',

  color:
    '#777',

  fontSize:
    '.75rem',

  lineHeight:
    1.4
}

const timelineSourceBadge = {
  flexShrink:
    0,

  padding:
    '.25rem .55rem',

  color:
    '#d8bc72',

  background:
    'rgba(199, 164, 75, .08)',

  border:
    '1px solid rgba(199, 164, 75, .3)',

  borderRadius:
    '999px',

  fontSize:
    '.68rem',

  fontWeight:
    700,

  overflowWrap:
    'anywhere' as const
}

const timelineDetail = {
  display:
    'grid',

  gridTemplateColumns:
    'minmax(110px, auto) minmax(0, 1fr)',

  gap:
    '.75rem',

  padding:
    '.35rem 0'
}

const timelineDetailLabel = {
  color:
    '#777',

  fontSize:
    '.7rem',

  fontWeight:
    650,

  letterSpacing:
    '.035em',

  textTransform:
    'uppercase' as const
}

const timelineDetailValue = {
  color:
    '#ddd',

  fontSize:
    '.8rem',

  lineHeight:
    1.4,

  overflowWrap:
    'anywhere' as const
}

const timelineMessage = {
  display:
    'flex',

  alignItems:
    'center',

  gap:
    '.7rem',

  padding:
    '1rem',

  color:
    '#999',

  background:
    '#171717',

  border:
    '1px dashed #333',

  borderRadius:
    '12px',

  fontSize:
    '.86rem',

  lineHeight:
    1.5
}

const timelineErrorMessage = {
  color:
    '#ffb4b4',

  background:
    '#2a1010',

  border:
    '1px solid #6b2222'
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