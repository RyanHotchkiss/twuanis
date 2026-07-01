'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'

const transactionOptions = [
  { slug: 'sale', term_name_es: 'En Venta' },
  { slug: 'rent', term_name_es: 'En Alquiler' }
]

const priceRangeOptions = [
  { slug: '0-25000000', term_name_es: '₡0 – ₡25M' },
  { slug: '25000000-50000000', term_name_es: '₡25M – ₡50M' },
  { slug: '50000000-100000000', term_name_es: '₡50M – ₡100M' },
  { slug: '100000000-250000000', term_name_es: '₡100M – ₡250M' },
  { slug: '250000000+', term_name_es: '₡250M+' }
]

function getLabel(option: any) {
  if (typeof option === 'string') return option

  return (
    option.term_name_es ||
    option.term_name_en ||
    option.term_name ||
    option.label ||
    option.slug
  )
}

function getValue(option: any) {
  if (typeof option === 'string') return option
  return option.slug
}

function buildUrl(
  filters: Record<string, string | undefined>,
  key: string,
  value: string,
  basePath: string
) {
  const params = new URLSearchParams()

  Object.entries(filters).forEach(([filterKey, filterValue]) => {
    if (filterValue) params.set(filterKey, filterValue)
  })

  if (value) {
    params.set(key, value)
  } else {
    params.delete(key)
  }

  if (key === 'province') {
    params.delete('canton')
    params.delete('district')
  }

  if (key === 'canton') {
    params.delete('district')
  }

  const query = params.toString()

  return query ? `${basePath}?${query}` : basePath
}

function FilterSelect({
  label,
  filterKey,
  options,
  filters,
  basePath
}: {
  label: string
  filterKey: string
  options: any[]
  filters: Record<string, string | undefined>
  basePath: string
}) {
  const router = useRouter()

  return (
    <div style={assetSection}>
      <h3 style={assetHeading}>{label}</h3>

      <select
        value={filters[filterKey] || ''}
        onChange={(event) =>
          router.push(
            buildUrl(filters, filterKey, event.target.value, basePath)
          )
        }
        style={select}
      >
        <option value="">{label}</option>

        {options?.map((option: any) => (
          <option
            key={`${filterKey}-${getValue(option)}`}
            value={getValue(option)}
          >
            {getLabel(option)}
          </option>
        ))}
      </select>
    </div>
  )
}

export default function FiltrosMercado({
  options,
  filters,
  basePath = '/es/explorar'
}: {
  options: any
  filters: Record<string, string | undefined>
  basePath?: string
}) {
  const cantons = useMemo(() => {
    if (!filters.province) return []

    return (
      options.canton?.filter(
        (c: any) => c.province === filters.province
      ) || []
    )
  }, [filters.province, options.canton])

  const districts = useMemo(() => {
    if (!filters.canton) return []

    return (
      options.district?.filter(
        (d: any) => d.canton === filters.canton
      ) || []
    )
  }, [filters.canton, options.district])

  return (
    <>
      <div style={resetWrap}>
        <a href={basePath} style={resetLink}>
          Reiniciar Explorador
        </a>
      </div>

      <div style={locationSection}>
        <h3 style={assetHeading}>Ubicación</h3>

        <div style={locationGrid}>
          <FilterSelect
            label="Provincia"
            filterKey="province"
            options={options.province}
            filters={filters}
            basePath={basePath}
          />

          <FilterSelect
            label="Cantón"
            filterKey="canton"
            options={cantons}
            filters={filters}
            basePath={basePath}
          />

          <FilterSelect
            label="Distrito"
            filterKey="district"
            options={districts}
            filters={filters}
            basePath={basePath}
          />
        </div>
      </div>

      <div style={wrapper}>
        <FilterSelect label="Transacción" filterKey="transaction_type" options={transactionOptions} filters={filters} basePath={basePath} />
        <FilterSelect label="Tipo de Propiedad" filterKey="property_type" options={options.property_type} filters={filters} basePath={basePath} />
        <FilterSelect label="Habitaciones" filterKey="bedrooms" options={options.bedrooms} filters={filters} basePath={basePath} />
        <FilterSelect label="Baños" filterKey="bathrooms" options={options.bathrooms} filters={filters} basePath={basePath} />
        <FilterSelect label="Estacionamiento" filterKey="parking" options={options.parking} filters={filters} basePath={basePath} />
        <FilterSelect label="Rango de Precio" filterKey="price_range" options={priceRangeOptions} filters={filters} basePath={basePath} />
        <FilterSelect label="Área del Terreno" filterKey="property_area" options={options.property_area} filters={filters} basePath={basePath} />
        <FilterSelect label="Área de Construcción" filterKey="construction_area" options={options.construction_area} filters={filters} basePath={basePath} />
        <FilterSelect label="Año de Construcción" filterKey="year_built" options={options.year_built} filters={filters} basePath={basePath} />
        <FilterSelect label="Entorno" filterKey="environment" options={options.environment} filters={filters} basePath={basePath} />
        <FilterSelect label="Terreno" filterKey="terrain" options={options.terrain} filters={filters} basePath={basePath} />
        <FilterSelect label="Servicios" filterKey="utility" options={options.utility} filters={filters} basePath={basePath} />
        <FilterSelect label="Accesibilidad" filterKey="accessibility" options={options.accessibility} filters={filters} basePath={basePath} />
        <FilterSelect label="Estado Legal" filterKey="legal_status" options={options.legal_status} filters={filters} basePath={basePath} />
      </div>
    </>
  )
}

const resetWrap = {
  display: 'flex',
  justifyContent: 'flex-end',
  marginBottom: '1rem'
}

const resetLink = {
  color: '#ff3b00',
  textDecoration: 'none',
  fontWeight: 600
}

const wrapper = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
  gap: '1rem',
  marginBottom: '2rem'
}

const locationSection = {
  background: '#0d0d0d',
  border: '1px solid #222',
  borderRadius: '1rem',
  padding: '1.25rem',
  marginBottom: '1rem'
}

const locationGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: '1rem'
}

const assetSection = {
  background: '#0d0d0d',
  border: '1px solid #222',
  borderRadius: '1rem',
  padding: '1.25rem',
  display: 'flex',
  flexDirection: 'column' as const,
  gap: '.6rem'
}

const assetHeading = {
  color: '#FFD700',
  fontSize: '.9rem',
  textTransform: 'uppercase' as const,
  letterSpacing: '.08rem',
  margin: '0 0 .25rem 0'
}

const select = {
  background: '#111',
  color: '#fff',
  border: '1px solid #333',
  borderRadius: '.5rem',
  padding: '.75rem',
  fontSize: '1rem',
  width: '100%'
}