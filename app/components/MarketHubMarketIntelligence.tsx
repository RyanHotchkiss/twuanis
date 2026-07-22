'use client'

import Link from 'next/link'
import {
  useEffect,
  useState
} from 'react'

import type {
  ComponentType,
  ReactNode
} from 'react'

import {
  getSavedAnalyses
} from '@/lib/saved-analyses'

import {
  getSavedSearches
} from '@/lib/saved-searches'

import {
  ArrowRight,
  BarChart3,
  Calculator,
  Compass,
  Eye,
  LockKeyhole,
  Search,
  Target,
  Tags
} from 'lucide-react'

type SupportedLanguage =
  | 'en'
  | 'es'

export type MarketExplorerActivity = {
  id: string
  title: string
  market: string
  summary: string
  updatedAt: string
  href: string
}

type MarketIntelligenceEngine = {
  id:
    | 'valuation'
    | 'pricing-strategy'
    | 'property-matching'
    | 'market-comparison'
    | 'market-frequency'
    | 'price-per-square-meter'
    | 'buyer-demand'
    | 'market-velocity'
    | 'price-dynamics'
    | 'listing-lifecycle'
    | 'seller-behavior'
      unlocked: boolean
      savedAnalysisCount?: number
      savedSearchCount?: number
      historyCount?: number
      lastUpdated?: string
}

type EngineConfiguration = {
  name: string
  description: string
  icon: ComponentType<{
    size?: number
    strokeWidth?: number
    color?: string
  }>
  href: string
}

type EngineConfigurationMap = Record<
  MarketIntelligenceEngine['id'],
  EngineConfiguration
>

type EngineLabels = {
  savedAnalyses: string
  savedSearches: string
  history: string
  locked: string
  unlocked: string
  launchEngine: string
  unlockEngine: string
}

type MarketHubMarketIntelligenceProps = {
  language: SupportedLanguage
  savedAnalysisCount?: number
  savedSearchCount?: number
  marketsViewedCount?: number
  lastUpdated?: string
  marketExplorerActivity?: MarketExplorerActivity[]
  valuationAndPricingEngines?: MarketIntelligenceEngine[]
  marketAnalysisEngines?: MarketIntelligenceEngine[]
  marketIntelligenceEngines?: MarketIntelligenceEngine[]
  marketBehaviorEngines?: MarketIntelligenceEngine[]
}

