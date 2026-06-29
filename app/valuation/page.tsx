
import ValuationResults from './ValuationResults'
import { getValuation } from '@/lib/valuation-engine'
import MarketFilters from '@/app/components/MarketFilters'
import { getExplorerOptions } from '@/lib/explorer-options-engine'

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

export default async function ValuationPage({
  searchParams
}: PageProps) {
  const filters = await searchParams
  const options = await getExplorerOptions()
  const valuation = await getValuation(filters, 'en')

  return (
    <main
      style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '2rem'
      }}
    >
      <h1 style={{ fontSize: '3rem', marginBottom: '.5rem' }}>
        Costa Rica Property Valuation
      </h1>

      <p style={{ color: '#888', marginBottom: '2rem', fontSize: '1.1rem' }}>
        Estimate market value using comparable listings, market
        statistics, and the Twuanis Real Estate Knowledge Graph.
      </p>

        <MarketFilters
            options={options}
            filters={filters}
            basePath="/valuation"
            />

      <ValuationResults
        filters={filters}
        valuation={valuation}
      />
    </main>
  )
}