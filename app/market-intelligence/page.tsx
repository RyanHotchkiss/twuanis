// /app/market-intelligence/page.tsx

import { getExplorerOptions } from '@/lib/explorer-options-engine'
import { exploreMarket } from '@/lib/explorer-engine'
import { getPriceMeterAnalysis } from '@/lib/price-meter-engine'
import { getPricingStrategy } from '@/lib/pricing-strategy-engine'
import { getMarketScarcity } from '@/lib/market-scarcity-engine'
import { getBuyerDemand } from '@/lib/buyer-demand-engine'
import { getMarketMatches } from '@/lib/market-matching-engine'
import { getValuation } from '@/lib/valuation-engine'

import TopBar from '@/app/components/TopBar'
import MarketIntelligenceTabs from './MarketIntelligenceTabs'

type PageProps = {
  searchParams: Promise<{
    transaction_type?: string
    province?: string
    canton?: string
    district?: string
    property_type?: string
    bedrooms?: string
    bathrooms?: string
    parking?: string
    year_built?: string
    property_area?: string
    construction_area?: string
    utility?: string
    environment?: string
    terrain?: string
    accessibility?: string
    legal_status?: string
    tab?: string
  }>
}

export default async function MarketIntelligencePage({
  searchParams
}: PageProps) {
  const params = await searchParams
  const options = await getExplorerOptions()

  const enginefilters = {
    transaction_type: params.transaction_type,
    province: params.province,
    canton: params.canton,
    district: params.district,
    property_type: params.property_type,
    bedrooms: params.bedrooms,
    bathrooms: params.bathrooms,
    parking: params.parking,
    year_built: params.year_built,
    property_area: params.property_area,
    construction_area: params.construction_area,
    utility: params.utility,
    environment: params.environment,
    terrain: params.terrain,
    accessibility: params.accessibility,
    legal_status: params.legal_status
  }

  function resolveFilterValue(
        value: string | undefined,
        options: any[] = []
        ) {
        if (!value) return undefined

        const match = options.find((option: any) =>
            option.slug === value ||
            option.slug_en === value ||
            option.slug_es === value ||
            option.term_name === value ||
            option.term_name_en === value ||
            option.term_name_es === value
        )

        return match?.term_name || value
        }

const engineFilters = {
            ...enginefilters,
            province: enginefilters.province,
            canton: enginefilters.canton,
            district: enginefilters.district,
            property_type: resolveFilterValue(enginefilters.property_type, options.property_type),
            bedrooms: resolveFilterValue(enginefilters.bedrooms, options.bedrooms),
            bathrooms: resolveFilterValue(enginefilters.bathrooms, options.bathrooms),
            parking: resolveFilterValue(enginefilters.parking, options.parking),
            year_built: resolveFilterValue(enginefilters.year_built, options.year_built),
            property_area: resolveFilterValue(enginefilters.property_area, options.property_area),
            construction_area: resolveFilterValue(enginefilters.construction_area, options.construction_area),
            utility: resolveFilterValue(enginefilters.utility, options.utility),
            environment: resolveFilterValue(enginefilters.environment, options.environment),
            terrain: resolveFilterValue(enginefilters.terrain, options.terrain),
            accessibility: resolveFilterValue(enginefilters.accessibility, options.accessibility),
            legal_status: resolveFilterValue(enginefilters.legal_status, options.legal_status)
            }

  const hasFilters =
        Object.values(engineFilters).some(Boolean)

        const explorerResult =
        hasFilters
            ? await exploreMarket(engineFilters)
            : null

        const priceMeterAnalysis =
        await getPriceMeterAnalysis(engineFilters, 'en')

        const pricingStrategy =
        await getPricingStrategy(engineFilters, 'en')

        const marketScarcity =
        await getMarketScarcity(engineFilters, 'en')

        const marketMatches =
        await getMarketMatches(engineFilters, 'en')

        const valuation =
        await getValuation(engineFilters, 'en')

        const buyerDemand =
        await getBuyerDemand(engineFilters, 'en')

console.log('ENGINE FILTERS:', engineFilters)

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
        activeTab={params.tab || 'explorer'}
        options={options}
        filters={enginefilters}
        explorerResult={explorerResult}
        priceMeterAnalysis={priceMeterAnalysis}
        pricingStrategy={pricingStrategy}
        marketScarcity={marketScarcity}
        marketMatches={marketMatches}
        valuation={valuation}
        buyerDemand={buyerDemand}
      />
    </main>
  )
}

const main = {
  minHeight: '100vh',
  padding: '2rem',
  background: '#0a0a0a',
  color: '#ededed'
}

const hero = {
  textAlign: 'center' as const,
  marginBottom: '2rem'
}

const heading = {
  fontSize: '3rem',
  marginBottom: '.75rem'
}

const intro = {
  maxWidth: '850px',
  margin: '0 auto',
  color: '#ccc',
  lineHeight: 1.6,
  fontSize: '1.05rem'
}