export default function MarketHubMarketIntelligence({
  language,
  savedAnalysisCount:
    initialSavedAnalysisCount = 0,
  savedSearchCount:
    initialSavedSearchCount = 0,
  marketsViewedCount = 0,
  lastUpdated,
  marketExplorerActivity = [],

  valuationAndPricingEngines = [
    {
      id: 'valuation',
      unlocked: false,
      savedAnalysisCount: 0,
      savedSearchCount: 0,
      historyCount: 0
    },
    {
      id: 'pricing-strategy',
      unlocked: false,
      savedAnalysisCount: 0,
      savedSearchCount: 0,
      historyCount: 0
    },
    {
      id: 'property-matching',
      unlocked: false,
      savedAnalysisCount: 0,
      savedSearchCount: 0,
      historyCount: 0
    }
  ],

  marketAnalysisEngines = [
    {
      id: 'market-comparison',
      unlocked: false,
      savedAnalysisCount: 0,
      savedSearchCount: 0,
      historyCount: 0
    },
    {
      id: 'market-frequency',
      unlocked: false,
      savedAnalysisCount: 0,
      savedSearchCount: 0,
      historyCount: 0
    }
  ],

  marketIntelligenceEngines = [
    {
      id: 'price-per-square-meter',
      unlocked: false,
      savedAnalysisCount: 0,
      savedSearchCount: 0,
      historyCount: 0
    }
  ],
  marketBehaviorEngines = [
  {
    id: 'buyer-demand',
    unlocked: false,
    savedAnalysisCount: 0,
    savedSearchCount: 0,
    historyCount: 0
  },
  {
    id: 'market-velocity',
    unlocked: false,
    savedAnalysisCount: 0,
    savedSearchCount: 0,
    historyCount: 0
  },
  {
    id: 'price-dynamics',
    unlocked: false,
    savedAnalysisCount: 0,
    savedSearchCount: 0,
    historyCount: 0
  },
  {
    id: 'listing-lifecycle',
    unlocked: false,
    savedAnalysisCount: 0,
    savedSearchCount: 0,
    historyCount: 0
  },
  {
    id: 'seller-behavior',
    unlocked: false,
    savedAnalysisCount: 0,
    savedSearchCount: 0,
    historyCount: 0
  }
],
}: MarketHubMarketIntelligenceProps) {

    const [
      savedAnalyses,
      setSavedAnalyses
    ] = useState<any[]>([])

    const [
      savedSearches,
      setSavedSearches
    ] = useState<any[]>([])

    const [
      savedDataLoaded,
      setSavedDataLoaded
    ] = useState(false)

      useEffect(() => {
        let active = true

        async function loadSavedData() {
          const [
            analyses,
            searches
          ] = await Promise.all([
            getSavedAnalyses(),
            getSavedSearches()
          ])

          if (!active) {
            return
          }

          setSavedAnalyses(
            analyses
          )

          setSavedSearches(
            searches
          )

          setSavedDataLoaded(true)
        }

        void loadSavedData()

        return () => {
          active = false
        }
      }, [])

        const resolvedSavedAnalysisCount =
          savedDataLoaded
            ? savedAnalyses.length
            : initialSavedAnalysisCount

        const resolvedSavedSearchCount =
          savedDataLoaded
            ? savedSearches.length
            : initialSavedSearchCount

  const labels =
    language === 'es'
      ? {
          heading:
            'Inteligencia de Mercado',

          purpose:
            'Organice cada motor de inteligencia de mercado que haya desbloqueado.',

          marketExplorer:
            'Explorador de Mercado',

          description:
            'Explore propiedades, características y composición del mercado inmobiliario.',

          launch:
            'Iniciar Explorador de Mercado',

          engineStatus:
            'Estado del Motor',

          active:
            'Activo',

          savedAnalyses:
            'Análisis Guardados',

          savedSearches:
            'Búsquedas Guardadas',

          marketsViewed:
            'Mercados Vistos',

          updated:
            'Actualizado',

          recentActivity:
            'Actividad Reciente del Explorador de Mercado',

          activitySummary:
            marketExplorerActivity.length === 1
              ? 'Tiene 1 actividad reciente.'
              : `Tiene ${marketExplorerActivity.length} actividades recientes.`,

          empty:
            'Todavía no tiene actividad en el Explorador de Mercado.',

          valuationAndPricing:
            'Valoración y Precios',

          valuationAndPricingDescription:
            'Estime el valor de propiedades, desarrolle estrategias de precios y encuentre propiedades para compradores.',

          marketAnalysis:
            'Análisis de Mercado',

          marketAnalysisDescription:
            'Compare mercados y mida la frecuencia de características inmobiliarias y condiciones del mercado.',

          marketIntelligence:
            'Inteligencia de Mercado',

          marketIntelligenceDescription:
            'Analice el precio por metro cuadrado entre mercados, vecindarios, tipos de propiedad y áreas de mercado personalizadas.',

          valuation:
            'Valoración',

          valuationDescription:
            'Estime el valor de una propiedad utilizando datos del mercado y propiedades comparables.',

          pricingStrategy:
            'Estrategia de Precios',

          pricingStrategyDescription:
            'Determine una estrategia de precio basada en inventario, competencia y posición de mercado.',

          propertyMatching:
            'Coincidencia de Propiedades',

          propertyMatchingDescription:
            'Encuentre propiedades que coincidan con las necesidades, prioridades y presupuesto del comprador.',

          marketComparison:
            'Comparación de Mercados',

          marketComparisonDescription:
            'Compare provincias, cantones, distritos, vecindarios y mercados personalizados lado a lado.',

          marketFrequency:
            'Frecuencia del Mercado',

          marketFrequencyDescription:
            'Mida la frecuencia de tipos de propiedades, características, precios y condiciones del mercado.',

          pricePerSquareMeter:
            'Inteligencia de Precio por m²',

          pricePerSquareMeterDescription:
            'Mida, compare y visualice el precio por metro cuadrado en Costa Rica.',

          locked:
            'Bloqueado',

          unlocked:
            'Desbloqueado',

          launchEngine:
            'Iniciar Motor',

          unlockEngine:
            'Desbloquear Motor',

          history:
            'Historial',
            marketBehavior:
            'Comportamiento y Dinámica del Mercado',

            marketBehaviorDescription:
            'Analice cómo evolucionan compradores, vendedores, propiedades y precios con el tiempo.',
            buyerDemand:
            'Demanda de Compradores',

            buyerDemandDescription:
            'Mida el interés de los compradores, la actividad de búsqueda y la demanda en Costa Rica.',

            marketVelocity:
            'Velocidad del Mercado',

            marketVelocityDescription:
            'Mida qué tan rápido el inventario entra, cambia y sale del mercado.',

            priceDynamics:
            'Dinámica de Precios',

            priceDynamicsDescription:
            'Analice cambios de precio, apreciación, reducciones y volatilidad.',

            listingLifecycle:
            'Ciclo de Vida del Anuncio',

            listingLifecycleDescription:
            'Analice cómo evolucionan los anuncios desde su publicación hasta su finalización.',

            sellerBehavior:
            'Comportamiento del Vendedor',

            sellerBehaviorDescription:
            'Mida cambios de precio, actualizaciones, retiros y republicaciones.'
        }
      : {
          heading:
            'Market Intelligence',

          purpose:
            'Organize every market intelligence engine you have unlocked.',

          marketExplorer:
            'Market Explorer',

          description:
            'Explore properties, characteristics, and real estate market composition.',

          launch:
            'Launch Market Explorer',

          engineStatus:
            'Engine Status',

          active:
            'Active',

          savedAnalyses:
            'Saved Analyses',

          savedSearches:
            'Saved Searches',

          marketsViewed:
            'Markets Viewed',

          updated:
            'Updated',

          recentActivity:
            'Recent Market Explorer Activity',

          activitySummary:
            marketExplorerActivity.length === 1
              ? 'You have 1 recent activity.'
              : `You have ${marketExplorerActivity.length} recent activities.`,

          empty:
            'You do not have any Market Explorer activity yet.',

          valuationAndPricing:
            'Valuation & Pricing',

          valuationAndPricingDescription:
            'Estimate property value, develop pricing strategies, and match properties to buyer requirements.',

          marketAnalysis:
            'Market Analysis',

          marketAnalysisDescription:
            'Compare markets and measure how frequently property characteristics and market conditions occur.',

          marketIntelligence:
            'Market Intelligence',

          marketIntelligenceDescription:
            'Analyze price per square meter across markets, neighborhoods, property types, and custom market areas.',

          valuation:
            'Valuation',

          valuationDescription:
            'Estimate property value using market data and comparable properties.',

          pricingStrategy:
            'Pricing Strategy',

          pricingStrategyDescription:
            'Determine a pricing strategy based on inventory, competition, and market position.',

          propertyMatching:
            'Property Matching',

          propertyMatchingDescription:
            'Find properties matching a buyer’s needs, priorities, and budget.',

          marketComparison:
            'Market Comparison',

          marketComparisonDescription:
            'Compare provinces, cantons, districts, neighborhoods, and custom markets side-by-side.',

          marketFrequency:
            'Market Frequency',

          marketFrequencyDescription:
            'Measure how frequently property types, characteristics, prices, and market conditions occur.',

          pricePerSquareMeter:
            'Price / m² Intelligence',

          pricePerSquareMeterDescription:
            'Measure, compare, and visualize price per square meter across Costa Rica.',

          locked:
            'Locked',

          unlocked:
            'Unlocked',

          launchEngine:
            'Launch Engine',

          unlockEngine:
            'Unlock Engine',

          history:
            'History',
            marketBehavior:
            'Market Behavior & Dynamics',

            marketBehaviorDescription:
            'Analyze how buyers, sellers, listings, and prices change over time.',
            buyerDemand:
            'Buyer Demand',

            buyerDemandDescription:
            'Measure buyer interest, search activity, and demand across Costa Rica.',

            marketVelocity:
            'Market Velocity',

            marketVelocityDescription:
            'Measure how quickly inventory enters, changes, and leaves the market.',

            priceDynamics:
            'Price Dynamics',

            priceDynamicsDescription:
            'Track pricing movement, appreciation, reductions, and market volatility.',

            listingLifecycle:
            'Listing Lifecycle',

            listingLifecycleDescription:
            'Analyze how listings progress from publication through completion.',

            sellerBehavior:
            'Seller Behavior',

            sellerBehaviorDescription:
            'Measure seller pricing behavior, listing updates, withdrawals, and relistings.'
        }

  const marketExplorerHref =
    language === 'es'
      ? '/es/inteligencia-de-mercado?tab=explorer'
      : '/en/market-intelligence?tab=explorer'

  const resolvedLastUpdated =
    lastUpdated ??
    (language === 'es'
      ? 'Hoy'
      : 'Today')

  const engineConfigurations: EngineConfigurationMap = {
    valuation: {
      name:
        labels.valuation,
      description:
        labels.valuationDescription,
      icon:
        Calculator,
      href:
        language === 'es'
          ? '/es/inteligencia-de-mercado?tab=valuation'
          : '/en/market-intelligence?tab=valuation'
    },

    'pricing-strategy': {
      name:
        labels.pricingStrategy,
      description:
        labels.pricingStrategyDescription,
      icon:
        Tags,
      href:
        language === 'es'
          ? '/es/inteligencia-de-mercado?tab=pricing-strategy'
          : '/en/market-intelligence?tab=pricing-strategy'
    },

    'property-matching': {
      name:
        labels.propertyMatching,
      description:
        labels.propertyMatchingDescription,
      icon:
        Target,
      href:
        language === 'es'
          ? '/es/inteligencia-de-mercado?tab=property-matching'
          : '/en/market-intelligence?tab=property-matching'
    },

    'market-comparison': {
      name:
        labels.marketComparison,
      description:
        labels.marketComparisonDescription,
      icon:
        BarChart3,
      href:
        language === 'es'
          ? '/es/inteligencia-de-mercado?tab=market-comparison'
          : '/en/market-intelligence?tab=market-comparison'
    },

    'market-frequency': {
      name:
        labels.marketFrequency,
      description:
        labels.marketFrequencyDescription,
      icon:
        Search,
      href:
        language === 'es'
          ? '/es/inteligencia-de-mercado?tab=market-frequency'
          : '/en/market-intelligence?tab=market-frequency'
    },

    'price-per-square-meter': {
      name:
        labels.pricePerSquareMeter,
      description:
        labels.pricePerSquareMeterDescription,
      icon:
        BarChart3,
      href:
        language === 'es'
          ? '/es/inteligencia-de-mercado?tab=price-per-square-meter'
          : '/en/market-intelligence?tab=price-per-square-meter'
    },
    'buyer-demand': {
    name: labels.buyerDemand,
    description: labels.buyerDemandDescription,
    icon: Search,
    href:
        language === 'es'
        ? '/es/inteligencia-de-mercado?tab=buyer-demand'
        : '/en/market-intelligence?tab=buyer-demand'
    },

    'market-velocity': {
    name: labels.marketVelocity,
    description: labels.marketVelocityDescription,
    icon: BarChart3,
    href:
        language === 'es'
        ? '/es/inteligencia-de-mercado?tab=market-velocity'
        : '/en/market-intelligence?tab=market-velocity'
    },

    'price-dynamics': {
    name: labels.priceDynamics,
    description: labels.priceDynamicsDescription,
    icon: Tags,
    href:
        language === 'es'
        ? '/es/inteligencia-de-mercado?tab=price-dynamics'
        : '/en/market-intelligence?tab=price-dynamics'
    },

    'listing-lifecycle': {
    name: labels.listingLifecycle,
    description: labels.listingLifecycleDescription,
    icon: Compass,
    href:
        language === 'es'
        ? '/es/inteligencia-de-mercado?tab=listing-lifecycle'
        : '/en/market-intelligence?tab=listing-lifecycle'
    },

    'seller-behavior': {
    name: labels.sellerBehavior,
    description: labels.sellerBehaviorDescription,
    icon: Eye,
    href:
        language === 'es'
        ? '/es/inteligencia-de-mercado?tab=seller-behavior'
        : '/en/market-intelligence?tab=seller-behavior'
    }
  }
    return (
    <section style={section}>
      <header>
        <div style={titleRow}>
          <Compass
            size={25}
            strokeWidth={1}
            color="#C7A44B"
          />

          <h2 style={heading}>
            {labels.heading}
          </h2>
        </div>

        <p style={purpose}>
          {labels.purpose}
        </p>
      </header>

      <div style={divider} />

      <div style={engineHeader}>
        <div style={engineIdentity}>
          <div style={engineIcon}>
            <Compass
              size={32}
              strokeWidth={0.8}
              color="#C7A44B"
            />
          </div>

          <div>
            <h3 style={engineName}>
              {labels.marketExplorer}
            </h3>

            <p style={engineDescription}>
              {labels.description}
            </p>
          </div>
        </div>

        <Link
          href={marketExplorerHref}
          style={launchButton}
        >
          {labels.launch}

          <ArrowRight
            size={18}
            strokeWidth={1}
          />
        </Link>
      </div>

      <div style={statusPanel}>
        <div style={statusHeadingRow}>
          <div>
            <div style={statusLabel}>
              {labels.engineStatus}
            </div>

            <div style={activeStatus}>
              <span style={activeDot} />

              {labels.active}
            </div>
          </div>

          <div style={updatedText}>
            {labels.updated}{' '}
            {resolvedLastUpdated}
          </div>
        </div>

        <div style={statisticsGrid}>
          <Statistic
            icon={
              <BarChart3
                size={20}
                strokeWidth={1}
              />
            }
            value={resolvedSavedAnalysisCount}
            label={labels.savedAnalyses}
          />

          <Statistic
            icon={
              <Search
                size={20}
                strokeWidth={1}
              />
            }
            value={resolvedSavedSearchCount}
            label={labels.savedSearches}
          />

          <Statistic
            icon={
              <Eye
                size={20}
                strokeWidth={1}
              />
            }
            value={marketsViewedCount}
            label={labels.marketsViewed}
          />
        </div>
      </div>

      <div style={divider} />

      <div style={activityHeader}>
        <div>
          <h4 style={activityHeading}>
            {labels.recentActivity}
          </h4>

          <p style={activitySummary}>
            {labels.activitySummary}
          </p>
        </div>

        <span style={count}>
          {marketExplorerActivity.length}
        </span>
      </div>

      {marketExplorerActivity.length === 0 ? (
        <div style={emptyState}>
          <Compass
            size={35}
            strokeWidth={0.75}
            color="#C7A44B"
          />

          <p style={emptyText}>
            {labels.empty}
          </p>

          <Link
            href={marketExplorerHref}
            style={emptyLink}
          >
            {labels.launch}
          </Link>
        </div>
      ) : (
        <div style={activityGrid}>
          {marketExplorerActivity.map(
            activity => (
              <Link
                key={activity.id}
                href={activity.href}
                style={activityCard}
              >
                <div style={activityContent}>
                  <h5 style={activityTitle}>
                    {activity.title}
                  </h5>

                  <div style={activityMarket}>
                    {activity.market}
                  </div>

                  <p style={activityDescription}>
                    {activity.summary}
                  </p>

                  <div style={activityUpdated}>
                    {activity.updatedAt}
                  </div>
                </div>

                <ArrowRight
                  size={19}
                  strokeWidth={1}
                  color="#C7A44B"
                />
              </Link>
            )
          )}
        </div>
      )}

      <EnginePackage
        title={
          labels.valuationAndPricing
        }
        description={
          labels.valuationAndPricingDescription
        }
        engines={
          valuationAndPricingEngines
        }
        engineConfigurations={
          engineConfigurations
        }
        labels={labels}
        savedAnalyses={savedAnalyses}
      />

      <EnginePackage
        title={
          labels.marketAnalysis
        }
        description={
          labels.marketAnalysisDescription
        }
        engines={
          marketAnalysisEngines
        }
        engineConfigurations={
          engineConfigurations
        }
        labels={labels}
        savedAnalyses={savedAnalyses}
      />

      <EnginePackage
        title={
          labels.marketIntelligence
        }
        description={
          labels.marketIntelligenceDescription
        }
        engines={
          marketIntelligenceEngines
        }
        engineConfigurations={
          engineConfigurations
        }
        labels={labels}
        savedAnalyses={savedAnalyses}
      />

      <EnginePackage
            title={labels.marketBehavior}
            description={labels.marketBehaviorDescription}
            engines={marketBehaviorEngines}
            engineConfigurations={engineConfigurations}
            labels={labels}
            savedAnalyses={savedAnalyses}
            />

    </section>
  )
}

