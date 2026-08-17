'use client'

import type {
  ReactNode
} from 'react'

import {
  useRouter,
  useSearchParams
} from 'next/navigation'

import {
  BarChart3,
  Calculator,
  Compass,
  Gauge,
  GitCompareArrows,
  LayoutDashboard,
  Ruler,
  Search,
  Target,
  Tags
} from 'lucide-react'

import MarketHubMarketIntelligence
  from '@/app/components/MarketHubMarketIntelligence'

import MarketHubCompare
  from '@/app/components/MarketHubCompare'

type SupportedLanguage =
  | 'en'
  | 'es'


type IntelligenceWorkspace =
  | 'overview'
  | 'explore'
  | 'valuation'
  | 'pricing'
  | 'matching'
  | 'comparison'
  | 'scarcity'
  | 'price-meter'
  | 'behavior'


type MarketHubIntelligenceProps = {
  language:
    SupportedLanguage

  engineContent?:
  ReactNode

  compareContent?:
    ReactNode
}


export default function MarketHubIntelligence({
  language,
  engineContent,
  compareContent
}: MarketHubIntelligenceProps) {

  const router =
  useRouter()

const searchParams =
  useSearchParams()


const requestedWorkspace =
  searchParams.get(
    'intelligence'
  )


const validWorkspaces:
  IntelligenceWorkspace[] = [
    'overview',
    'explore',
    'valuation',
    'pricing',
    'matching',
    'comparison',
    'scarcity',
    'price-meter',
    'behavior'
  ]


const activeWorkspace:
  IntelligenceWorkspace =
  validWorkspaces.includes(
    requestedWorkspace as IntelligenceWorkspace
  )
    ? (
        requestedWorkspace as
          IntelligenceWorkspace
      )
    : 'overview'

    function selectWorkspace(
        workspace:
          IntelligenceWorkspace
      ) {

        const params =
          new URLSearchParams(
            searchParams.toString()
          )

        if (
            workspace ===
            'comparison'
          ) {
            const singleMarketKeys = [
              'transaction_type',
              'province',
              'canton',
              'district',
              'property_type',
              'bedrooms',
              'bathrooms',
              'parking',
              'year_built',
              'property_area',
              'construction_area',
              'utility',
              'environment',
              'terrain',
              'accessibility',
              'legal_status'
            ]

            singleMarketKeys.forEach(
              key => {
                params.delete(key)
              }
            )
          }


        if (
          workspace ===
          'overview'
        ) {
          params.delete(
            'intelligence'
          )
        } else {
          params.set(
            'intelligence',
            workspace
          )
        }


        const query =
          params.toString()


        router.push(
          query
            ? `?${query}`
            : '?'
        )
      }

  const labels =
    language === 'es'
      ? {
          overview:
            'Resumen',

          explore:
            'Explorar',

          valuation:
            'Valoración',

          pricing:
            'Precios',

          matching:
            'Coincidencias',

          comparison:
            'Comparar',

          scarcity:
            'Escasez',

          priceMeter:
            'Precio / m²',

          behavior:
            'Comportamiento',

          overviewDescription:
            'Su centro de inteligencia inmobiliaria, análisis y actividad de mercado.',

          exploreDescription:
            'Explore la estructura, composición y características de cualquier mercado.',

          valuationDescription:
            'Estime el valor de propiedades utilizando evidencia del mercado y propiedades comparables.',

          pricingDescription:
            'Determine la posición y estrategia de precio de una propiedad.',

          matchingDescription:
            'Encuentre propiedades que coincidan con necesidades y prioridades específicas.',

          comparisonDescription:
            'Compare mercados y estructuras inmobiliarias lado a lado.',

          scarcityDescription:
            'Mida la frecuencia y escasez de características dentro de un mercado.',

          priceMeterDescription:
            'Analice el precio por metro cuadrado entre propiedades y mercados.',

          behaviorDescription:
            'Analice cómo compradores, vendedores, propiedades y precios cambian con el tiempo.'
        }
      : {
          overview:
            'Overview',

          explore:
            'Explore',

          valuation:
            'Valuation',

          pricing:
            'Pricing',

          matching:
            'Matching',

          comparison:
            'Compare',

          scarcity:
            'Scarcity',

          priceMeter:
            'Price / m²',

          behavior:
            'Behavior',

          overviewDescription:
            'Your command center for real estate intelligence, analysis, and market activity.',

          exploreDescription:
            'Explore the structure, composition, and characteristics of any market.',

          valuationDescription:
            'Estimate property value using market evidence and comparable properties.',

          pricingDescription:
            'Determine the market position and pricing strategy for a property.',

          matchingDescription:
            'Find properties aligned with specific buyer needs and priorities.',

          comparisonDescription:
            'Compare markets and real estate structures side by side.',

          scarcityDescription:
            'Measure the frequency and scarcity of characteristics within a market.',

          priceMeterDescription:
            'Analyze price per square meter across properties and markets.',

          behaviorDescription:
            'Analyze how buyers, sellers, listings, and prices change over time.'
        }


  const navigationItems = [
    {
      id:
        'overview' as const,

      label:
        labels.overview,

      icon:
        LayoutDashboard
    },

    {
      id:
        'explore' as const,

      label:
        labels.explore,

      icon:
        Compass
    },

    {
      id:
        'valuation' as const,

      label:
        labels.valuation,

      icon:
        Calculator
    },

    {
      id:
        'pricing' as const,

      label:
        labels.pricing,

      icon:
        Tags
    },

    {
      id:
        'matching' as const,

      label:
        labels.matching,

      icon:
        Target
    },

    {
      id:
        'comparison' as const,

      label:
        labels.comparison,

      icon:
        GitCompareArrows
    },

    {
      id:
        'scarcity' as const,

      label:
        labels.scarcity,

      icon:
        Search
    },

    {
      id:
        'price-meter' as const,

      label:
        labels.priceMeter,

      icon:
        Ruler
    },

    {
      id:
        'behavior' as const,

      label:
        labels.behavior,

      icon:
        Gauge
    }
  ]


  const descriptions:
    Record<
      IntelligenceWorkspace,
      string
    > = {

      overview:
        labels.overviewDescription,

      explore:
        labels.exploreDescription,

      valuation:
        labels.valuationDescription,

      pricing:
        labels.pricingDescription,

      matching:
        labels.matchingDescription,

      comparison:
        labels.comparisonDescription,

      scarcity:
        labels.scarcityDescription,

      'price-meter':
        labels.priceMeterDescription,

      behavior:
        labels.behaviorDescription
    }


  return (
    <section style={workspace}>

      <nav style={workspaceTabs}>
        {navigationItems.map(
          item => {

            const Icon =
              item.icon

            const selected =
              activeWorkspace ===
              item.id

            return (
              <button
                key={item.id}
                type="button"
                onClick={() =>
                    selectWorkspace(
                      item.id
                    )
                  }
                style={{
                  ...workspaceTab,

                  color:
                    selected
                      ? '#fff'
                      : '#777',

                  borderBottomColor:
                    selected
                      ? '#C7A44B'
                      : 'transparent'
                }}
              >
                <Icon
                  size={16}
                  strokeWidth={
                    selected
                      ? 1.5
                      : 1
                  }
                />

                <span>
                  {item.label}
                </span>
              </button>
            )
          }
        )}
      </nav>


      <div style={workspaceContext}>
        {
          descriptions[
            activeWorkspace
          ]
        }
      </div>


      <div style={workspaceCanvas}>

        {activeWorkspace ===
          'comparison' && (
          compareContent
            ? compareContent
            : (
              <MarketHubCompare
                language={language}
              />
            )
        )}


        {activeWorkspace ===
          'comparison' && (
          <MarketHubCompare
            language={language}
          />
        )}


        {activeWorkspace !==
          'overview' &&
        activeWorkspace !==
          'comparison' && (
          engineContent
            ? engineContent
            : (
              <IntelligenceWorkspacePlaceholder
                language={language}
                workspace={activeWorkspace}
              />
            )
        )}

      </div>

    </section>
  )
}


