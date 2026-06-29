
import ValuationResults from './ResultadosValoracion'
import { getValuation } from '@/lib/valuation-engine'
import MarketFilters from '@/app/components/FiltrosMercado'
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
  const valuation = await getValuation(filters, 'es')

  return (
    <main
      style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '2rem'
      }}
    >
      <h1 style={{ fontSize: '3rem', marginBottom: '.5rem' }}>
        Valoración de Propiedades en Costa Rica
      </h1>

      <p style={{ color: '#888', marginBottom: '2rem', fontSize: '1.1rem' }}>
        Estime el valor de mercado utilizando propiedades comparables,
        estadísticas del mercado y el Grafo de Conocimiento Inmobiliario
        de Twuanis.
      </p>

        <MarketFilters
            options={options}
            filters={filters}
            basePath="/es/valoracion"
            />

      <ValuationResults
        filters={filters}
        valuation={valuation}
      />
    </main>
  )
}