type EnginePackageProps = {
  title: string
  description: string
  engines: MarketIntelligenceEngine[]
  engineConfigurations: EngineConfigurationMap
  labels: EngineLabels
  savedAnalyses: any[]
}

function EnginePackage({
  title,
  description,
  engines,
  engineConfigurations,
  labels,
  savedAnalyses
}: EnginePackageProps) {

  return (
    <>
      <div style={divider} />

      <div style={phaseHeading}>
        <h3 style={phaseTitle}>
          {title}
        </h3>

        <p style={phaseDescription}>
          {description}
        </p>
      </div>

      <div style={phaseGrid}>
        {engines.map(engine => {
          const config =
            engineConfigurations[engine.id]

          const savedAnalysisCount =
            savedAnalyses.filter(
              analysis =>
                analysis.engine_type ===
                engine.id
            ).length

          const Icon =
            config.icon

          return (
            <Link
              key={engine.id}
              href={config.href}
              style={{
                ...engineCard,
                opacity:
                  engine.unlocked
                    ? 1
                    : 0.65
              }}
            >
              <div style={engineCardTop}>
                <div style={engineCardIcon}>
                  <Icon
                    size={26}
                    strokeWidth={1}
                    color="#C7A44B"
                  />
                </div>

                {!engine.unlocked && (
                  <LockKeyhole
                    size={18}
                    strokeWidth={1}
                    color="#999"
                  />
                )}
              </div>

              <h4 style={engineCardTitle}>
                {config.name}
              </h4>

              <p style={engineCardDescription}>
                {config.description}
              </p>

              <div style={engineMetrics}>
                <div style={metric}>
                  <strong>
                    {savedAnalysisCount}
                  </strong>

                  <span>
                    {labels.savedAnalyses}
                  </span>
                </div>

                <div style={metric}>
                  <strong>
                    {engine.savedSearchCount}
                  </strong>

                  <span>
                    {labels.savedSearches}
                  </span>
                </div>

                <div style={metric}>
                  <strong>
                    {engine.historyCount}
                  </strong>

                  <span>
                    {labels.history}
                  </span>
                </div>
              </div>

              <div style={engineFooter}>
                <span
                  style={{
                    ...statusBadge,
                    background:
                      engine.unlocked
                        ? '#1b4727'
                        : '#303030'
                  }}
                >
                  {engine.unlocked
                    ? labels.unlocked
                    : labels.locked}
                </span>

                <span style={launchLink}>
                  {engine.unlocked
                    ? labels.launchEngine
                    : labels.unlockEngine}

                  <ArrowRight
                    size={16}
                    strokeWidth={1}
                  />
                </span>
              </div>
            </Link>
          )
        })}
      </div>
    </>
  )
}

