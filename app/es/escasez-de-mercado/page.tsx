import MarketFilters from '@/app/components/FiltrosMercado'
import ResultadosEscasezMercado from './ResultadosEscasezMercado'

import { getExplorerOptions } from '@/lib/explorer-options-engine'
import { getMarketScarcity } from '@/lib/market-scarcity-engine'

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

export default async function EscasezMercadoPage({
  searchParams
}: PageProps) {
  const filters = await searchParams

  const options =
    await getExplorerOptions()

  const scarcity =
    await getMarketScarcity(filters, 'es')

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
        Escasez de Mercado
      </h1>

      <p
        style={{
          color: '#888',
          marginBottom: '2rem',
          fontSize: '1.1rem'
        }}
      >
        Identifique combinaciones de propiedades difíciles de encontrar.
        Mida la escasez según ubicación, tipo de propiedad, entorno,
        servicios, terreno, accesibilidad, estado legal y otras
        características del mercado inmobiliario de Costa Rica.
      </p>

      <MarketFilters
        options={options}
        filters={filters}
        basePath="/es/escasez-de-mercado"
      />

        <AnalysisActions
          engineType="scarcity"
          language="es"
          filters={filters}
          result={scarcity}
          defaultName="Escasez de Mercado"
        />

      <ResultadosEscasezMercado
        filters={filters}
        scarcity={scarcity}
      />
    </main>
  )
}