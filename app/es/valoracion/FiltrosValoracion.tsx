'use client'

import { useRouter } from 'next/navigation'

type Filters = {
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
}

export default function FiltrosValoracion({
  filters
}: {
  filters: Filters
}) {
  const router = useRouter()

  function abrirExplorador() {
    const params = new URLSearchParams()

    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value)
    })

    router.push(`/es/explora?${params.toString()}`)
  }

  return (
    <section style={filterCard}>
      <h2 style={sectionTitle}>
        Selección de Propiedad
      </h2>

      <p style={descriptionText}>
        En la primera versión, la selección de propiedades se realiza
        mediante los filtros existentes del Explorador.
      </p>

      <button
        onClick={abrirExplorador}
        style={buttonStyle}
      >
        Abrir Explorador de Propiedades
      </button>
    </section>
  )
}

const filterCard = {
  background: '#111',
  border: '1px solid #222',
  borderRadius: '1rem',
  padding: '2rem',
  marginBottom: '2rem'
}

const sectionTitle = {
  marginTop: 0,
  color: '#ff3B00'
}

const descriptionText = {
  color: '#999',
  marginBottom: '1.5rem'
}

const buttonStyle = {
  background: '#ff3B00',
  color: '#fff',
  border: 0,
  padding: '1rem 1.5rem',
  borderRadius: '.75rem',
  cursor: 'pointer',
  fontWeight: 700,
  fontSize: '1rem'
}