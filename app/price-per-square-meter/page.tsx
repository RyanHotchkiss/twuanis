import MarketFilters from '@/app/components/MarketFilters'
import PriceMeterResults from './PriceMeterResults'
import { getExplorerOptions } from '@/lib/explorer-options-engine'
import { getPriceMeterAnalysis } from '@/lib/price-meter-engine'
import AnalysisActions from '@/app/components/AnalysisActions'
import PriceMeterComparisonFilters from '@/app/components/price-meter-comparison/PriceMeterComparisonFilters'
import {
  parsePriceMeterComparisonRequest
} from '@/lib/price-meter-comparison-request-parser'
import {
  getPriceMeterComparisonAnalysis
} from '@/lib/price-meter-comparison-engine'
import PriceMeterComparisonResults from './PriceMeterComparisonResults'
import Link from 'next/link'


type PageProps = {
  searchParams: Promise<{
    mode?: string
    property_basis?: string
    normalization_basis?: string
    reference_cohort?: string

    a_province?: string
    a_canton?: string
    a_district?: string
    a_property_type?: string
    a_characteristic_1_type?: string
    a_characteristic_1?: string
    a_characteristic_2_type?: string
    a_characteristic_2?: string
    a_property_area?: string
    a_construction_area?: string
    a_construction_land_cohort?: string

    b_province?: string
    b_canton?: string
    b_district?: string
    b_property_type?: string
    b_characteristic_1_type?: string
    b_characteristic_1?: string
    b_characteristic_2_type?: string
    b_characteristic_2?: string
    b_property_area?: string
    b_construction_area?: string
    b_construction_land_cohort?: string
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

function hasCompleteComparisonRequest(
  filters: Record<
    string,
    string | undefined
  >
) {
  const hasSharedIdentity =
    Boolean(
      filters.transaction_type &&
      filters.property_basis &&
      filters.normalization_basis &&
      filters.reference_cohort
    )

  const hasCohortA =
    Boolean(
      filters.a_province &&
      filters.a_property_type &&
      filters.a_characteristic_1_type &&
      filters.a_characteristic_1 &&
      filters.a_characteristic_2_type &&
      filters.a_characteristic_2 &&
      (
        filters.a_property_area ||
        filters.a_construction_area
      )
    )

  const hasCohortB =
    Boolean(
      filters.b_province &&
      filters.b_property_type &&
      filters.b_characteristic_1_type &&
      filters.b_characteristic_1 &&
      filters.b_characteristic_2_type &&
      filters.b_characteristic_2 &&
      (
        filters.b_property_area ||
        filters.b_construction_area
      )
    )

  return (
    hasSharedIdentity &&
    hasCohortA &&
    hasCohortB
  )
}

export default async function PricePerSquareMeterPage({
  searchParams
}: PageProps) {
  const filters = await searchParams
  const options = await getExplorerOptions()

  const isComparisonMode =
  filters.mode === 'comparison'

  const comparisonRequestComplete =
  isComparisonMode &&
  hasCompleteComparisonRequest(
    filters
  )

  const comparisonRequest =
  comparisonRequestComplete
    ? parsePriceMeterComparisonRequest({
        params:
          filters,
        options
      })
    : null

  const comparisonAnalysis =
  comparisonRequest
    ? await getPriceMeterComparisonAnalysis({
        request:
          comparisonRequest,
        language:
          'en'
      })
    : null

  const hasTransactionType =
    filters.transaction_type === 'sale' ||
    filters.transaction_type === 'rent'

  const analysis =
    !isComparisonMode &&
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
      <div
        style={{
          display: 'flex',
          gap: '.75rem',
          marginBottom: '2rem',
          flexWrap: 'wrap'
        }}
      >
        <Link
          href="/price-per-square-meter"
          style={{
            padding: '.75rem 1rem',
            borderRadius: '.75rem',
            border: '1px solid #333',
            background:
              !isComparisonMode
                ? '#222'
                : '#111',
            color: '#fff',
            textDecoration: 'none',
            fontWeight: 700
          }}
        >
          Market Intelligence
        </Link>

        <Link
          href="/price-per-square-meter?mode=comparison"
          style={{
            padding: '.75rem 1rem',
            borderRadius: '.75rem',
            border: '1px solid #333',
            background:
              isComparisonMode
                ? '#222'
                : '#111',
            color: '#fff',
            textDecoration: 'none',
            fontWeight: 700
          }}
        >
          Characteristic Comparison
        </Link>
      </div>

    {isComparisonMode ? (
      <PriceMeterComparisonFilters
        options={options}
        filters={filters}
        basePath="/price-per-square-meter"
        language="en"
      />
    ) : (
      <MarketFilters
        options={options}
        filters={filters}
        basePath="/price-per-square-meter"
      />
    )}

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

      {comparisonAnalysis && (
        <PriceMeterComparisonResults
          analysis={comparisonAnalysis}
        />
      )}

    </main>
  )
}