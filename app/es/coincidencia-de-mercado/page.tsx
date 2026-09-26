import CanonicalMarketApplyPanel from '@/app/components/CanonicalMarketApplyPanel'
import MarketFilters from '@/app/components/MarketFilters'
import ResultadosCoincidenciaMercado from './ResultadosCoincidenciaMercado'

import { getExplorerOptions } from '@/lib/explorer-options-engine'
import { getMarketMatches } from '@/lib/market-matching-engine'

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

export default async function CoincidenciaMercadoPage({
  searchParams
}: PageProps) {

  const filters = await searchParams

  const options =
    await getExplorerOptions()

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
        Coincidencia de Mercado
      </h1>

      <p
        style={{
          color: '#888',
          marginBottom: '2rem',
          fontSize: '1.1rem'
        }}
      >
        Encuentra las propiedades disponibles que más se acercan a las
        características, ubicación y condiciones de mercado que buscas.
      </p>

      <CanonicalMarketApplyPanel workspace="matching" options={options} filters={filters} language="es"/>

      
    </main>
  )
}