function Statistic({
  icon,
  value,
  label
}: {
  icon: ReactNode
  value: number
  label: string
}) {
  return (
    <div style={statistic}>
      <div style={statisticIcon}>
        {icon}
      </div>

      <div>
        <div style={statisticValue}>
          {value}
        </div>

        <div style={statisticLabel}>
          {label}
        </div>
      </div>
    </div>
  )
}
const section = {
  padding: '1.5rem',
  background: '#151515',
  border: '1px solid #303030',
  borderRadius: '18px'
}

const titleRow = {
  display: 'flex',
  alignItems: 'center',
  gap: '.65rem'
}

const heading = {
  margin: 0,
  color: '#fff',
  fontSize: '1.75rem',
  lineHeight: 1.2
}

const purpose = {
  maxWidth: '700px',
  margin: '.6rem 0 0',
  color: '#aaa',
  fontSize: '.92rem',
  lineHeight: 1.5
}

const divider = {
  height: '1px',
  margin: '1.5rem 0',
  background: '#303030'
}

const engineHeader = {
  display: 'flex',
  flexWrap: 'wrap' as const,
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '1rem'
}

const engineIdentity = {
  display: 'grid',
  gridTemplateColumns:
    'auto minmax(0, 1fr)',
  alignItems: 'center',
  gap: '.9rem'
}

