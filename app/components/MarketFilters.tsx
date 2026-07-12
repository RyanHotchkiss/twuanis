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

  const prefix =
      key.startsWith('a_')
        ? 'a_'
        : key.startsWith('b_')
          ? 'b_'
          : ''

    const plainKey =
      prefix
        ? key.slice(2)
        : key

    if (plainKey === 'province') {
      params.delete(`${prefix}canton`)
      params.delete(`${prefix}district`)
    }

    if (plainKey === 'canton') {
      params.delete(`${prefix}district`)
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

function FilterColumn({
      title,
      prefix,
      options,
      filters,
      basePath
    }: {
      title?: string
      prefix: '' | 'a_' | 'b_'
      options: any
      filters: Record<string, string | undefined>
      basePath: string
    }) {
      const provinceKey = `${prefix}province`
      const cantonKey = `${prefix}canton`
      const districtKey = `${prefix}district`

      const cantons = useMemo(() => {
        const selectedProvinceValue =
          filters[provinceKey]

        if (!selectedProvinceValue) return []

        const selectedProvince =
          options.province?.find((province: any) =>
            normalizeOption(getValue(province)) ===
            normalizeOption(selectedProvinceValue)
          )

        if (!selectedProvince) return []

        return (
          options.canton?.filter(
            (canton: any) =>
              canton.parent_id === selectedProvince.id
          ) || []
        )
      }, [
        filters,
        provinceKey,
        options.province,
        options.canton
      ])

      const districts = useMemo(() => {
        const selectedCantonValue =
          filters[cantonKey]

        if (!selectedCantonValue) return []

        const selectedCanton =
          options.canton?.find((canton: any) =>
            normalizeOption(getValue(canton)) ===
            normalizeOption(selectedCantonValue)
          )

        if (!selectedCanton) return []

        return (
          options.district?.filter(
            (district: any) =>
              district.parent_id === selectedCanton.id
          ) || []
        )
      }, [
        filters,
        cantonKey,
        options.canton,
        options.district
      ])

      return (
        <div>
          {title && (
            <h3 style={marketHeading}>
              {title}
            </h3>
          )}

          <div style={locationSection}>
            <h3 style={assetHeading}>Location</h3>

            <div style={locationGrid}>
              <FilterSelect
                label="Province"
                filterKey={provinceKey}
                options={options.province}
                filters={filters}
                basePath={basePath}
              />

              <FilterSelect
                label="Canton"
                filterKey={cantonKey}
                options={cantons}
                filters={filters}
                basePath={basePath}
              />

              <FilterSelect
                label="District"
                filterKey={districtKey}
                options={districts}
                filters={filters}
                basePath={basePath}
              />
            </div>
          </div>

          <div style={wrapper}>
            <FilterSelect label="Transaction" filterKey={`${prefix}transaction_type`} options={transactionOptions} filters={filters} basePath={basePath} />
            <FilterSelect label="Property Type" filterKey={`${prefix}property_type`} options={options.property_type} filters={filters} basePath={basePath} />
            <FilterSelect label="Bedrooms" filterKey={`${prefix}bedrooms`} options={options.bedrooms} filters={filters} basePath={basePath} />
            <FilterSelect label="Bathrooms" filterKey={`${prefix}bathrooms`} options={options.bathrooms} filters={filters} basePath={basePath} />
            <FilterSelect label="Parking" filterKey={`${prefix}parking`} options={options.parking} filters={filters} basePath={basePath} />
            <FilterSelect label="Price Range" filterKey={`${prefix}price_range`} options={priceRangeOptions} filters={filters} basePath={basePath} />
            <FilterSelect label="Property Area" filterKey={`${prefix}property_area`} options={options.property_area} filters={filters} basePath={basePath} />
            <FilterSelect label="Construction Area" filterKey={`${prefix}construction_area`} options={options.construction_area} filters={filters} basePath={basePath} />
            <FilterSelect label="Year Built" filterKey={`${prefix}year_built`} options={options.year_built} filters={filters} basePath={basePath} />
            <FilterSelect label="Environment" filterKey={`${prefix}environment`} options={options.environment} filters={filters} basePath={basePath} />
            <FilterSelect label="Terrain" filterKey={`${prefix}terrain`} options={options.terrain} filters={filters} basePath={basePath} />
            <FilterSelect label="Utilities" filterKey={`${prefix}utility`} options={options.utility} filters={filters} basePath={basePath} />
            <FilterSelect label="Accessibility" filterKey={`${prefix}accessibility`} options={options.accessibility} filters={filters} basePath={basePath} />
            <FilterSelect label="Legal Status" filterKey={`${prefix}legal_status`} options={options.legal_status} filters={filters} basePath={basePath} />
          </div>
        </div>
      )
    }

export default function MarketFilters({
      options,
      filters,
      basePath = '/explore',
      mode = 'single'
    }: {
      options: any
      filters: Record<string, string | undefined>
      basePath?: string
      mode?: 'single' | 'comparison'
    }) {

  return (
      <>
        <div style={resetWrap}>
          <a href={basePath} style={resetLink}>
            {mode === 'comparison'
              ? 'Reset Comparison'
              : 'Reset Explorer'}
          </a>
        </div>

        {mode === 'comparison' ? (
          <div style={comparisonGrid}>
            <FilterColumn
              title="Market A"
              prefix="a_"
              options={options}
              filters={filters}
              basePath={basePath}
            />

            <FilterColumn
              title="Market B"
              prefix="b_"
              options={options}
              filters={filters}
              basePath={basePath}
            />
          </div>
        ) : (
          <FilterColumn
            prefix=""
            options={options}
            filters={filters}
            basePath={basePath}
          />
        )}
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

const comparisonGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: '2rem',
  alignItems: 'start'
}

const marketHeading = {
  color: '#D4AF37',
  fontSize: '1.5rem',
  margin: '0 0 1rem'
}