import MarketFilters from '@/app/components/MarketFilters'
import MarketMatchingResults from './MarketMatchingResults'

import { getExplorerOptions } from '@/lib/explorer-options-engine'
import { getMarketMatches } from '@/lib/market-matching-engine'

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

export default async function MarketMatchingPage({
  searchParams
}: PageProps) {
  const filters = await searchParams

  const options =
    await getExplorerOptions()

  const matches =
    await getMarketMatches(filters, 'en')

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
        Market Matching
      </h1>

      <p
        style={{
          color: '#888',
          marginBottom: '2rem',
          fontSize: '1.1rem'
        }}
      >
        Find the closest available properties based on the features,
        location, and market characteristics that matter most to you.
      </p>

      <MarketFilters
        options={options}
        filters={filters}
        basePath="/market-matching"
      />

      <MarketMatchingResults
        filters={filters}
        matches={matches}
      />
    </main>
  )
}