const engineIcon = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '3.5rem',
  height: '3.5rem',
  background: '#1b1b1b',
  border: '1px solid #303030',
  borderRadius: '999px'
}

const engineName = {
  margin: 0,
  color: '#fff',
  fontSize: '1.2rem',
  lineHeight: 1.3
}

const engineDescription = {
  maxWidth: '650px',
  margin: '.35rem 0 0',
  color: '#929292',
  fontSize: '.86rem',
  lineHeight: 1.5
}

const launchButton = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '.5rem',
  padding: '.75rem 1rem',
  color: '#C7A44B',
  background: '#1d1d1d',
  border: '1px solid #C7A44B',
  borderRadius: '10px',
  textDecoration: 'none',
  fontWeight: 600
}

const statusPanel = {
  marginTop: '1.5rem',
  padding: '1.15rem',
  background: '#191919',
  border: '1px solid #303030',
  borderRadius: '14px'
}

const statusHeadingRow = {
  display: 'flex',
  flexWrap: 'wrap' as const,
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: '1rem'
}

const statusLabel = {
  color: '#777',
  fontSize: '.76rem',
  fontWeight: 600,
  letterSpacing: '.05em',
  textTransform: 'uppercase' as const
}

const activeStatus = {
  display: 'flex',
  alignItems: 'center',
  gap: '.45rem',
  marginTop: '.35rem',
  color: '#fff',
  fontSize: '.92rem',
  fontWeight: 600
}

