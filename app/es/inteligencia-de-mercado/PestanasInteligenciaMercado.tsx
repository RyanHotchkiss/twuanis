'use client'

import Link from 'next/link'
import {
  useEffect,
  useState
} from 'react'

import {
  saveAnalysis,
  type SavedAnalysisEngine
} from '@/lib/saved-analyses'

import {
  createMarketComparisonName,
  saveMarketComparison
} from '@/lib/market-comparisons'


import ExploreResults from '@/app/es/explora/ResultadosExplora'
import PriceMeterResults from '@/app/es/precio-por-metro-cuadrado/ResultadosPrecioMetro'
import PricingStrategyResults from '@/app/es/estrategia-de-precios/ResultadosEstrategiaPrecios'
import MarketScarcityResults from '@/app/es/escasez-de-mercado/ResultadosEscasezMercado'
import BuyerDemandResults from '@/app/es/demanda-del-comprador/ResultadosDemandaComprador'
import MarketMatchingResults from '@/app/es/coincidencia-de-mercado/ResultadosCoincidenciaMercado'
import ValuationResults from '@/app/es/valoracion/ResultadosValoracion'
import MarketFilters from '@/app/components/MarketFilters'
import MarketComparisonResults from '@/app/es/comparacion-de-mercado/ResultadosComparacionMercado'
import {
  Compass,
  BadgeDollarSign,
  Target,
  HeartHandshake,
  Scale,
  Ruler,
  ChartColumnIncreasing,
  Construction
} from 'lucide-react'

import {
  recordMarketViewed
} from '@/lib/activity/markets'

import {
  recordRecentActivity
} from '@/lib/account-storage'

type Props = {
  activeTab: string
  filters: any
  explorerResult: any
  priceMeterAnalysis: any
  pricingStrategy: any
  marketScarcity: any
  buyerDemand: any
  marketMatches: any
  valuation: any
  comparison: any
  options: any
  embedded?: boolean
}

