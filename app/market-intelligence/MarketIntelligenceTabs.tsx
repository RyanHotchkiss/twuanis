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
  options: any
}

const tabs = [
  { id: 'explorer', label: 'Market Explorer' },
  { id: 'price-meter', label: 'Price / m²' },
  { id: 'pricing', label: 'Pricing Strategy' },
  { id: 'scarcity', label: 'Market Scarcity' },
  { id: 'matching', label: 'Property Matching' },
  { id: 'valuation', label: 'Valuation' },
  { id: 'comparison', label: 'Market Comparison' },
  { id: 'buyer-demand', label: ( <>
              <div>Buyer Demand</div>
              <div
                style={{
                  fontSize: '.65rem',
                  color: '#88888850',
                  marginTop: '.15rem',
                  textAlign: 'center',
                  fontWeight: 400
                }}
              >
                Coming in 2027
              </div>
            </>
          )
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
  valuation 
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

        {tabs.map(tab => (
          <Link
            key={tab.id}
            href={`/market-intelligence?${query.toString()}&tab=${tab.id}`}
            style={{
              ...tabButton,
              ...(activeTab === tab.id
                ? activeTabStyle
                : {})
            }}
          >
            {tab.label}
          </Link>
        ))}

      </div>

<section style={filterSection}>
        <h2 style={sectionTitle}>
          Market Filters
        </h2>

        <MarketFilters
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
  display: 'flex',
  gap: '.75rem',
  flexWrap: 'wrap' as const,
  marginTop: '2rem',
  marginBottom: '2rem'
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