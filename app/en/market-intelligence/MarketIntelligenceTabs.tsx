'use client'

import Link from 'next/link'
import { useState } from 'react'
import {
  saveAnalysis,
  SavedAnalysisEngine
} from '@/lib/saved-analyses'
import {
  createMarketComparisonName,
  saveMarketComparison
} from '@/lib/market-comparisons'
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
  Construction
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
        package: 'Market Discovery Package (Free)',
        color: '#2ecc71',
        icon: Compass,
        label: 'Market Explorer',
        description: 'Explore listings and market characteristics.'
      },

      {
        id: 'valuation',
        package: 'Valuation & Pricing Package',
        color: '#0066cc',
        icon: BadgeDollarSign,
        label: 'Valuation',
        description: 'Estimate what a property is worth.'
      },

      {
        id: 'pricing',
        package: 'Valuation & Pricing Package',
        color: '#0066cc',
        icon: Target,
        label: 'Pricing Strategy',
        description: 'Choose a competitive listing price.'
      },

      {
        id: 'matching',
        package: 'Valuation & Pricing Package',
        color: '#0066cc',
        icon: HeartHandshake,
        label: 'Property Matching',
        description: 'Find better matching properties.'
      },

      {
        id: 'comparison',
        package: 'Market Analysis Package',
        color: '#ff3b00',
        icon: Scale,
        label: 'Market Comparison',
        description: 'Compare two real estate markets.'
      },

      {
        id: 'scarcity',
        package: 'Market Analysis Package',
        color: '#ff3b00',
        icon: ChartColumnIncreasing,
        label: 'Market Frequency',
        description: 'Measure how common or uncommon property characteristics are.'
      },

       {
        id: 'price-meter',
        package: 'Pricing Intelligence Package',
        color: '#ffd700',
        icon: Ruler,
        label: 'Price / m² Intelligence',
        description: 'Analyze pricing efficiency across markets.'
      },

      {
        id: 'buyer-demand',
        package: 'Market Behavior & Dynamics Package',
        color: '#dc143c',
        icon: Construction,
        label: 'Buyer Demand',
        description: 'Future Engine',
        disabled: true
      },

      {
        id: 'market-velocity',
        package: 'Market Behavior & Dynamics Package',
        color: '#dc143c',
        icon: Construction,
        label: 'Market Velocity',
        description: 'Future Engine',
        disabled: true
      },

      {
        id: 'price-dynamics',
        package: 'Market Behavior & Dynamics Package',
        color: '#dc143c',
        icon: Construction,
        label: 'Price Dynamics',
        description: 'Future Engine',
        disabled: true
      },

      {
        id: 'listing-lifecycle',
        package: 'Market Behavior & Dynamics Package',
        color: '#dc143c',
        icon: Construction,
        label: 'Listing Lifecycle',
        description: 'Future Engine',
        disabled: true
      },

      {
        id: 'seller-behavior',
        package: 'Market Behavior & Dynamics Package',
        color: '#dc143c',
        icon: Construction,
        label: 'Seller Behavior',
        description: 'Future Engine',
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

                            const [
                saveStatus,
                setSaveStatus
              ] = useState<
                'idle' |
                'saving' |
                'saved' |
                'error'
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
                  ? `${tab?.label || 'Market Analysis'} · ${location}`
                  : tab?.label || 'Market Analysis'
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
                            language: 'en'
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
                          'en',
                        name:
                          getAnalysisName(),
                        filters,
                        result
                      })
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
                      'SAVE ANALYSIS ERROR:',
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

              return (
                <>
                  <div style={tabBar}>

                  {tabs.map(tab => {
                        const Icon = tab.icon

                        return (
              <Link
                key={tab.id}
                href={`/en/market-intelligence?${query.toString()}&tab=${tab.id}`}
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

<section style={filterSection}>
        <h2 style={sectionTitle}>
          Market Filters
        </h2>

        <MarketFilters
          language="en"
          mode={
            activeTab === 'comparison'
              ? 'comparison'
              : 'single'
          }
          options={options}
          filters={filters}
          basePath={`/en/market-intelligence?tab=${activeTab}`}
        />
      </section>

           <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          marginBottom: '1rem'
        }}
      >
        <button
          type="button"
          onClick={handleSaveAnalysis}
          disabled={
            saveStatus === 'saving' ||
            !getActiveResult()
          }
          style={{
            background:
              saveStatus === 'saved'
                ? '#D4AF37'
                : '#fff',
            border: '1px solid #fff',
            color: '#000',
            padding: '12px 20px',
            borderRadius: '999px',
            cursor:
              saveStatus === 'saving'
                ? 'wait'
                : 'pointer',
            fontWeight: 'bold',
            opacity:
              !getActiveResult()
                ? .45
                : 1
          }}
        >
          {saveStatus === 'saving'
                ? 'Saving...'
                : saveStatus === 'saved'
                ? (
                    activeTab ===
                      'comparison'
                      ? 'Comparison Saved'
                      : 'Analysis Saved'
                  )
                : saveStatus === 'error'
                ? 'Unable to Save'
                : (
                    activeTab ===
                      'comparison'
                      ? 'Save Comparison'
                      : 'Save Analysis'
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