function IntelligenceWorkspacePlaceholder({
  language,
  workspace
}: {
  language:
    SupportedLanguage

  workspace:
    Exclude<
      IntelligenceWorkspace,
      'overview'
    >
}) {

  const names:
    Record<
      Exclude<
        IntelligenceWorkspace,
        'overview'
      >,
      {
        en: string
        es: string
      }
    > = {

      explore: {
        en: 'Market Explorer',
        es: 'Explorador de Mercado'
      },

      valuation: {
        en: 'Valuation',
        es: 'Valoración'
      },

      pricing: {
        en: 'Pricing Strategy',
        es: 'Estrategia de Precios'
      },

      matching: {
        en: 'Property Matching',
        es: 'Coincidencia de Propiedades'
      },

      comparison: {
        en: 'Market Comparison',
        es: 'Comparación de Mercados'
      },

      scarcity: {
        en: 'Market Scarcity',
        es: 'Escasez del Mercado'
      },

      'price-meter': {
        en: 'Price / m² Intelligence',
        es: 'Inteligencia de Precio / m²'
      },

      behavior: {
        en: 'Market Behavior',
        es: 'Comportamiento del Mercado'
      }
    }


  const name =
    names[workspace][language]


  return (
    <div style={placeholder}>

      <div style={placeholderEyebrow}>
        {language === 'es'
          ? 'ESPACIO DE INTELIGENCIA'
          : 'INTELLIGENCE WORKSPACE'}
      </div>

      <h2 style={placeholderHeading}>
        {name}
      </h2>

      <p style={placeholderText}>
        {language === 'es'
          ? 'Este motor se integrará directamente en este espacio de trabajo.'
          : 'This engine will be integrated directly into this workspace.'}
      </p>

    </div>
  )
}


const workspace = {
  minWidth: 0
}


const workspaceTabs = {
  display: 'flex',
  alignItems: 'center',
  gap: '1.6rem',
  overflowX: 'auto' as const,
  borderBottom:
    '1px solid #292929'
}


const workspaceTab = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '.45rem',
  flexShrink: 0,
  padding: '0 0 .85rem',
  color: '#777',
  background: 'transparent',
  border: 0,
  borderBottom:
    '2px solid transparent',
  fontFamily: 'inherit',
  fontSize: '.82rem',
  fontWeight: 600,
  cursor: 'pointer'
}


const workspaceContext = {
  marginTop: '1rem',
  color: '#666',
  fontSize: '.78rem',
  lineHeight: 1.5
}


const workspaceCanvas = {
  marginTop: '1.5rem'
}


const placeholder = {
  minHeight: '360px',
  padding: '3rem',
  background:
    'linear-gradient(145deg, #111 0%, #0b0b0b 100%)',
  border:
    '1px solid #292929',
  borderRadius: '18px'
}


const placeholderEyebrow = {
  color: '#C7A44B',
  fontSize: '.68rem',
  fontWeight: 700,
  letterSpacing: '.16em'
}


const placeholderHeading = {
  margin: '.75rem 0 0',
  color: '#f4f1ea',
  fontSize: '2rem',
  fontWeight: 400
}


const placeholderText = {
  maxWidth: '520px',
  margin: '.75rem 0 0',
  color: '#777',
  fontSize: '.9rem',
  lineHeight: 1.6
}