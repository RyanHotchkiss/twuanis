import TopBar
  from '@/app/components/TopBar'

import MarketIntelligenceTabs
  from './MarketIntelligenceTabs'

import {
  resolveMarketIntelligenceWorkspace,
  type MarketIntelligenceSearchParams
} from '@/lib/market-intelligence-workspace'


type PageProps = {
  searchParams:
    Promise<
      MarketIntelligenceSearchParams
    >
}


export default async function MarketIntelligencePage({
  searchParams
}: PageProps) {

  const params =
    await searchParams


  const workspace =
    await resolveMarketIntelligenceWorkspace({
      params,
      language:
        'en'
    })


  return (
    <main style={main}>
      <TopBar />


      <section style={hero}>
        <h1 style={heading}>
          Market Intelligence
        </h1>

        <p style={intro}>
          Explore Costa Rica real estate through multiple analytical lenses.
          Choose the market question first, then filter the market.
        </p>
      </section>


      <MarketIntelligenceTabs
        activeTab={
          workspace.activeTab
        }

        options={
          workspace.options
        }

        filters={
          workspace.filters
        }

        explorerResult={
          workspace.explorerResult
        }

        priceMeterAnalysis={
          workspace.priceMeterAnalysis
        }

        pricingStrategy={
          workspace.pricingStrategy
        }

        marketScarcity={
          workspace.marketScarcity
        }

        marketMatches={
          workspace.marketMatches
        }

        valuation={
          workspace.valuation
        }

        buyerDemand={
          workspace.buyerDemand
        }

        comparison={
          workspace.comparison
        }
      />
    </main>
  )
}


const main = {
  minHeight:
    '100vh',

  padding:
    '2rem',

  background:
    '#0a0a0a',

  color:
    '#ededed'
}


const hero = {
  textAlign:
    'center' as const,

  marginBottom:
    '2rem'
}


const heading = {
  fontSize:
    '3rem',

  marginBottom:
    '.75rem'
}


const intro = {
  maxWidth:
    '850px',

  margin:
    '0 auto',

  color:
    '#ccc',

  lineHeight:
    1.6,

  fontSize:
    '1.05rem'
}