'use client'

import {
  useCallback,
  useEffect,
  useState
} from 'react'

import {
  CheckCircle2,
  Clock3,
  ReceiptText,
  ShieldCheck
} from 'lucide-react'

import {
  supabase
} from '@/lib/supabase'

type SupportedLanguage =
  | 'en'
  | 'es'

type MarketHubPaymentReviewProps = {
  language: SupportedLanguage
}

type PaymentReviewQueueItem = {
  payment_id: string
  subscription_id: string
  user_id: string

  package_id: string
  package_slug: string
  package_name_en: string
  package_name_es: string

  amount: number
  currency: 'CRC' | 'USD'

  sinpe_reference: string
  sender_name: string
  sender_phone: string | null

  payment_date: string

  payment_status:
    | 'submitted'
    | 'under_review'

  subscription_status:
    | 'pending_payment'

  submitted_at: string

  user_email: string | null
}

function formatMoney(
  amount: number,
  currency: 'CRC' | 'USD'
): string {
  return new Intl.NumberFormat(
    currency === 'CRC'
      ? 'es-CR'
      : 'en-US',
    {
      style: 'currency',
      currency,
      maximumFractionDigits: 0
    }
  ).format(amount)
}

function formatDate(
  value: string,
  language: SupportedLanguage
): string {
  const date =
    new Date(value)

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return '—'
  }

  return new Intl.DateTimeFormat(
    language === 'es'
      ? 'es-CR'
      : 'en-US',
    {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    }
  ).format(date)
}