const tabs = [
      {
        id: 'explorer',
        package: 'Paquete de Exploración del Mercado (Gratuito)',
        color: '#2ecc71',
        icon: Compass,
        label: 'Explorador de Mercado',
        description: 'Explore propiedades y características del mercado.'
      },

      {
        id: 'valuation',
        package: 'Paquete de Valoración y Estrategia de Precios',
        color: '#0066cc',
        icon: BadgeDollarSign,
        label: 'Valoración',
        description: 'Estime el valor de una propiedad.'
      },

      {
        id: 'pricing',
        package: 'Paquete de Valoración y Estrategia de Precios',
        color: '#0066cc',
        icon: Target,
        label: 'Estrategia de Precios',
        description: 'Elija un precio de publicación competitivo.'
      },

      {
        id: 'matching',
        package: 'Paquete de Valoración y Estrategia de Precios',
        color: '#0066cc',
        icon: HeartHandshake,
        label: 'Coincidencia de Propiedades',
        description: 'Encuentre propiedades que se adapten mejor a sus necesidades.'
      },

      {
        id: 'comparison',
        package: 'Paquete de Análisis de Mercado',
        color: '#ff3b00',
        icon: Scale,
        label: 'Comparación de Mercados',
        description: 'Compare dos mercados inmobiliarios.'
      },

      {
        id: 'scarcity',
        package: 'Paquete de Análisis de Mercado',
        color: '#ff3b00',
        icon: ChartColumnIncreasing,
        label: 'Frecuencia del Mercado',
        description: 'Mida qué tan comunes o poco comunes son las características de las propiedades.'
      },

      {
        id: 'price-meter',
        package: 'Paquete de Inteligencia de Precios',
        color: '#ffd700',
        icon: Ruler,
        label: 'Inteligencia de Precio / m²',
        description: 'Analice la eficiencia del precio entre mercados.'
      },

      {
        id: 'buyer-demand',
        package: 'Paquete de Comportamiento y Dinámica del Mercado',
        color: '#dc143c',
        icon: Construction,
        label: 'Demanda de Compradores',
        description: 'Motor futuro',
        disabled: true
      },

      {
        id: 'market-velocity',
        package: 'Paquete de Comportamiento y Dinámica del Mercado',
        color: '#dc143c',
        icon: Construction,
        label: 'Velocidad del Mercado',
        description: 'Motor futuro',
        disabled: true
      },

      {
        id: 'price-dynamics',
        package: 'Paquete de Comportamiento y Dinámica del Mercado',
        color: '#dc143c',
        icon: Construction,
        label: 'Dinámica de Precios',
        description: 'Motor futuro',
        disabled: true
      },

      {
        id: 'listing-lifecycle',
        package: 'Paquete de Comportamiento y Dinámica del Mercado',
        color: '#dc143c',
        icon: Construction,
        label: 'Ciclo de Vida de las Publicaciones',
        description: 'Motor futuro',
        disabled: true
      },

      {
        id: 'seller-behavior',
        package: 'Paquete de Comportamiento y Dinámica del Mercado',
        color: '#dc143c',
        icon: Construction,
        label: 'Comportamiento de los Vendedores',
        description: 'Motor futuro',
        disabled: true
      }
    ]

    export default function PestanasInteligenciaMercado({
          activeTab,
          options,
          filters,
          explorerResult,
          priceMeterAnalysis,
          pricingStrategy,
          marketScarcity,
          buyerDemand,
          marketMatches,
          valuation,
          comparison,
          embedded = false
        }: Props) {


          const [
              saveStatus,
              setSaveStatus
            ] = useState<
              | 'idle'
              | 'saving'
              | 'saved'
              | 'error'
            >('idle')
            function getActiveResult() {
              switch (activeTab) {
                case 'explorer':
                  return explorerResult
                case 'valuation':
                  return valuation
                case 'pricing':
                  return pricingStrategy
                case 'matching':
                  return marketMatches
                case 'comparison':
                  return comparison
                case 'scarcity':
                  return marketScarcity
                case 'price-meter':
                  return priceMeterAnalysis
                case 'buyer-demand':
                  return buyerDemand
                default:
                  return null
              }
            }


            function getAnalysisName() {
              const tab =
                tabs.find(
                  item =>
                    item.id === activeTab
                )
              const location = [
                filters.district,
                filters.canton,
                filters.province
              ]
                .filter(Boolean)
                .join(', ')
              return location
                ? `${
                    tab?.label ||
                    'Análisis de Mercado'
                  } · ${location}`
                : (
                    tab?.label ||
                    'Análisis de Mercado'
                  )
            }


            async function handleSaveAnalysis() {
              const result =
                getActiveResult()
              if (!result) {
                setSaveStatus(
                  'error'
                )
                return
              }
              try {
                setSaveStatus(
                  'saving'
                )
                if (
                  activeTab ===
                  'comparison'
                ) {
                  await saveMarketComparison({
                    name:
                      createMarketComparisonName({
                        filters,
                        language: 'es'
                      }),
                    filters,
                    result
                  })
                } else {
                  await saveAnalysis({
                    engineType:
                      activeTab as
                        SavedAnalysisEngine,
                    language:
                      'es',
                    name:
                      getAnalysisName(),
                    filters,
                    result
                  })

                  await recordRecentActivity(
                  'market_saved',
                  'market',
                  `explorer:${queryString}`,
                  {
                    title: getAnalysisName(),
                    href: `/es/inteligencia-de-mercado?${queryString}&tab=${activeTab}`,
                    engine: activeTab,
                    filters
                  }
                )

                }
                setSaveStatus(
                  'saved'
                )
                window.dispatchEvent(
                  new Event(
                    'market-comparisons-updated'
                  )
                )
              } catch (error) {
                console.error(
                  'ERROR AL GUARDAR:',
                  error
                )

                setSaveStatus(
                  'error'
                )
              }
            }



          const query =
            new URLSearchParams()

          Object.entries(filters).forEach(
            ([key, value]) => {
              if (value) {
                query.set(
                  key,
                  String(value)
                )
              }
            }
          )

          const queryString =
            query.toString()

          useEffect(() => {
            const result = getActiveResult()

            if (!result) {
              return
            }

            const location = [
              filters.district,
              filters.canton,
              filters.province
            ]
              .filter(Boolean)
              .join(', ')

            const tab =
              tabs.find(
                item => item.id === activeTab
              )

            const title =
              location || 'Costa Rica'

            recordMarketViewed({
              id: `${activeTab}:${queryString}`,
              title,
              marketType:
                tab?.label || activeTab,
              summary:
            `Análisis de ${tab?.label || activeTab}`,

          href:
            `/es/inteligencia-de-mercado?${queryString}&tab=${activeTab}`
            })
          }, [
            activeTab,
            explorerResult,
            valuation,
            pricingStrategy,
            marketMatches,
            comparison,
            marketScarcity,
            priceMeterAnalysis,
            buyerDemand,
            queryString,
            filters.district,
            filters.canton,
            filters.province
          ])

          return (
            <>

{!embedded && (
    <div style={tabBar}>

    {tabs.map(tab => {
          const Icon = tab.icon

          return (
          <Link
            key={tab.id}
            href={`/es/inteligencia-de-mercado?${query.toString()}&tab=${tab.id}`}
            style={{
              ...card,
              borderColor:
                activeTab === tab.id
                  ? tab.color
                  : '#333',
              opacity:
                tab.disabled ? .45 : 1,
              pointerEvents:
                tab.disabled ? 'none' : 'auto'
            }}
          >
            <div
              style={{
                marginBottom: '.8rem'
              }}
            >
              <Icon
                size={42}
                strokeWidth={0.5}
                color="#C7A44B"
              />
            </div>

            <div
              style={{
                color: '#fff',
                fontSize: '1.35rem',
                lineHeight: 1.2,
                marginBottom: '.55rem'
              }}
            >
              {tab.label}
            </div>

            <div
              style={{
                color: '#9a9a9a',
                fontSize: '.9rem',
                lineHeight: 1.4
              }}
            >
              {tab.description}
            </div>

            <div
              style={{
                marginTop: 'auto',
                paddingTop: '1.25rem',
                color: tab.color,
                fontWeight: 700,
                fontSize: '.75rem',
                textTransform: 'uppercase',
                letterSpacing: '.08em'
              }}
            >
              {tab.package}
            </div>
          </Link>
         )
        })}
  </div>
)}

<section style={filterSection}>
        <h2 style={sectionTitle}>
          Filtros del Mercado
        </h2>

        <MarketFilters
            language="es"
            mode={
              activeTab === 'comparison'
                ? 'comparison'
                : 'single'
            }
            options={options}
            filters={filters}
            basePath={
              embedded
                ? `/es/centro-de-mercado?intelligence=${
                    activeTab === 'explorer'
                      ? 'explore'
                      : activeTab
                  }`
                : `/es/inteligencia-de-mercado?tab=${activeTab}`
            }
          />
      </section>


            <div
                style={{
                  display: 'flex',
                  justifyContent:
                    'flex-end',
                  marginBottom:
                    '1rem'
                }}
              >
                <button
                  type="button"
                  onClick={
                    handleSaveAnalysis
                  }
                  disabled={
                    saveStatus ===
                      'saving' ||
                    !getActiveResult()
                  }
                  style={{
                    background:
                      saveStatus ===
                        'saved'
                        ? '#D4AF37'
                        : '#fff',

                    border:
                      '1px solid #fff',

                    color:
                      '#000',

                    padding:
                      '12px 20px',

                    borderRadius:
                      '999px',

                    cursor:
                      saveStatus ===
                        'saving'
                        ? 'wait'
                        : 'pointer',

                    fontWeight:
                      'bold',

                    opacity:
                      !getActiveResult()
                        ? .45
                        : 1
                  }}
                >
                  {saveStatus ===
                    'saving'
                    ? 'Guardando...'
                    : saveStatus ===
                        'saved'
                    ? (
                        activeTab ===
                          'comparison'
                          ? 'Comparación Guardada'
                          : 'Análisis Guardado'
                      )
                    : saveStatus ===
                        'error'
                    ? 'No se pudo guardar'
                    : (
                        activeTab ===
                          'comparison'
                          ? 'Guardar Comparación'
                          : 'Guardar Análisis'
                      )}
                </button>
              </div>

      <div style={content}>

        {activeTab ===
          'explorer' && (
          explorerResult
            ? (
              <ExploreResults
                result={explorerResult}
                embedded={embedded}
              />
            )
            : (
              <EmptyState />
            )
        )}

        {activeTab ===
            'price-meter' && (
            priceMeterAnalysis
              ? (
                <PriceMeterResults
                  filters={filters}
                  analysis={
                    priceMeterAnalysis
                  }
                />
              )
              : (
                <EmptyState />
              )
          )}

        {activeTab === 'pricing' && (
          <PricingStrategyResults
            filters={filters}
            strategy={pricingStrategy}
          />
        )}

        {activeTab === 'scarcity' && (
          <MarketScarcityResults
            filters={filters}
            scarcity={marketScarcity}
            options={options}
          />
        )}

        {activeTab === 'matching' && (
          <MarketMatchingResults
            filters={filters}
            matches={marketMatches}
          />
        )}

        {activeTab === 'valuation' && (
          <ValuationResults
            filters={filters}
            valuation={valuation}
          />
        )}

        {activeTab === 'comparison' && (
          <MarketComparisonResults
            comparison={comparison}
          />
        )}

        {activeTab === 'buyer-demand' && (
          <BuyerDemandResults
            filters={filters}
            demand={buyerDemand}
          />
        )}

      </div>
    </>
  )
}

