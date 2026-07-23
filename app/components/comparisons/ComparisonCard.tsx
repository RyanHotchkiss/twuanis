'use client'

import Link from 'next/link'

import type {
  ComparisonKind,
  ComparisonLanguage
} from '@/lib/comparisons/types'

type ComparisonCardProps = {
  id: string
  kind: ComparisonKind
  title: string
  summary: string
  updatedAt: string
  href: string
  language: ComparisonLanguage
  countLabel?: string
  onDelete?: (
    comparisonId: string
  ) => Promise<void> | void
}

export default function ComparisonCard({
  id,
  kind,
  title,
  summary,
  updatedAt,
  href,
  language,
  countLabel,
  onDelete
}: ComparisonCardProps) {
  async function handleDelete() {
    if (!onDelete) {
      return
    }

    const confirmed =
      window.confirm(
        language === 'es'
          ? '¿Eliminar esta comparación?'
          : 'Delete this comparison?'
      )

    if (!confirmed) {
      return
    }

    await onDelete(id)
  }

  return (
    <article style={card}>
      <div style={cardHeader}>
        <span style={badge}>
          {getKindLabel(
            kind,
            language
          )}
        </span>

        {countLabel && (
          <span style={count}>
            {countLabel}
          </span>
        )}
      </div>

      <h2 style={titleStyle}>
        {title}
      </h2>

      <p style={summaryStyle}>
        {summary}
      </p>

      <p style={updated}>
        {language === 'es'
          ? `Actualizado: ${updatedAt}`
          : `Updated: ${updatedAt}`}
      </p>

      <div style={actions}>
        <Link
          href={href}
          style={openButton}
        >
          {language === 'es'
            ? 'Abrir comparación'
            : 'Open comparison'}
        </Link>

        {onDelete && (
          <button
            type="button"
            onClick={handleDelete}
            style={deleteButton}
          >
            {language === 'es'
              ? 'Eliminar'
              : 'Delete'}
          </button>
        )}
      </div>
    </article>
  )
}

function getKindLabel(
  kind: ComparisonKind,
  language: ComparisonLanguage
): string {
  const labels = {
    property: {
      en: 'Property',
      es: 'Propiedades'
    },
    market: {
      en: 'Market',
      es: 'Mercados'
    },
    entity: {
      en: 'Entity',
      es: 'Entidades'
    }
  }

  return labels[kind][language]
}

const card = {
  display: 'flex',
  minHeight: '250px',
  padding: '1.25rem',
  flexDirection: 'column' as const,
  border: '1px solid #262626',
  borderRadius: '16px',
  background: '#111'
}

const cardHeader = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '1rem'
}

const badge = {
  padding: '0.35rem 0.65rem',
  borderRadius: '999px',
  background: '#202020',
  color: '#bbb',
  fontSize: '0.75rem',
  fontWeight: 700,
  textTransform: 'uppercase' as const
}

const count = {
  color: '#777',
  fontSize: '0.8rem'
}

const titleStyle = {
  margin: '1rem 0 0',
  color: '#fff',
  fontSize: '1.2rem'
}

const summaryStyle = {
  margin: '0.75rem 0 0',
  color: '#aaa',
  lineHeight: 1.5
}

const updated = {
  margin: 'auto 0 0',
  paddingTop: '1.25rem',
  color: '#666',
  fontSize: '0.8rem'
}

const actions = {
  display: 'flex',
  gap: '0.75rem',
  marginTop: '1rem'
}

const openButton = {
  flex: 1,
  padding: '0.75rem 1rem',
  borderRadius: '9px',
  background: '#ededed',
  color: '#111',
  textAlign: 'center' as const,
  textDecoration: 'none',
  fontWeight: 700
}

const deleteButton = {
  padding: '0.75rem 1rem',
  border: '1px solid #333',
  borderRadius: '9px',
  background: 'transparent',
  color: '#aaa',
  cursor: 'pointer'
}