export default function MarketHubPaymentReview({
  language
}: MarketHubPaymentReviewProps) {
  const [
    isReviewer,
    setIsReviewer
  ] =
    useState(false)

  const [
    queue,
    setQueue
  ] =
    useState<PaymentReviewQueueItem[]>(
      []
    )

  const [
    loading,
    setLoading
  ] =
    useState(true)

  const [
    errorMessage,
    setErrorMessage
  ] =
    useState('')

  const [
    processingPaymentId,
    setProcessingPaymentId
    ] =
    useState<string | null>(null)

    const [
    rejectionReasons,
    setRejectionReasons
    ] =
    useState<
        Record<string, string>
    >({})

  const labels =
    language === 'es'
      ? {
          heading:
            'Revisión de Pagos',

          purpose:
            'Revise pagos por SINPE y solicitudes pendientes de mejora de suscripción.',

          reviewer:
            'Revisor Autorizado',

          paymentQueue:
            'Cola de Pagos',

          noPayments:
            'No hay pagos pendientes de revisión.',

          loading:
            'Cargando pagos pendientes...',

          loadError:
            'No se pudo cargar la cola de revisión de pagos.',

          submitted:
            'Enviado',

          underReview:
            'En Revisión',

          requestedPackage:
            'Paquete Solicitado',

          amount:
            'Monto',

          sinpeReference:
            'Referencia SINPE',

          sender:
            'Remitente',

          senderPhone:
            'Teléfono',

          user:
            'Usuario',

          paymentDate:
            'Fecha de Pago',

          submittedAt:
            'Solicitud Recibida',

          pendingSubscription:
            'Suscripción Pendiente',

          payments:
            'Pagos'
        }
      : {
          heading:
            'Payment Review',

          purpose:
            'Review SINPE payments and pending subscription upgrade requests.',

          reviewer:
            'Authorized Reviewer',

          paymentQueue:
            'Payment Queue',

          noPayments:
            'There are no payments awaiting review.',

          loading:
            'Loading pending payments...',

          loadError:
            'The payment review queue could not be loaded.',

          submitted:
            'Submitted',

          underReview:
            'Under Review',

          requestedPackage:
            'Requested Package',

          amount:
            'Amount',

          sinpeReference:
            'SINPE Reference',

          sender:
            'Sender',

          senderPhone:
            'Phone',

          user:
            'User',

          paymentDate:
            'Payment Date',

          submittedAt:
            'Request Received',

          pendingSubscription:
            'Pending Subscription',

          payments:
            'Payments'
        }

  const loadReviewQueue =
    useCallback(
      async (): Promise<void> => {
        setLoading(true)
        setErrorMessage('')

        const {
          data: {
            user
          },
          error: userError
        } =
          await supabase.auth.getUser()

        if (
          userError ||
          !user
        ) {
          setIsReviewer(false)
          setQueue([])
          setLoading(false)
          return
        }

        const {
          data: reviewerData,
          error: reviewerError
        } =
          await supabase.rpc(
            'is_payment_reviewer',
            {
              p_user_id:
                user.id
            }
          )

        if (
          reviewerError ||
          reviewerData !== true
        ) {
          setIsReviewer(false)
          setQueue([])
          setLoading(false)
          return
        }

        setIsReviewer(true)

        const {
          data: queueData,
          error: queueError
        } =
          await supabase.rpc(
            'get_payment_review_queue'
          )

        if (queueError) {
          console.error(
            'MARKETHUB PAYMENT REVIEW QUEUE ERROR:',
            queueError
          )

          setQueue([])
          setErrorMessage(
            labels.loadError
          )
          setLoading(false)
          return
        }

        setQueue(
          (
            queueData || []
          ) as PaymentReviewQueueItem[]
        )

        setLoading(false)
      },
      [
        labels.loadError
      ]
    )

    async function approvePayment(
        paymentId: string
        ): Promise<void> {

        setProcessingPaymentId(
            paymentId
        )

        setErrorMessage('')

        const {
            error
        } =
            await supabase.rpc(
            'approve_sinpe_payment',
            {
                p_payment_id:
                paymentId
            }
            )

        if (error) {
            console.error(error)

            setErrorMessage(
            error.message
            )

            setProcessingPaymentId(
            null
            )

            return
        }

        await loadReviewQueue()

        setProcessingPaymentId(
            null
        )
        }

        async function rejectPayment(
        paymentId: string
        ): Promise<void> {

        const reason =
            rejectionReasons[
            paymentId
            ]?.trim()

        if (!reason) {
            setErrorMessage(
            language === 'es'
                ? 'Ingrese un motivo del rechazo.'
                : 'Please enter a rejection reason.'
            )

            return
        }

        setProcessingPaymentId(
            paymentId
        )

        setErrorMessage('')

        const {
            error
        } =
            await supabase.rpc(
            'reject_sinpe_payment',
            {
                p_payment_id:
                paymentId,

                p_rejection_reason:
                reason
            }
            )

        if (error) {
            console.error(error)

            setErrorMessage(
            error.message
            )

            setProcessingPaymentId(
            null
            )

            return
        }

        await loadReviewQueue()

        setProcessingPaymentId(
            null
        )
        }

  useEffect(() => {
    loadReviewQueue()

    const {
      data: authListener
    } =
      supabase.auth.onAuthStateChange(
        () => {
          loadReviewQueue()
        }
      )

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [
    loadReviewQueue
  ])

  /*
   * Ordinary users should never see an empty
   * administrative card.
   */
  if (
    !loading &&
    !isReviewer
  ) {
    return null
  }

  if (loading) {
    return null
  }

  return (
    <section style={section}>
      <header style={header}>
        <div>
          <div style={titleRow}>
            <ShieldCheck
              size={26}
              strokeWidth={1.25}
              color="#C7A44B"
            />

            <h2 style={heading}>
              {labels.heading}
            </h2>
          </div>

          <p style={purpose}>
            {labels.purpose}
          </p>
        </div>

        <div style={reviewerBadge}>
          <span style={reviewerDot} />

          {labels.reviewer}
        </div>
      </header>

      <div style={divider} />

      <div style={queueHeader}>
        <div>
          <div style={eyebrow}>
            {labels.paymentQueue}
          </div>

          <h3 style={queueHeading}>
            {queue.length}{' '}
            {labels.payments}
          </h3>
        </div>

        <div style={queueCount}>
          <ReceiptText
            size={18}
            strokeWidth={1.5}
          />

          {queue.length}
        </div>
      </div>

      {errorMessage && (
        <div style={errorCard}>
          {errorMessage}
        </div>
      )}

      {!errorMessage &&
      queue.length === 0 && (
        <div style={emptyCard}>
          <CheckCircle2
            size={30}
            strokeWidth={1.25}
            color="#59c173"
          />

          <div>
            <div style={emptyHeading}>
              {labels.noPayments}
            </div>
          </div>
        </div>
      )}

      {!errorMessage &&
      queue.length > 0 && (
        <div style={queueGrid}>
          {queue.map(item => {
            const packageName =
              language === 'es'
                ? item.package_name_es
                : item.package_name_en

            const paymentStatusLabel =
              item.payment_status ===
              'under_review'
                ? labels.underReview
                : labels.submitted

            return (
              <article
                key={item.payment_id}
                style={paymentCard}
              >
                <div style={paymentCardHeader}>
                  <div>
                    <div style={statusBadge}>
                      <Clock3
                        size={14}
                        strokeWidth={1.5}
                      />

                      {paymentStatusLabel}
                    </div>

                    <h4 style={packageNameStyle}>
                      {packageName}
                    </h4>
                  </div>

                  <div style={amountValue}>
                    {formatMoney(
                      Number(item.amount),
                      item.currency
                    )}
                  </div>
                </div>

                <div style={detailsGrid}>
                  <div style={detailBlock}>
                    <div style={detailLabel}>
                      {labels.requestedPackage}
                    </div>

                    <div style={detailValue}>
                      {packageName}
                    </div>
                  </div>

                  <div style={detailBlock}>
                    <div style={detailLabel}>
                      {labels.amount}
                    </div>

                    <div style={detailValue}>
                      {formatMoney(
                        Number(item.amount),
                        item.currency
                      )}
                    </div>
                  </div>

                  <div style={detailBlock}>
                    <div style={detailLabel}>
                      {labels.sinpeReference}
                    </div>

                    <div style={detailValue}>
                      {item.sinpe_reference}
                    </div>
                  </div>

                  <div style={detailBlock}>
                    <div style={detailLabel}>
                      {labels.sender}
                    </div>

                    <div style={detailValue}>
                      {item.sender_name}
                    </div>
                  </div>

                  <div style={detailBlock}>
                    <div style={detailLabel}>
                      {labels.senderPhone}
                    </div>

                    <div style={detailValue}>
                      {item.sender_phone || '—'}
                    </div>
                  </div>

                  <div style={detailBlock}>
                    <div style={detailLabel}>
                      {labels.user}
                    </div>

                    <div style={detailValue}>
                      {item.user_email || '—'}
                    </div>
                  </div>

                  <div style={detailBlock}>
                    <div style={detailLabel}>
                      {labels.paymentDate}
                    </div>

                    <div style={detailValue}>
                      {formatDate(
                        item.payment_date,
                        language
                      )}
                    </div>
                  </div>

                  <div style={detailBlock}>
                    <div style={detailLabel}>
                      {labels.submittedAt}
                    </div>

                    <div style={detailValue}>
                      {formatDate(
                        item.submitted_at,
                        language
                      )}
                    </div>
                  </div>
                </div>

        <div style={reviewActions}>

            <textarea
                value={
                rejectionReasons[
                    item.payment_id
                ] ?? ''
                }

                onChange={event =>
                setRejectionReasons(
                    previous => ({
                    ...previous,
                    [
                        item.payment_id
                    ]:
                        event.target.value
                    })
                )
                }

                placeholder={
                language === 'es'
                    ? 'Motivo del rechazo...'
                    : 'Rejection reason...'
                }

                style={rejectionInput}
            />

            <div style={reviewButtons}>

                <button
                style={approveButton}

                disabled={
                    processingPaymentId ===
                    item.payment_id
                }

                onClick={() =>
                    approvePayment(
                    item.payment_id
                    )
                }
                >
                {processingPaymentId ===
                item.payment_id

                    ? '...'

                    : language === 'es'

                    ? 'Aprobar'

                    : 'Approve'}
                </button>

                <button
                style={rejectButton}

                disabled={
                    processingPaymentId ===
                    item.payment_id
                }

                onClick={() =>
                    rejectPayment(
                    item.payment_id
                    )
                }
                >
                {processingPaymentId ===
                item.payment_id

                    ? '...'

                    : language === 'es'

                    ? 'Rechazar'

                    : 'Reject'}
                </button>

            </div>

            </div>

                <div style={pendingFooter}>
                  <span style={pendingDot} />

                  {labels.pendingSubscription}
                </div>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}

const section:
  React.CSSProperties = {
    padding: '1.5rem',
    color: '#ededed',
    background: '#151515',
    border: '1px solid #4c4023',
    borderRadius: '18px'
  }

const header:
  React.CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '1rem'
  }

const titleRow:
  React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '.65rem'
  }

const heading:
  React.CSSProperties = {
    margin: 0,
    color: '#fff',
    fontSize: '1.6rem'
  }

const purpose:
  React.CSSProperties = {
    maxWidth: '680px',
    margin: '.55rem 0 0',
    color: '#999',
    fontSize: '.88rem',
    lineHeight: 1.5
  }

const reviewerBadge:
  React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '.45rem',
    padding: '.4rem .75rem',
    color: '#d8c889',
    background: '#292313',
    border: '1px solid #514523',
    borderRadius: '999px',
    fontSize: '.72rem',
    fontWeight: 700
  }

const reviewerDot:
  React.CSSProperties = {
    width: '.45rem',
    height: '.45rem',
    background: '#C7A44B',
    borderRadius: '999px'
  }

const divider:
  React.CSSProperties = {
    height: '1px',
    margin: '1.5rem 0',
    background: '#303030'
  }

const queueHeader:
  React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '1rem'
  }

const eyebrow:
  React.CSSProperties = {
    color: '#C7A44B',
    fontSize: '.68rem',
    fontWeight: 700,
    letterSpacing: '.08em',
    textTransform: 'uppercase'
  }

const queueHeading:
  React.CSSProperties = {
    margin: '.35rem 0 0',
    color: '#ff3b00',
    fontSize: '1.15rem'
  }

const queueCount:
  React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '.45rem',
    padding: '.55rem .8rem',
    color: '#fff',
    background: '#202020',
    border: '1px solid #333',
    borderRadius: '10px',
    fontSize: '.8rem',
    fontWeight: 700
  }

const errorCard:
  React.CSSProperties = {
    marginTop: '1.25rem',
    padding: '1rem',
    color: '#ff9b8a',
    background: '#2a1714',
    border: '1px solid #5b2d25',
    borderRadius: '12px',
    fontSize: '.82rem'
  }

const emptyCard:
  React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '.9rem',
    marginTop: '1.25rem',
    padding: '1.25rem',
    background: '#191919',
    border: '1px solid #303030',
    borderRadius: '14px'
  }

const emptyHeading:
  React.CSSProperties = {
    color: '#fff',
    fontSize: '.9rem',
    fontWeight: 700
  }

const queueGrid:
  React.CSSProperties = {
    display: 'grid',
    gap: '1rem',
    marginTop: '1.25rem'
  }

const paymentCard:
  React.CSSProperties = {
    padding: '1.25rem',
    background:
      'linear-gradient(145deg, #1d1d1d 0%, #161616 100%)',
    border: '1px solid #343434',
    borderRadius: '16px'
  }

const paymentCardHeader:
  React.CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '1rem'
  }

const statusBadge:
  React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '.4rem',
    padding: '.35rem .65rem',
    color: '#d8c889',
    background: '#292313',
    border: '1px solid #514523',
    borderRadius: '999px',
    fontSize: '.68rem',
    fontWeight: 700
  }

