import MarketFilters from '@/app/components/MarketFilters'
import MarketScarcityResults from './MarketScarcityResults'

import { getExplorerOptions } from '@/lib/explorer-options-engine'
import { getMarketScarcity } from '@/lib/market-scarcity-engine'

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
  }>
}

export default async function MarketScarcityPage({
  searchParams
}: PageProps) {
  const filters = await searchParams

  const options =
    await getExplorerOptions()

  const scarcity =
    await getMarketScarcity(filters, 'en')

  return (
    <main
      style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '2rem'
      }}
    >
      <h1
        style={{
          fontSize: '3rem',
          marginBottom: '.5rem'
        }}
      >
        Market Scarcity
      </h1>

      <p
        style={{
          color: '#888',
          marginBottom: '2rem',
          fontSize: '1.1rem'
        }}
      >
        Identify property combinations that are difficult to find.
        Measure scarcity across location, property type, environment,
        utilities, terrain, accessibility, legal status, and other
        market characteristics.
      </p>

      <MarketFilters
        options={options}
        filters={filters}
        basePath="/market-scarcity"
      />

      <MarketScarcityResults
        filters={filters}
        scarcity={scarcity}
      />
    </main>
  )
}