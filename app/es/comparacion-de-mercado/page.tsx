import MarketComparisonFilters from '@/app/components/MarketComparisonFilters'
import MarketComparisonResults from '@/app/market-comparison/MarketComparisonResults'

import { getExplorerOptions } from '@/lib/explorer-options-engine'
import { getMarketComparison } from '@/lib/market-comparison-engine'

type PageProps = {
  searchParams: Promise<Record<string, string | undefined>>
}

export default async function ComparacionDeMercadoPage({
  searchParams
}: PageProps) {
  const params = await searchParams

  const options =
    await getExplorerOptions()

  const leftFilters = {
    a_province: params.a_province,
    a_canton: params.a_canton,
    a_district: params.a_district,
    a_property_type: params.a_property_type,
    a_bedrooms: params.a_bedrooms,
    a_bathrooms: params.a_bathrooms,
    a_parking: params.a_parking,
    a_price_range: params.a_price_range,
    a_property_area: params.a_property_area,
    a_construction_area: params.a_construction_area,
    a_year_built: params.a_year_built,
    a_environment: params.a_environment,
    a_terrain: params.a_terrain,
    a_utility: params.a_utility,
    a_accessibility: params.a_accessibility,
    a_legal_status: params.a_legal_status
  }

  const rightFilters = {
    b_province: params.b_province,
    b_canton: params.b_canton,
    b_district: params.b_district,
    b_property_type: params.b_property_type,
    b_bedrooms: params.b_bedrooms,
    b_bathrooms: params.b_bathrooms,
    b_parking: params.b_parking,
    b_price_range: params.b_price_range,
    b_property_area: params.b_property_area,
    b_construction_area: params.b_construction_area,
    b_year_built: params.b_year_built,
    b_environment: params.b_environment,
    b_terrain: params.b_terrain,
    b_utility: params.b_utility,
    b_accessibility: params.b_accessibility,
    b_legal_status: params.b_legal_status
  }

  const comparison =
    await getMarketComparison(leftFilters, rightFilters, 'es')

  return (
    <main
      style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '2rem'
      }}
    >
      <h1 style={{ fontSize: '3rem', marginBottom: '.5rem' }}>
        Comparación de Mercado
      </h1>

      <p style={{ color: '#888', marginBottom: '2rem', fontSize: '1.1rem' }}>
        Compare dos mercados inmobiliarios lado a lado utilizando ubicación,
        propiedad, precio, tamaño y atributos estructurados del grafo de
        conocimiento.
      </p>

      <MarketComparisonFilters
        language="es"
        options={options}
        leftFilters={leftFilters}
        rightFilters={rightFilters}
      />

      <MarketComparisonResults
        comparison={comparison}
      />
    </main>
  )
}