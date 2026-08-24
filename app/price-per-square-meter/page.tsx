import MarketFilters from '@/app/components/MarketFilters'
import PriceMeterResults from './PriceMeterResults'
import { getExplorerOptions } from '@/lib/explorer-options-engine'
import { getPriceMeterAnalysis } from '@/lib/price-meter-engine'

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

export default async function PricePerSquareMeterPage({
  searchParams
}: PageProps) {
  const filters = await searchParams
  const options = await getExplorerOptions()

  const hasTransactionType =
    filters.transaction_type === 'sale' ||
    filters.transaction_type === 'rent'

  const analysis =
    hasTransactionType
      ? await getPriceMeterAnalysis(
          filters,
          'en'
        )
      : null

  return (
    <main
      style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '2rem'
      }}
    >
      <h1 style={{ fontSize: '3rem', marginBottom: '.5rem' }}>
        Price per Square Meter
      </h1>

      <p style={{ color: '#888', marginBottom: '2rem', fontSize: '1.1rem' }}>
        Analyze how total listing price relates to land area and construction
        area across Costa Rica real estate markets.
      </p>

      <MarketFilters
        options={options}
        filters={filters}
        basePath="/price-per-square-meter"
      />

      {analysis && (
        <>
          <AnalysisActions
            engineType="price-meter"
            language="en"
            filters={filters}
            result={analysis}
            defaultName="Price per Square Meter"
          />

          <PriceMeterResults
            filters={filters}
            analysis={analysis}
          />
        </>
      )}
    </main>
  )
}