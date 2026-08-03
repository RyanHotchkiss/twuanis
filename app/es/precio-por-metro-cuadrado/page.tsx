import MarketFilters from '@/app/components/FiltrosMercado'
import PriceMeterResults from './ResultadosPrecioMetro'
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

export default async function PrecioPorMetroCuadradoPage({
  searchParams
}: PageProps) {
  const filters = await searchParams
  const options = await getExplorerOptions()

  const analysis =
    await getPriceMeterAnalysis(filters, 'es')

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

      <MarketFilters
        options={options}
        filters={filters}
        basePath="/es/precio-por-metro-cuadrado"
      />

      <AnalysisActions
        engineType="price-meter"
        language="es"
        filters={filters}
        result={analysis}
        defaultName="Precio por Metro Cuadrado"
      />

      <PriceMeterResults
        filters={filters}
        analysis={analysis}
      />
    </main>
  )
}