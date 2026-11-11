'use client'

import Link from 'next/link'
import { Bell, ArrowRight } from 'lucide-react'

export type MarketHubNotification = {
  id: string
  type: string
  title: string
  message: string
  url?: string | null
  isRead: boolean
  createdAt: string
}

type Props = {
  language: 'en' | 'es'
  notifications: MarketHubNotification[]
  onOpenNotification?: (
    notificationId: string
  ) => void
  onMarkRead?: (
    notificationId: string
  ) => void
  onMarkUnread?: (
    notificationId: string
  ) => void
  onMarkAllRead?: () => void
}

export default function MarketHubNotificationFeed({
  language,
  notifications,
  onOpenNotification,
  onMarkRead,
  onMarkUnread,
  onMarkAllRead
}: Props) {
  const labels =
    language === 'es'
      ? {
          heading: 'Notificaciones',
          unread: 'No leídas',
          empty: 'No tiene notificaciones.',
          open: 'Abrir'
        }
      : {
          heading: 'Notifications',
          unread: 'Unread',
          empty: 'You have no notifications.',
          open: 'Open'
        }

  return (
    <>
      <div style={subsectionHeader}>
        <div>
            <h3 style={sectionHeading}>
            <Bell
                size={20}
                strokeWidth={1}
                color="#C7A44B"
            />

            {labels.heading}

            <span style={count}>
                {notifications.length}
            </span>
            </h3>
        </div>

        <button
            type="button"
            onClick={() =>
            onMarkAllRead?.()
            }
            style={markAllButton}
        >
            {language === 'es'
            ? 'Marcar todo como leído'
            : 'Mark All Read'}
        </button>
        </div>

      {notifications.length === 0 ? (
        <div style={emptyState}>
          <Bell
            size={36}
            strokeWidth={0.75}
            color="#C7A44B"
          />

          <p style={emptyText}>
            {labels.empty}
          </p>
        </div>
      ) : (
        <div style={notificationGrid}>
          {notifications.map(notification => (
            <Link
              key={notification.id}
              href={notification.url ?? '#'}
              onClick={() =>
                    onOpenNotification?.(
                    notification.id
                    )
                }
              style={{
                ...notificationCard,
                opacity: notification.isRead ? .65 : 1
              }}
            >
              <div style={notificationIconWrap}>
                <Bell
                  size={24}
                  strokeWidth={1}
                  color="#C7A44B"
                />
              </div>

              <div style={notificationContent}>
                <h4 style={notificationTitle}>
                  {notification.title}
                </h4>

                <div style={notificationMessage}>
                  {notification.message}
                </div>

                <div style={notificationDate}>
                  {notification.createdAt}
                </div>
                <div style={notificationActions}>
                    {notification.isRead ? (
                        <button
                        type="button"
                        onClick={event => {
                            event.preventDefault()
                            event.stopPropagation()

                            onMarkUnread?.(
                            notification.id
                            )
                        }}
                        style={notificationButton}
                        >
                        {language === 'es'
                            ? 'Marcar como no leído'
                            : 'Mark Unread'}
                        </button>
                    ) : (
                        <button
                        type="button"
                        onClick={event => {
                            event.preventDefault()
                            event.stopPropagation()

                            onMarkRead?.(
                            notification.id
                            )
                        }}
                        style={notificationButton}
                        >
                        {language === 'es'
                            ? 'Marcar como leído'
                            : 'Mark Read'}
                        </button>
                    )}
                    </div>
              </div>

              <ArrowRight
                size={20}
                strokeWidth={1}
                color="#C7A44B"
              />
            </Link>
          ))}
        </div>
      )}
    </>
  )
}

const subsectionHeader = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  marginBottom: '1rem'
}

const sectionHeading = {
  display: 'flex',
  alignItems: 'center',
  gap: '.6rem',
  margin: 0,
  color: '#ff3b00',
  fontSize: '1.1rem'
}

const count = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: '1.7rem',
  height: '1.7rem',
  padding: '0 .45rem',
  background: '#292929',
  borderRadius: '999px',
  color: '#fff',
  fontSize: '.78rem'
}

const emptyState = {
  display: 'grid',
  justifyItems: 'center',
  gap: '.8rem',
  padding: '2rem',
  background: '#191919',
  border: '1px dashed #3a3a3a',
  borderRadius: '14px'
}

const emptyText = {
  margin: 0,
  color: '#999'
}

const notificationGrid = {
  display: 'grid',
  gridTemplateColumns:
    'repeat(auto-fit,minmax(270px,1fr))',
  gap: '1rem'
}

const notificationCard = {
  display: 'grid',
  gridTemplateColumns:
    'auto minmax(0,1fr) auto',
  gap: '.85rem',
  padding: '1rem',
  background: '#1b1b1b',
  border: '1px solid #303030',
  borderRadius: '14px',
  color: '#fff',
  textDecoration: 'none'
}

const notificationIconWrap = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '2.75rem',
  height: '2.75rem',
  background: '#161616',
  borderRadius: '999px'
}

const notificationContent = {
  minWidth: 0
}

const notificationTitle = {
  margin: 0,
  color: '#fff',
  fontSize: '1rem'
}

const notificationMessage = {
  marginTop: '.35rem',
  color: '#aaa',
  fontSize: '.82rem'
}

const notificationDate = {
  marginTop: '.4rem',
  color: '#777',
  fontSize: '.72rem'
}

const notificationActions = {
  marginTop: '.65rem'
}

const notificationButton = {
  padding: '.45rem .7rem',
  color: '#C7A44B',
  background: '#161616',
  border: '1px solid #303030',
  borderRadius: '8px',
  cursor: 'pointer',
  fontSize: '.75rem'
}

const markAllButton = {
  padding: '.55rem .8rem',
  color: '#C7A44B',
  background: '#191919',
  border: '1px solid #303030',
  borderRadius: '8px',
  cursor: 'pointer'
}