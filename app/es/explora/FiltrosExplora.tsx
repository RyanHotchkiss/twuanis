'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import ExploreLocationFilter from './FiltroUbicacionExplora'

const transactionOptions = [
  { id: 'sale', slug: 'sale', term_name: 'En Venta' },
  { id: 'rent', slug: 'rent', term_name: 'En Alquiler' }
]

function buildExploreUrl(
  currentFilters: Record<string, string | undefined>,
  key: string,
  value: string
) {
  const params = new URLSearchParams()

  Object.entries(currentFilters).forEach(
    ([filterKey, filterValue]) => {
      if (filterValue) {
        params.set(filterKey, filterValue)
      }
    }
  )

  if (value && value.length > 0) {
    params.set(key, value)
  } else {
    params.delete(key)
  }

  return `/es/explora?${params.toString()}`
}

function MultiSelectFilter({
  label,
  filterKey,
  options,
  filters
}: {
  label: string
  filterKey: string
  options: any[]
  filters: Record<string, string | undefined>
}) {
  const selectedValues =
    filters[filterKey]
      ? filters[filterKey]!.split(',')
      : []

  return (
    <div style={filterCard}>
      <div
        style={{
          color: '#FFD700',
          fontSize: '1rem',
          fontWeight: 400,
          marginBottom: '1rem'
        }}
      >
        {label.toUpperCase()}
      </div>

      <div style={pillWrap}>
        {options.map((option) => {
          const checked =
            selectedValues.includes(option.slug)

          return (
            <button
              type="button"
              key={`${filterKey}-${option.slug}`}
              onClick={() => {
                let nextValues = [...selectedValues]

                if (checked) {
                  nextValues = nextValues.filter(
                    value => value !== option.slug
                  )
                } else {
                  nextValues.push(option.slug)
                }

                window.location.href =
                  buildExploreUrl(
                    filters,
                    filterKey,
                    nextValues.join(',')
                  )
              }}
              style={checked ? activePill : pill}
            >
              {option.term_name_es || option.term_name_en || option.term_name}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function FilterSelect({
  label,
  filterKey,
  options
}: {
  label: string
  filterKey: string
  options: any[]
}) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const currentValue =
    searchParams.get(filterKey) || ''

  function updateFilter(value: string) {
    const params =
      new URLSearchParams(searchParams.toString())

    if (value && value.length > 0) {
      params.set(filterKey, value)
    } else {
      params.delete(filterKey)
    }

    router.push(`/es/explora?${params.toString()}`)
  }

  return (
    <div style={filterCard}>
      <label>
        <strong>{label}</strong>
      </label>

      <br />

      <select
        value={currentValue}
        onChange={(event) =>
          updateFilter(event.target.value)
        }
        style={{
          width: '100%',
          maxWidth: '420px',
          padding: '0.75rem',
          marginTop: '0.25rem'
        }}
      >
        <option value="">
          Cualquier {label}
        </option>

        {options.map((option) => (
          <option
            key={`${filterKey}-${option.slug}`}
            value={option.slug}
          >
            {option.term_name_es || option.term_name_en || option.term_name}
          </option>
        ))}
      </select>
    </div>
  )
}

export default function ExploreFilters({
  options,
  filters
}: {
  options: any
  filters: Record<string, string | undefined>
}) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns:
          'repeat(auto-fit, minmax(260px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem'
      }}
    >
      <MultiSelectFilter label="Transacción" filterKey="transaction_type" options={transactionOptions} filters={filters} />
      <ExploreLocationFilter options={options} filters={filters} />
      <MultiSelectFilter label="Tipo de Propiedad" filterKey="property_type" options={options.property_type} filters={filters} />
      <MultiSelectFilter label="Habitaciones" filterKey="bedrooms" options={options.bedrooms} filters={filters} />
      <MultiSelectFilter label="Baños" filterKey="bathrooms" options={options.bathrooms} filters={filters} />
      <MultiSelectFilter label="Estacionamiento" filterKey="parking" options={options.parking} filters={filters} />
      <MultiSelectFilter label="Entorno" filterKey="environment" options={options.environment} filters={filters} />
      <MultiSelectFilter label="Terreno" filterKey="terrain" options={options.terrain} filters={filters} />
      <MultiSelectFilter label="Servicios" filterKey="utility" options={options.utility} filters={filters} />
      <MultiSelectFilter label="Accesibilidad" filterKey="accessibility" options={options.accessibility} filters={filters} />
      <MultiSelectFilter label="Estado Legal" filterKey="legal_status" options={options.legal_status} filters={filters} />
    </div>
  )
}

const pillWrap = {
  display: 'flex',
  flexWrap: 'wrap' as const,
  gap: '.5rem'
}

const pill = {
  background: '#181818',
  border: '.25px solid #D4AF3750',
  color: '#fff',
  padding: '.85rem 1rem',
  borderRadius: '999rem',
  cursor: 'pointer',
  transition: 'all .2s ease'
}

const activePill = {
  ...pill,
  background: '#D4AF37',
  border: '1px solid #FFFFFF',
  color: '#000'
}

const filterCard = {
  background: '#0d0d0d',
  border: '1px solid #222',
  borderRadius: '1rem',
  padding: '1.25rem',
  marginBottom: '1rem'
}