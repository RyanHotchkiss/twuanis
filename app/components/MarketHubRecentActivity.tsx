'use client'

import Link from 'next/link'

import {
  getActivityLabel,
  getActivityTimelineGroup,
  sortActivity,
  type MarketHubActivity
} from '@/lib/activity'

type MarketHubRecentActivityProps = {
  language: 'en' | 'es'
  activity: MarketHubActivity[]
}

export default function MarketHubRecentActivity({
  language,
  activity
}: MarketHubRecentActivityProps) {
  const sortedActivity =
    sortActivity(activity)

    const groupedActivity = {
    today: sortedActivity.filter(
        item =>
        getActivityTimelineGroup(
            item.occurredAt
        ) === 'today'
    ),

    yesterday: sortedActivity.filter(
        item =>
        getActivityTimelineGroup(
            item.occurredAt
        ) === 'yesterday'
    ),

    earlier: sortedActivity.filter(
        item =>
        getActivityTimelineGroup(
            item.occurredAt
        ) === 'earlier'
    )
    }

    const timelineGroupOrder = [
        'today',
        'yesterday',
        'earlier'
        ] as const

  const labels =
    language === 'es'
      ? {
          title: 'Actividad Reciente',
          description:
            'Consulta tus interacciones recientes con propiedades en Twuanis.',
          empty:
            'Todavía no tienes actividad de propiedades.',
          openProperty: 'Ver propiedad'
        }
      : {
          title: 'Recent Activity',
          description:
            'Review your recent property activity throughout Twuanis.',
          empty:
            'You do not have any property activity yet.',
          openProperty: 'View property'
        }

        const timelineLabels =
        language === 'es'
            ? {
                today: 'Hoy',
                yesterday: 'Ayer',
                earlier: 'Anterior'
            }
            : {
                today: 'Today',
                yesterday: 'Yesterday',
                earlier: 'Earlier'
            }

        return (
            <section style={styles.card}>
            <div style={styles.header}>
                <div>
                <h2 style={styles.title}>
                    {labels.title}
                </h2>

                <p style={styles.description}>
                    {labels.description}
                </p>
                </div>
            </div>

            {sortedActivity.length === 0 ? (
                <div style={styles.empty}>
                {labels.empty}
                </div>
            ) : (
                <div style={styles.timeline}>
                {sortedActivity.length === 0 ? (
                    <div style={styles.empty}>
                        {labels.empty}
                    </div>
                    ) : (
                    <div
                        style={{
                        ...styles.timeline,
                        gap: '1.5rem'
                        }}
                    >
                        {timelineGroupOrder.map(group => {
                        const groupActivity =
                            groupedActivity[group]

                        if (groupActivity.length === 0) {
                            return null
                        }

                        return (
                            <div
                            key={group}
                            style={{
                                display: 'grid',
                                gap: '1rem'
                            }}
                            >
                            <h3
                                style={{
                                margin: 0,
                                color: '#64748b',
                                fontSize: '0.875rem',
                                fontWeight: 700,
                                letterSpacing: '0.08em',
                                textTransform: 'uppercase'
                                }}
                            >
                                {timelineLabels[group]}
                            </h3>

                            <div>
                                {groupActivity.map(item => (
                                <article
                                    key={item.id}
                                    style={styles.timelineItem}
                                >
                                    <div
                                    style={{
                                        ...styles.marker,
                                        ...getMarkerStyle(item.type)
                                    }}
                                    />

                                    <div style={styles.content}>
                                    <div style={styles.activityHeader}>
                                        <span style={styles.activityType}>
                                        {getActivityLabel(
                                            item.type,
                                            language
                                        )}
                                        </span>

                                        <time style={styles.time}>
                                        {formatActivityDate(
                                            item.occurredAt,
                                            language
                                        )}
                                        </time>
                                    </div>

                                    <div style={styles.propertyRow}>
                                        {item.propertyImageUrl ? (
                                        <img
                                            src={item.propertyImageUrl}
                                            alt={item.propertyTitle}
                                            style={styles.image}
                                        />
                                        ) : null}

                                        <div style={styles.propertyContent}>
                                        <h3 style={styles.propertyTitle}>
                                            {item.propertyTitle}
                                        </h3>

                                        <Link
                                            href={item.propertyUrl}
                                            style={styles.link}
                                        >
                                            {labels.openProperty}
                                        </Link>
                                        </div>
                                    </div>
                                    </div>
                                </article>
                                ))}
                            </div>
                            </div>
                        )
                        })}
                    </div>
                    )}
        </div>
      )}
    </section>
  )
}

