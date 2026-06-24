import Link from 'next/link'
import { exploreMarket } from '@/lib/explorer-engine'
import { getExplorerOptions } from '@/lib/explorer-options-engine'
import ExploreFilters from './FiltrosExplora'
import ExploreResults from './ResultadosExplora'
import TopBarES from '@/app/components/TopBarES'
import GraphExplorer from '@/app/components/GraphExplorer'

type ExplorePageProps = {
  searchParams: Promise<{
    transaction_type?: string
    province?: string
    canton?: string
    district?: string
    property_type?: string
    bedrooms?: string
    bathrooms?: string
    parking?: string
    environment?: string
    terrain?: string
    utility?: string
    accessibility?: string
    legal_status?: string
  }>
}

export default async function ExplorePage({
  searchParams
}: ExplorePageProps) {
  const params = await searchParams
  const options = await getExplorerOptions()

  const filters = {
    transaction_type: params.transaction_type,
    province: params.province,
    canton: params.canton,
    district: params.district,
    property_type: params.property_type,
    bedrooms: params.bedrooms,
    bathrooms: params.bathrooms,
    parking: params.parking,
    environment: params.environment,
    terrain: params.terrain,
    utility: params.utility,
    accessibility: params.accessibility,
    legal_status: params.legal_status
  }

  const hasFilters = Object.values(filters).some(Boolean)

  const result = hasFilters
    ? await exploreMarket(filters)
    : null

  return (
    <main
        style={{
          minHeight: '100vh',
          padding: '2rem',
          background: '#0a0a0a',
          color: '#ededed'
        }}
      >
      <TopBarES />

      <GraphExplorer />

      <p style={introText}>
        Construya consultas personalizadas del mercado inmobiliario de Costa Rica
        combinando ubicación, tipo de propiedad, señales de precio, atributos de
        inventario, contexto ambiental, infraestructura, accesibilidad y estado
        legal en un informe estructurado de inteligencia de mercado.
      </p>

      <br />

      <ExploreFilters
        options={options}
        filters={filters}
      />

      <Link
        href="/es/explora"
        style={{
          ...explorerPill,
          color: '#DC143C',
          marginTop: '1rem'
        }}
      >
        Restablecer Explorador
      </Link>

      {!result && (
        <p>
          Seleccione una combinación de mercado para comenzar a explorar.
        </p>
      )}

      {result && (
        <ExploreResults result={result} />
      )}
    </main>
  )
}

const introText = {
  maxWidth: '80%',
  margin: '0 auto 2rem',
  color: '#ccc',
  lineHeight: '1.6',
  fontSize: '1.05rem',
  textAlign: 'center' as const
}

const explorerPill = {
  background: '#181818',
  border: '.25px solid #D4AF3750',
  padding: '.85rem 1rem',
  borderRadius: '999rem',
  cursor: 'pointer',
  transition: 'all .2s ease',
  textDecoration: 'none',
  display: 'inline-block'
}