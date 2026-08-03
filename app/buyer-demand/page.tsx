import MarketFilters from '@/app/components/MarketFilters'
import BuyerDemandResults from './BuyerDemandResults'

import { getExplorerOptions } from '@/lib/explorer-options-engine'
import { getBuyerDemand } from '@/lib/buyer-demand-engine'

import AnalysisActions from '@/app/components/AnalysisActions'

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

export default async function BuyerDemandPage({
  searchParams
}: PageProps) {
  const filters = await searchParams

  const options =
    await getExplorerOptions()

  const demand =
    await getBuyerDemand(filters, 'en')

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
        Buyer Demand
      </h1>

      <p
        style={{
          color: '#888',
          marginBottom: '2rem',
          fontSize: '1.1rem'
        }}
      >
        Discover which property characteristics are consistently
        associated with higher market prices. Analyze measurable
        demand for environments, utilities, terrain,
        accessibility, legal status, and other features across
        Costa Rica.
      </p>

      <MarketFilters
        options={options}
        filters={filters}
        basePath="/buyer-demand"
      />

        <AnalysisActions
          engineType="buyer-demand"
          language="en"
          filters={filters}
          result={demand}
          defaultName="Buyer Demand"
        />

      <BuyerDemandResults
        filters={filters}
        demand={demand}
      />
    </main>
  )
}