const activeDot = {
  display: 'block',
  width: '.55rem',
  height: '.55rem',
  background: '#59c173',
  borderRadius: '999px'
}

const updatedText = {
  color: '#777',
  fontSize: '.78rem'
}

const statisticsGrid = {
  display: 'grid',
  gridTemplateColumns:
    'repeat(auto-fit, minmax(150px, 1fr))',
  gap: '.75rem',
  marginTop: '1rem'
}

const statistic = {
  display: 'flex',
  alignItems: 'center',
  gap: '.7rem',
  padding: '.8rem',
  background: '#151515',
  border: '1px solid #292929',
  borderRadius: '11px'
}

const statisticIcon = {
  display: 'flex',
  color: '#C7A44B'
}

const statisticValue = {
  color: '#fff',
  fontSize: '1.2rem',
  fontWeight: 700,
  lineHeight: 1
}

const statisticLabel = {
  marginTop: '.3rem',
  color: '#888',
  fontSize: '.74rem'
}

const activityHeader = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: '1rem'
}

const activityHeading = {
  margin: 0,
  color: '#ff3b00',
  fontSize: '1rem'
}

const activitySummary = {
  margin: '.4rem 0 0',
  color: '#777',
  fontSize: '.84rem'
}

const count = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: '1.7rem',
  height: '1.7rem',
  padding: '0 .45rem',
  color: '#fff',
  background: '#292929',
  borderRadius: '999px',
  fontSize: '.78rem'
}

