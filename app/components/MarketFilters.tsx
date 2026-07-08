'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'

const transactionOptions = [
  { slug: 'sale', term_name: 'For Sale' },
  { slug: 'rent', term_name: 'For Rent' }
]

const priceRangeOptions = [
  { slug: '0-25000000', term_name: '₡0 – ₡25M' },
  { slug: '25000000-50000000', term_name: '₡25M – ₡50M' },
  { slug: '50000000-100000000', term_name: '₡50M – ₡100M' },
  { slug: '100000000-250000000', term_name: '₡100M – ₡250M' },
  { slug: '250000000+', term_name: '₡250M+' }
]

function getLabel(option: any) {
  if (typeof option === 'string') return option
  return option.term_name_en || option.term_name || option.slug
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

    const separator =
      basePath.includes('?') ? '&' : '?'

    return query
      ? `${basePath}${separator}${query}`
      : basePath
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
            buildUrl(
              filters,
              filterKey,
              event.target.value,
              basePath
            )
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

function normalizeOption(value: any) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

export default function MarketFilters({
  options,
  filters,
  basePath = '/explore'
}: {
  options: any
  filters: Record<string, string | undefined>
  basePath?: string
}) {

  const leftCantons = useMemo(() => {
            if (!filters.province) return []

            const selectedProvince =
              options.province?.find((province: any) =>
                normalizeOption(getValue(province)) ===
                normalizeOption(filters.province)
              )

            if (!selectedProvince) return []

            return (
              options.canton?.filter(
                (c: any) => c.parent_id === selectedProvince.id
              ) || []
            )
          }, [filters.province, options.province, options.canton])

  const leftDistricts = useMemo(() => {
            if (!filters.canton) return []

            const selectedCanton =
              options.canton?.find((canton: any) =>
                normalizeOption(getValue(canton)) ===
                normalizeOption(filters.canton)
              )

            if (!selectedCanton) return []

            return (
              options.district?.filter(
                (d: any) => d.parent_id === selectedCanton.id
              ) || []
            )
          }, [filters.canton, options.canton, options.district])

  return (
    <>
      <div style={resetWrap}>
        <a href={basePath} style={resetLink}>
          Reset Explorer
        </a>
      </div>

        <div style={locationSection}>
        <h3 style={assetHeading}>Location</h3>

        <div style={locationGrid}>
          <FilterSelect
            label="Province"
            filterKey="province"
            options={options.province}
            filters={filters}
            basePath={basePath}
          />

          <FilterSelect
            label="Canton"
            filterKey="canton"
            options={leftCantons}
            filters={filters}
            basePath={basePath}
          />

          <FilterSelect
            label="District"
            filterKey="district"
            options={leftDistricts}
            filters={filters}
            basePath={basePath}
          />
        </div>
      </div>

      <div style={wrapper}>
        <FilterSelect label="Transaction" filterKey="transaction_type" options={transactionOptions} filters={filters} basePath={basePath} />
        <FilterSelect label="Property Type" filterKey="property_type" options={options.property_type} filters={filters} basePath={basePath} />
        <FilterSelect label="Bedrooms" filterKey="bedrooms" options={options.bedrooms} filters={filters} basePath={basePath} />
        <FilterSelect label="Bathrooms" filterKey="bathrooms" options={options.bathrooms} filters={filters} basePath={basePath} />
        <FilterSelect label="Parking" filterKey="parking" options={options.parking} filters={filters} basePath={basePath} />
        <FilterSelect label="Price Range" filterKey="price_range" options={priceRangeOptions} filters={filters} basePath={basePath} />
        <FilterSelect label="Property Area" filterKey="property_area" options={options.property_area} filters={filters} basePath={basePath} />
        <FilterSelect label="Construction Area" filterKey="construction_area" options={options.construction_area} filters={filters} basePath={basePath} />
        <FilterSelect label="Year Built" filterKey="year_built" options={options.year_built} filters={filters} basePath={basePath} />
        <FilterSelect label="Environment" filterKey="environment" options={options.environment} filters={filters} basePath={basePath} />
        <FilterSelect label="Terrain" filterKey="terrain" options={options.terrain} filters={filters} basePath={basePath} />
        <FilterSelect label="Utilities" filterKey="utility" options={options.utility} filters={filters} basePath={basePath} />
        <FilterSelect label="Accessibility" filterKey="accessibility" options={options.accessibility} filters={filters} basePath={basePath} />
        <FilterSelect label="Legal Status" filterKey="legal_status" options={options.legal_status} filters={filters} basePath={basePath} />
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