function formatActivityDate(
  occurredAt: string,
  language: 'en' | 'es'
): string {
  return new Intl.DateTimeFormat(
    language === 'es' ? 'es-CR' : 'en-US',
    {
      dateStyle: 'medium',
      timeStyle: 'short'
    }
  ).format(new Date(occurredAt))
}

function getMarkerStyle(
  type: MarketHubActivity['type']
    ): React.CSSProperties {
    switch (type) {
        case 'viewed-property':
        return {
            background: '#2563eb'
        }

        case 'saved-property':
        return {
            background: '#dc2626'
        }

        case 'shared-property':
        return {
            background: '#16a34a'
        }
        case 'published-listing':
            return {
                background: '#16a34a'
            }

            case 'edited-listing':
            return {
                background: '#d97706'
            }

            case 'archived-listing':
            return {
                background: '#64748b'
            }

            case 'created-valuation':
            return {
                background: '#7c3aed'
            }

            case 'compared-markets':
            return {
                background: '#0891b2'
            }

            case 'saved-market-explorer-analysis':
            return {
                background: '#4f46e5'
            }

            case 'saved-search':
            return {
                background: '#0f766e'
            }

            case 'followed-market':
            return {
                background: '#2563eb'
            }

            case 'created-alert':
            return {
                background: '#dc2626'
            }

            case 'purchased-package':
            return {
                background: '#ca8a04'
            }

            case 'renewed-listing':
            return {
                background: '#059669'
            }

            case 'updated-profile':
            return {
                background: '#7c3aed'
            }

    }
    }

const styles: Record<
  string,
  React.CSSProperties
> = {
  card: {
    width: '100%',
    padding: '24px',
    border: '1px solid #e5e7eb',
    borderRadius: '20px',
    background: '#ffffff',
    boxShadow:
      '0 12px 32px rgba(15, 23, 42, 0.06)'
  },

  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '16px',
    marginBottom: '24px'
  },

  title: {
    margin: 0,
    color: '#111827',
    fontSize: '1.35rem',
    fontWeight: 700
  },

  description: {
    margin: '8px 0 0',
    color: '#6b7280',
    fontSize: '0.95rem',
    lineHeight: 1.6
  },

  empty: {
    padding: '32px 20px',
    borderRadius: '14px',
    background: '#f9fafb',
    color: '#6b7280',
    textAlign: 'center'
  },

  timeline: {
    display: 'flex',
    flexDirection: 'column'
  },

  timelineItem: {
    position: 'relative',
    display: 'grid',
    gridTemplateColumns: '18px minmax(0, 1fr)',
    gap: '14px',
    paddingBottom: '22px'
  },

  marker: {
    width: '12px',
    height: '12px',
    marginTop: '6px',
    border: '3px solid #ffffff',
    borderRadius: '999px',
    boxShadow:
      '0 0 0 2px rgba(15, 23, 42, 0.12)'
  },

  content: {
    minWidth: 0,
    paddingBottom: '20px',
    borderBottom: '1px solid #e5e7eb'
  },

  activityHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '8px',
    marginBottom: '12px'
  },

  activityType: {
    color: '#111827',
    fontSize: '0.9rem',
    fontWeight: 700
  },

  time: {
    color: '#6b7280',
    fontSize: '0.8rem'
  },

  propertyRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px'
  },

  image: {
    width: '76px',
    height: '60px',
    flexShrink: 0,
    borderRadius: '10px',
    objectFit: 'cover'
  },

  propertyContent: {
    minWidth: 0
  },

  propertyTitle: {
    margin: '0 0 8px',
    overflow: 'hidden',
    color: '#1f2937',
    fontSize: '0.95rem',
    fontWeight: 600,
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },

  link: {
    color: '#2563eb',
    fontSize: '0.85rem',
    fontWeight: 600,
    textDecoration: 'none'
  }
}