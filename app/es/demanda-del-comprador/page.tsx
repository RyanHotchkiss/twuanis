import MarketFilters from '@/app/components/FiltrosMercado'
import ResultadosDemandaComprador from './ResultadosDemandaComprador'

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

export default async function DemandaCompradorPage({
  searchParams
}: PageProps) {
  const filters = await searchParams

  const options =
    await getExplorerOptions()

  const demand =
    await getBuyerDemand(filters, 'es')

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
        Demanda del Comprador
      </h1>

      <p
        style={{
          color: '#888',
          marginBottom: '2rem',
          fontSize: '1.1rem'
        }}
      >
        Descubra qué características de las propiedades están
        consistentemente asociadas con precios más altos.
        Analice cómo el entorno, los servicios, el terreno,
        la accesibilidad, el estado legal y otras características
        influyen en el valor del mercado inmobiliario de Costa Rica.
      </p>

      <MarketFilters
        options={options}
        filters={filters}
        basePath="/es/demanda-del-comprador"
      />

        <AnalysisActions
          engineType="buyer-demand"
          language="es"
          filters={filters}
          result={demand}
          defaultName="Demanda del Comprador"
        />

      <ResultadosDemandaComprador
        filters={filters}
        demand={demand}
      />
    </main>
  )
}