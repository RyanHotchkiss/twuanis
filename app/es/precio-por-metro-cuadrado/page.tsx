import PriceMeterApplyPanel from '@/app/components/PriceMeterApplyPanel'
import { getExplorerOptions } from '@/lib/explorer-options-engine'
import PriceMeterComparisonFilters from '@/app/components/price-meter-comparison/PriceMeterComparisonFilters'
import PriceMeterComparisonApply from '@/app/components/price-meter-comparison/PriceMeterComparisonApply'
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

export default async function PrecioPorMetroCuadradoPage({
  searchParams
}: PageProps) {
  const filters = await searchParams
  const options = await getExplorerOptions()

  const isComparisonMode =
    filters.mode === 'comparison'

  return (
    <main
      style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '2rem'
      }}
    >
      <h1 style={{ fontSize: '3rem', marginBottom: '.5rem' }}>
        Precio por Metro Cuadrado
      </h1>

      <p style={{ color: '#888', marginBottom: '2rem', fontSize: '1.1rem' }}>
        Analice cómo el precio total de las propiedades se relaciona con el área
        del terreno y el área de construcción en los mercados inmobiliarios de
        Costa Rica.
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
          href="/es/precio-por-metro-cuadrado"
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
          Inteligencia de Mercado
        </Link>

        <Link
          href="/es/precio-por-metro-cuadrado?mode=comparison"
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
          Comparación de Características
        </Link>
      </div>

      {isComparisonMode ? (
        <PriceMeterComparisonFilters
          options={options}
          filters={filters}
          basePath="/es/precio-por-metro-cuadrado"
          language="es"
        />
      ) : (
      <PriceMeterApplyPanel options={options} filters={filters} language="es" source="standalone" />
      )}

      {isComparisonMode && <PriceMeterComparisonApply filters={filters} language="es" />}
    </main>
  )
}