import TopBar
  from '@/app/components/TopBar'

import PestanasInteligenciaMercado
  from './PestanasInteligenciaMercado'

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
                page: '/es/inteligencia-de-mercado',
              })
            )
          }
          // TEMP PPM2 TRACE END

  const workspace =
    await resolveMarketIntelligenceWorkspace({
      params,
      language:
        'es'
    })


  return (
    <main style={main}>
      <TopBar />


      <section style={hero}>
        <h1 style={heading}>
          Inteligencia de Mercado
        </h1>

        <p style={intro}>
          Explore el mercado inmobiliario de Costa Rica a través de múltiples perspectivas analíticas.
          Primero elija la pregunta del mercado; después filtre el mercado.
        </p>
      </section>


      <PestanasInteligenciaMercado
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