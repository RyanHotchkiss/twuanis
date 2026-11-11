'use client'

import Link from 'next/link'

import type {
  ComparisonKind,
  ComparisonLanguage
} from '@/lib/comparisons/types'

type ComparisonTabsProps = {
  language: ComparisonLanguage
  activeKind: ComparisonKind
}

type ComparisonTab = {
  kind: ComparisonKind
  labelEn: string
  labelEs: string
  hrefEn: string
  hrefEs: string
}

const tabs: ComparisonTab[] = [
  {
    kind: 'property',
    labelEn: 'Property',
    labelEs: 'Propiedades',
    hrefEn: '/en/compare/properties',
    hrefEs: '/es/comparar/propiedades'
  },
  {
    kind: 'market',
    labelEn: 'Market',
    labelEs: 'Mercados',
    hrefEn: '/en/compare/markets',
    hrefEs: '/es/comparar/mercados'
  },
  {
    kind: 'entity',
    labelEn: 'Entity',
    labelEs: 'Entidades',
    hrefEn: '/en/compare/entities',
    hrefEs: '/es/comparar/entidades'
  }
]

export default function ComparisonTabs({
  language,
  activeKind
}: ComparisonTabsProps) {
  return (
    <nav
      aria-label={
        language === 'es'
          ? 'Tipos de comparación'
          : 'Comparison types'
      }
      style={tabsContainer}
    >
      {tabs.map(tab => {
        const active =
          tab.kind === activeKind

        return (
          <Link
            key={tab.kind}
            href={
              language === 'es'
                ? tab.hrefEs
                : tab.hrefEn
            }
            style={{
              ...tabStyle,
              ...(active
                ? activeTab
                : inactiveTab)
            }}
          >
            {language === 'es'
              ? tab.labelEs
              : tab.labelEn}
          </Link>
        )
      })}
    </nav>
  )
}

const tabsContainer = {
  display: 'flex',
  gap: '0.5rem',
  padding: '0.4rem',
  overflowX: 'auto' as const,
  border: '1px solid #262626',
  borderRadius: '14px',
  background: '#111'
}

const tabStyle = {
  flex: '1 0 auto',
  minWidth: '120px',
  padding: '0.85rem 1rem',
  borderRadius: '10px',
  textAlign: 'center' as const,
  textDecoration: 'none',
  fontSize: '0.95rem',
  fontWeight: 700,
  transition:
    'background 160ms ease, color 160ms ease'
}

const activeTab = {
  background: '#ededed',
  color: '#111'
}

const inactiveTab = {
  background: 'transparent',
  color: '#999'
}