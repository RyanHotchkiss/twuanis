import { readAskingPriceCatalog } from '@/lib/asking-price-data'
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

// TEMP PPM2 TRACE BEGIN
if (typeof params.__ppm2trace === 'string') {
  console.info(
    '[PPM2 TRACE]',
    JSON.stringify({
      stage: 'page',
      traceId: params.__ppm2trace,
      eventId: crypto.randomUUID(),
      page: '/en/market-intelligence',
    })
  )
}
// TEMP PPM2 TRACE END

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


      </section>


      <MarketIntelligenceTabs
        askingPriceCatalog={workspace.activeTab==='asking-price'?await readAskingPriceCatalog():undefined}
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
     'clamp(1rem, 3vw, 2rem)',

  backgroundColor:
    'var(--background)',

  backgroundImage:
    'var(--ih-background-image)',

  backgroundSize:
    'cover',

  backgroundPosition:
    'center top',

  backgroundRepeat:
    'no-repeat',

  backgroundAttachment:
    'fixed',

  color:
    'var(--foreground)'
}


const hero = {
  textAlign:
    'center' as const,

  marginBottom:
    '2rem'
}


const heading = {
  fontSize:
    'clamp(1.6rem, 4vw, 3rem)',

  marginBottom:
    '.75rem'
}


const intro = {
  maxWidth:
    '850px',

  margin:
    '0 auto',

  color:
    'var(--muted)',

  lineHeight:
    1.6,

  fontSize:
    '1.05rem'
}