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

export default function ValuationFilters({
  filters
}: {
  filters: Filters
}) {
  const router = useRouter()

  function openExplorer() {
    const params = new URLSearchParams()

    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value)
    })

    router.push(`/explore?${params.toString()}`)
  }

  return (
    <section
      style={{
        background: '#111',
        border: '1px solid #222',
        borderRadius: '1rem',
        padding: '2rem',
        marginBottom: '2rem'
      }}
    >
      <h2
        style={{
          marginTop: 0,
          color: '#ff3B00'
        }}
      >
        Property Selection
      </h2>

      <p
        style={{
          color: '#999',
          marginBottom: '1.5rem'
        }}
      >
        For the first version, property selection is performed through the
        existing Explorer filters.
      </p>

      <button
        onClick={openExplorer}
        style={{
          background: '#ff3B00',
          color: '#fff',
          border: 0,
          padding: '1rem 1.5rem',
          borderRadius: '.75rem',
          cursor: 'pointer',
          fontWeight: 700,
          fontSize: '1rem'
        }}
      >
        Open Property Explorer
      </button>
    </section>
  )
}