const emptyState = {
  display: 'grid',
  justifyItems: 'center',
  gap: '.8rem',
  marginTop: '1rem',
  padding: '1.75rem',
  textAlign: 'center' as const,
  background: '#191919',
  border: '1px dashed #3a3a3a',
  borderRadius: '14px'
}

const emptyText = {
  margin: 0,
  color: '#999'
}

const emptyLink = {
  color: '#C7A44B',
  textDecoration: 'none',
  fontWeight: 600
}

const activityGrid = {
  display: 'grid',
  gridTemplateColumns:
    'repeat(auto-fit, minmax(260px, 1fr))',
  gap: '1rem',
  marginTop: '1rem'
}

const activityCard = {
  display: 'grid',
  gridTemplateColumns:
    'minmax(0, 1fr) auto',
  alignItems: 'start',
  gap: '.8rem',
  padding: '1rem',
  color: '#fff',
  background: '#1b1b1b',
  border: '1px solid #303030',
  borderRadius: '14px',
  textDecoration: 'none'
}

const activityContent = {
  minWidth: 0
}

const activityTitle = {
  margin: 0,
  color: '#fff',
  fontSize: '.98rem',
  lineHeight: 1.35
}

const activityMarket = {
  marginTop: '.3rem',
  color: '#C7A44B',
  fontSize: '.8rem',
  fontWeight: 600
}

