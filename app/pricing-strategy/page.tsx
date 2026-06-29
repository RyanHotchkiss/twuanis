import MarketFilters from '@/app/components/MarketFilters'
import PricingStrategyResults from './PricingStrategyResults'

import { getExplorerOptions } from '@/lib/explorer-options-engine'
import { getPricingStrategy } from '@/lib/pricing-strategy-engine'

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

export default async function PricingStrategyPage({
  searchParams
}: PageProps) {

  const filters = await searchParams

  const options =
    await getExplorerOptions()

  const strategy =
    await getPricingStrategy(filters, 'en')

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
        Pricing Strategy
      </h1>

      <p
        style={{
          color: '#888',
          marginBottom: '2rem',
          fontSize: '1.1rem'
        }}
      >
        Determine the most effective asking price using
        comparable listings, market statistics, and current
        inventory conditions across Costa Rica.
      </p>

      <MarketFilters
        options={options}
        filters={filters}
        basePath="/pricing-strategy"
      />

      <PricingStrategyResults
        filters={filters}
        strategy={strategy}
      />
    </main>
  )
}