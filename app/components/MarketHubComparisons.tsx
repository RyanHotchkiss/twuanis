import Link from 'next/link'

import type {
  ComparisonKind,
  ComparisonLanguage
} from '@/lib/comparisons/types'

type MarketHubComparisonsProps = {
  language: ComparisonLanguage
}

type ComparisonOption = {
  kind: ComparisonKind
  titleEn: string
  titleEs: string
  descriptionEn: string
  descriptionEs: string
  hrefEn: string
  hrefEs: string
}

const comparisonOptions: ComparisonOption[] = [
  {
    kind: 'property',
    titleEn: 'Property Comparisons',
    titleEs: 'Comparaciones de Propiedades',
    descriptionEn:
      'Compare individual listings by price, size, rooms, features, and location.',
    descriptionEs:
      'Compare propiedades individuales por precio, tamaño, habitaciones, características y ubicación.',
    hrefEn: '/en/compare/properties',
    hrefEs: '/es/comparar/propiedades'
  },
  {
    kind: 'market',
    titleEn: 'Market Comparisons',
    titleEs: 'Comparaciones de Mercados',
    descriptionEn:
      'Compare markets using geography, inventory, pricing, and property filters.',
    descriptionEs:
      'Compare mercados mediante ubicación, inventario, precios y filtros de propiedades.',
    hrefEn: '/en/compare/markets',
    hrefEs: '/es/comparar/mercados'
  },
  {
    kind: 'entity',
    titleEn: 'Entity Comparisons',
    titleEs: 'Comparaciones de Entidades',
    descriptionEn:
      'Compare ontology entities using market statistics and knowledge graph relationships.',
    descriptionEs:
      'Compare entidades de la ontología mediante estadísticas y relaciones del grafo de conocimiento.',
    hrefEn: '/en/compare/entities',
    hrefEs: '/es/comparar/entidades'
  }
]

export default function MarketHubComparisons({
  language
}: MarketHubComparisonsProps) {
  const spanish =
    language === 'es'

  return (
    <section style={section}>
      <header style={header}>
        <div>
          <p style={eyebrow}>
            {spanish
              ? 'Inteligencia Comparativa'
              : 'Comparative Intelligence'}
          </p>

          <h2 style={heading}>
            {spanish
              ? 'Comparaciones'
              : 'Comparisons'}
          </h2>

          <p style={description}>
            {spanish
              ? 'Compare propiedades, mercados y entidades mediante tres sistemas especializados.'
              : 'Compare properties, markets, and entities through three specialized systems.'}
          </p>
        </div>
      </header>

      <div style={grid}>
        {comparisonOptions.map(
          option => (
            <Link
              key={option.kind}
              href={
                spanish
                  ? option.hrefEs
                  : option.hrefEn
              }
              style={card}
            >
              <div style={iconWrap}>
                <ComparisonIcon
                  kind={option.kind}
                />
              </div>

              <div style={cardContent}>
                <h3 style={cardTitle}>
                  {spanish
                    ? option.titleEs
                    : option.titleEn}
                </h3>

                <p style={cardDescription}>
                  {spanish
                    ? option.descriptionEs
                    : option.descriptionEn}
                </p>

                <span style={action}>
                  {spanish
                    ? 'Abrir comparaciones'
                    : 'Open comparisons'}

                  <span aria-hidden="true">
                    →
                  </span>
                </span>
              </div>
            </Link>
          )
        )}
      </div>
    </section>
  )
}

function ComparisonIcon({
  kind
}: {
  kind: ComparisonKind
}) {
  if (kind === 'property') {
    return (
      <svg
        viewBox="0 0 24 24"
        width="24"
        height="24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M3 11.5 12 4l9 7.5" />
        <path d="M5.5 10.5V20h13v-9.5" />
        <path d="M9 20v-6h6v6" />
      </svg>
    )
  }

  if (kind === 'market') {
    return (
      <svg
        viewBox="0 0 24 24"
        width="24"
        height="24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M4 20V10" />
        <path d="M10 20V4" />
        <path d="M16 20v-7" />
        <path d="M22 20H2" />
      </svg>
    )
  }

  return (
    <svg
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="6" cy="12" r="2.5" />
      <circle cx="18" cy="6" r="2.5" />
      <circle cx="18" cy="18" r="2.5" />
      <path d="m8.3 10.8 7.4-3.6" />
      <path d="m8.3 13.2 7.4 3.6" />
    </svg>
  )
}

const section = {
  width: '100%',
  maxWidth: '1200px',
  margin: '0 auto',
  padding: '1.5rem',
  border: '1px solid #262626',
  borderRadius: '18px',
  background: '#111'
}

const header = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: '1rem',
  marginBottom: '1.25rem'
}

const eyebrow = {
  margin: '0 0 0.45rem',
  color: '#777',
  fontSize: '0.72rem',
  fontWeight: 700,
  letterSpacing: '0.12em',
  textTransform: 'uppercase' as const
}

const heading = {
  margin: 0,
  color: '#fff',
  fontSize: '1.5rem'
}

const description = {
  maxWidth: '680px',
  margin: '0.65rem 0 0',
  color: '#999',
  lineHeight: 1.6
}

const grid = {
  display: 'grid',
  gridTemplateColumns:
    'repeat(auto-fit, minmax(250px, 1fr))',
  gap: '1rem'
}

const card = {
  display: 'flex',
  minHeight: '180px',
  gap: '1rem',
  padding: '1.1rem',
  border: '1px solid #292929',
  borderRadius: '14px',
  background: '#0b0b0b',
  color: 'inherit',
  textDecoration: 'none'
}

const iconWrap = {
  display: 'flex',
  width: '46px',
  height: '46px',
  flex: '0 0 46px',
  alignItems: 'center',
  justifyContent: 'center',
  border: '1px solid #303030',
  borderRadius: '12px',
  background: '#171717',
  color: '#ddd'
}

const cardContent = {
  display: 'flex',
  minWidth: 0,
  flex: 1,
  flexDirection: 'column' as const
}

const cardTitle = {
  margin: 0,
  color: '#fff',
  fontSize: '1.05rem'
}

const cardDescription = {
  margin: '0.65rem 0 0',
  color: '#888',
  fontSize: '0.9rem',
  lineHeight: 1.5
}

const action = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.4rem',
  marginTop: 'auto',
  paddingTop: '1rem',
  color: '#ddd',
  fontSize: '0.85rem',
  fontWeight: 700
}