const activityDescription = {
  margin: '.4rem 0 0',
  color: '#999',
  fontSize: '.8rem',
  lineHeight: 1.45
}

const activityUpdated = {
  marginTop: '.4rem',
  color: '#707070',
  fontSize: '.74rem'
}

const phaseHeading = {
  marginTop: '.5rem'
}

const phaseTitle = {
  margin: 0,
  color: '#fff',
  fontSize: '1.2rem'
}

const phaseDescription = {
  margin: '.45rem 0 0',
  color: '#888',
  fontSize: '.86rem',
  lineHeight: 1.5
}

const phaseGrid = {
  display: 'grid',
  gridTemplateColumns:
    'repeat(auto-fit, minmax(320px, 1fr))',
  gap: '1rem',
  marginTop: '1.25rem'
}

const engineCard = {
  display: 'flex',
  flexDirection: 'column' as const,
  gap: '.9rem',
  padding: '1.25rem',
  color: '#fff',
  background: '#181818',
  border: '1px solid #303030',
  borderRadius: '14px',
  textDecoration: 'none'
}

const engineCardTop = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center'
}

const engineCardIcon = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '3rem',
  height: '3rem',
  background: '#202020',
  borderRadius: '999px'
}

const engineCardTitle = {
  margin: 0,
  color: '#fff',
  fontSize: '1.05rem'
}

const engineCardDescription = {
  margin: 0,
  color: '#999',
  fontSize: '.84rem',
  lineHeight: 1.55
}

const engineMetrics = {
  display: 'grid',
  gridTemplateColumns:
    'repeat(3, minmax(0, 1fr))',
  gap: '.5rem'
}

const metric = {
  display: 'flex',
  flexDirection: 'column' as const,
  gap: '.25rem',
  padding: '.65rem',
  background: '#141414',
  border: '1px solid #2b2b2b',
  borderRadius: '10px',
  textAlign: 'center' as const
}

const engineFooter = {
  display: 'flex',
  flexWrap: 'wrap' as const,
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '.75rem',
  marginTop: 'auto'
}

const statusBadge = {
  padding: '.35rem .7rem',
  borderRadius: '999px',
  fontSize: '.72rem',
  fontWeight: 600
}

const launchLink = {
  display: 'flex',
  alignItems: 'center',
  gap: '.35rem',
  color: '#C7A44B',
  fontWeight: 600,
  fontSize: '.85rem'
}