const packageNameStyle:
  React.CSSProperties = {
    margin: '.8rem 0 0',
    color: '#fff',
    fontSize: '1.15rem'
  }

const amountValue:
  React.CSSProperties = {
    color: '#C7A44B',
    fontSize: '1.65rem',
    fontWeight: 800
  }

const detailsGrid:
  React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns:
      'repeat(auto-fit, minmax(190px, 1fr))',
    gap: '1rem',
    marginTop: '1.25rem',
    paddingTop: '1.25rem',
    borderTop: '1px solid #303030'
  }

const detailBlock:
  React.CSSProperties = {
    minWidth: 0
  }

const detailLabel:
  React.CSSProperties = {
    color: '#777',
    fontSize: '.66rem',
    fontWeight: 700,
    letterSpacing: '.05em',
    textTransform: 'uppercase'
  }

const detailValue:
  React.CSSProperties = {
    overflowWrap: 'anywhere',
    marginTop: '.35rem',
    color: '#ddd',
    fontSize: '.82rem',
    fontWeight: 600,
    lineHeight: 1.4
  }

const pendingFooter:
  React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '.45rem',
    marginTop: '1.25rem',
    padding: '.4rem .7rem',
    color: '#aaa',
    background: '#202020',
    border: '1px solid #333',
    borderRadius: '999px',
    fontSize: '.7rem',
    fontWeight: 600
  }

const pendingDot:
  React.CSSProperties = {
    width: '.45rem',
    height: '.45rem',
    background: '#C7A44B',
    borderRadius: '999px'
  }

  const reviewActions:
React.CSSProperties = {

  marginTop: '1.5rem',

  display: 'grid',

  gap: '.8rem'
}

const rejectionInput:
React.CSSProperties = {

  width: '100%',

  minHeight: '80px',

  padding: '.8rem',

  color: '#fff',

  background: '#111',

  border: '1px solid #333',

  borderRadius: '10px',

  resize: 'vertical'
}

const reviewButtons:
React.CSSProperties = {

  display: 'flex',

  gap: '.75rem'
}

const approveButton:
React.CSSProperties = {

  flex: 1,

  padding: '.75rem',

  background: '#2b7a3d',

  color: '#fff',

  border: 'none',

  borderRadius: '10px',

  cursor: 'pointer',

  fontWeight: 700
}

const rejectButton:
React.CSSProperties = {

  flex: 1,

  padding: '.75rem',

  background: '#8b2b2b',

  color: '#fff',

  border: 'none',

  borderRadius: '10px',

  cursor: 'pointer',

  fontWeight: 700
}