function EmptyState() {
  return (
    <div style={empty}>
      Seleccione filtros del mercado para comenzar a explorar.
    </div>
  )
}

const tabBar = {
  display: 'grid',
  gridTemplateColumns:
    'repeat(auto-fit,minmax(220px,1fr))',
  gap: '1rem',
  marginTop: '2rem',
  marginBottom: '2.5rem'
}

const card = {
  background: '#181818',
  border: '2px solid',
  borderRadius: '16px',
  padding: '1.25rem',
  textDecoration: 'none',
  transition: '.2s',
  minHeight: '170px',
  display: 'flex',
  flexDirection: 'column' as const,
  justifyContent: 'flex-start'
}

const tabButton = {
  padding: '.8rem 1.25rem',
  borderRadius: '999px',
  textDecoration: 'none',
  background: '#181818',
  color: '#aaa',
  border: '1px solid #333',
  transition: '.2s'
}

const activeTabStyle = {
  color: '#fff',
  border: '1px solid #D4AF37',
  background: '#222'
}

const content = {
  marginTop: '2rem'
}

const empty = {
  padding: '3rem',
  textAlign: 'center' as const,
  color: '#888'
}

const sectionTitle = {
  color: '#ff3B00',
  fontSize: '2rem',
  margin: '2rem 0 1rem'
}

const filterSection = {
  marginBottom: '2rem'
}