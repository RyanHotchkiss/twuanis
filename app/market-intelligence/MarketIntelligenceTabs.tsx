'use client'

import Link from 'next/link'
import ExploreResults from '@/app/explore/ExploreResults'
import PriceMeterResults from '@/app/price-per-square-meter/PriceMeterResults'
import PricingStrategyResults from '@/app/pricing-strategy/PricingStrategyResults'
import MarketScarcityResults from '@/app/market-scarcity/MarketScarcityResults'
import BuyerDemandResults from '@/app/buyer-demand/BuyerDemandResults'
import MarketMatchingResults from '@/app/market-matching/MarketMatchingResults'
import ValuationResults from '@/app/valuation/ValuationResults'
import MarketFilters from '@/app/components/MarketFilters'
import MarketComparisonResults from '@/app/market-comparison/MarketComparisonResults'
import {
  Compass,
  BadgeDollarSign,
  Target,
  HeartHandshake,
  Scale,
  Ruler,
  ChartColumnIncreasing,
  Flame
} from 'lucide-react'

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
}

const tabs = [
      {
        id: 'explorer',
        package: 'Free',
        color: '#2ecc71',
        icon: Compass,
        label: 'Market Explorer',
        description: 'Explore listings and market characteristics.'
      },

      {
        id: 'valuation',
        package: 'Market Valuator',
        color: '#0066cc',
        icon: BadgeDollarSign,
        label: 'Valuation',
        description: 'Estimate what a property is worth.'
      },

      {
        id: 'pricing',
        package: 'Market Valuator',
        color: '#0066cc',
        icon: Target,
        label: 'Pricing Strategy',
        description: 'Choose a competitive listing price.'
      },

      {
        id: 'matching',
        package: 'Market Valuator',
        color: '#0066cc',
        icon: HeartHandshake,
        label: 'Property Matching',
        description: 'Find better matching properties.'
      },

      {
        id: 'comparison',
        package: 'Market Analyzer',
        color: '#ff3b00',
        icon: Scale,
        label: 'Market Comparison',
        description: 'Compare two real estate markets.'
      },

      {
        id: 'price-meter',
        package: 'Market Analyzer',
        color: '#ff3b00',
        icon: Ruler,
        label: 'Price / m²',
        description: 'Analyze pricing efficiency.'
      },

      {
        id: 'scarcity',
        package: 'Market Analyzer',
        color: '#ff3b00',
        icon: ChartColumnIncreasing,
        label: 'Market Frequency',
        description: 'Measure rarity of property characteristics.'
      },

      {
        id: 'buyer-demand',
        package: 'Market Predictor',
        color: '#dc143c',
        icon: Flame,
        label: 'Buyer Demand',
        description: 'Coming in 2027',
        disabled: true
      }
    ]

export default function MarketIntelligenceTabs({
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
  comparison
}: Props) {

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

  return (
    <>
      <div style={tabBar}>

       {tabs.map(tab => {
            const Icon = tab.icon

            return (
              <Link
                key={tab.id}
                href={`/market-intelligence?${query.toString()}&tab=${tab.id}`}
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
                    marginBottom: '.6rem'
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
                    color: tab.color,
                    fontWeight: 700,
                    fontSize: '.75rem',
                    textTransform: 'uppercase',
                    letterSpacing: '.08em',
                    marginBottom: '.35rem'
                  }}
                >
                  {tab.package}
                </div>

                <div
                  style={{
                    color: '#fff',
                    fontSize: '1.15rem',
                    marginBottom: '.45rem'
                  }}
                >
                  {tab.label}
                </div>

                <div
                  style={{
                    color: '#9a9a9a',
                    fontSize: '.85rem',
                    lineHeight: 1.35
                  }}
                >
                  {tab.description}
                </div>
              </Link>
            )
          })}

      </div>

<section style={filterSection}>
        <h2 style={sectionTitle}>
          Market Filters
        </h2>

        <MarketFilters
          mode={
            activeTab === 'comparison'
              ? 'comparison'
              : 'single'
          }
          options={options}
          filters={filters}
          basePath={`/market-intelligence?tab=${activeTab}`}
        />
      </section>

      <div style={content}>

        {activeTab ===
          'explorer' && (
          explorerResult
            ? (
              <ExploreResults
                result={explorerResult}
              />
            )
            : (
              <EmptyState />
            )
        )}

        {activeTab ===
          'price-meter' && (
          <PriceMeterResults
            filters={filters}
            analysis={priceMeterAnalysis}
          />
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
      Select market filters to begin exploring.
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