'use client'

import { provinces, districts } from '@/data/property-data'

type ExploreLocationFilterProps = {
  options: any
  filters: Record<string, string | undefined>
  basePath?: string
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\+/g, 'plus')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function buildExploreUrl(
  currentFilters: Record<string, string | undefined>,
  key: string,
  value: string,
  basePath: string
) {

  const params = new URLSearchParams()

  Object.entries(currentFilters).forEach(([filterKey, filterValue]) => {
    if (filterValue) params.set(filterKey, filterValue)
  })

  if (value) params.set(key, value)
  else params.delete(key)

  if (key === 'province') {
    params.delete('canton')
    params.delete('district')
  }

  if (key === 'canton') {
    params.delete('district')
  }

  return `${basePath}?${params.toString()}`
}

function findDisplayNameFromSlug(values: string[], slug: string) {
  return values.find(value => slugify(value) === slug)
}

function findOptionBySlug(options: any[], slug?: string) {
  if (!slug) return null
  return options.find(option => option.slug === slug) || null
}

function findOntologyOptionByName(options: any[], name: string) {
  const normalizedName = slugify(name)

  return options.find((option) => {
    const optionName =
      option.term_name_en ||
      option.term_name ||
      option.label ||
      ''

    return slugify(optionName) === normalizedName
  })
}

function findDistrictOptionByNameAndCanton(
  districtOptions: any[],
  districtName: string,
  selectedCantonOption: any
) {
  const normalizedDistrictName = slugify(districtName)

  return districtOptions.find((option) => {
    const optionName =
      option.term_name_en ||
      option.term_name ||
      option.label ||
      ''

    return (
      slugify(optionName) === normalizedDistrictName &&
      option.parent_id === selectedCantonOption?.id
    )
  })
}

function displayDistrictsFromSlugs(
  selectedDistrict: string | undefined,
  options: any[]
) {
  if (!selectedDistrict) return ''

  return selectedDistrict
    .split(',')
    .map(slug => {
      const match = options.find(option => option.slug === slug)

      if (!match) return slug

      const code = match.official_code

      if (code && !String(match.slug).includes(String(code))) {
        return `${match.slug}-${code}`
      }

      return match.slug
    })
    .join(', ')
}

export default function ExploreLocationFilter({
  options,
  filters,
  basePath = '/explore'
}: ExploreLocationFilterProps) {
  const selectedProvince = filters.province
  const selectedCanton = filters.canton
  const selectedDistrict = filters.district

  const provinceOptions = Object.keys(provinces)

  const selectedProvinceName = selectedProvince
    ? findDisplayNameFromSlug(Object.keys(provinces), selectedProvince)
    : null

  const selectedCantonName = selectedCanton
    ? findDisplayNameFromSlug(Object.keys(districts), selectedCanton)
    : null

  const cantonOptions = selectedProvinceName
    ? provinces[selectedProvinceName] || []
    : []

  const districtOptions = selectedCantonName
    ? districts[selectedCantonName] || []
    : []

  const selectedCantonOption = findOptionBySlug(
    options.canton || [],
    selectedCanton
  )

  const selectedDistrictLabel = displayDistrictsFromSlugs(
    selectedDistrict,
    options.district || []
  )

  return (
    <div>
      <h3 style={filterHeading}>LOCATION</h3>

      <div style={summaryCard}>
        <span style={breadcrumbText}>
          {selectedProvinceName || selectedProvince || 'Costa Rica'}

          {selectedCanton && (
            <>
              {' → '}
              {selectedCanton}
            </>
          )}

          {selectedDistrict && (
            <>
              {' → '}
              {selectedDistrictLabel}
            </>
          )}
        </span>

        {(selectedProvince || selectedCanton || selectedDistrict) && (
          <a href={basePath} style={resetButton}>
            ✕
          </a>
        )}
      </div>

      {!selectedProvince && (
        <div style={sectionBlock}>
          <h2 style={sectionHeading}>Province</h2>

          <div style={pillWrap}>
            {provinceOptions.map((province: string) => (
              <a
                key={province}
                href={buildExploreUrl(
                filters,
                'province',
                findOntologyOptionByName(
                  options.province || [],
                  province
                )?.slug || slugify(province),
                basePath
              )}
                style={pill}
              >
                {province}
              </a>
            ))}
          </div>
        </div>
      )}

      {selectedProvince && !selectedCanton && (
        <div style={sectionBlock}>
          <div style={breadcrumbBar}>
            <a
              href={buildExploreUrl(filters, 'province', '', basePath)}
              style={backButton}
            >
              ← provinces
            </a>

            <span style={breadcrumbText}>
              {selectedProvinceName || selectedProvince}
            </span>
          </div>

          <h2 style={sectionHeading}>Canton</h2>

          <div style={pillWrap}>
            {cantonOptions.map((canton: string) => (
              <a
                key={canton}
                href={buildExploreUrl(
                  filters,
                  'canton',
                  findOntologyOptionByName(
                    options.canton || [],
                    canton
                  )?.slug || slugify(canton),
                  basePath
                )}
                style={pill}
              >
                {canton}
              </a>
            ))}
          </div>
        </div>
      )}

      {selectedProvince && selectedCanton && (
        <div style={sectionBlock}>
          <div style={breadcrumbBar}>
            <a
              href={buildExploreUrl(filters, 'canton', '', basePath)}
              style={backButton}
            >
              ← cantons
            </a>

            <span style={breadcrumbText}>
              {selectedProvinceName || selectedProvince}
              {' → '}
              {selectedCantonName || selectedCanton}
            </span>
          </div>

          <h2 style={sectionHeading}>District</h2>

          <div style={pillWrap}>
            {districtOptions.map((district: string) => {
              const districtMatch =
                findDistrictOptionByNameAndCanton(
                  options.district || [],
                  district,
                  selectedCantonOption
                )

              if (!districtMatch) return null

              const districtSlug = districtMatch.slug

              const selectedDistricts = selectedDistrict
                ? selectedDistrict.split(',')
                : []

              const isSelected =
                selectedDistricts.includes(districtSlug)

              const nextDistricts = isSelected
                ? selectedDistricts.filter(value => value !== districtSlug)
                : [...selectedDistricts, districtSlug]

              return (
                  <button
                    type="button"
                    key={districtSlug}
                    onClick={() => {
                      window.location.href = buildExploreUrl(
                        filters,
                        'district',
                        nextDistricts.join(','),
                        basePath
                      )
                    }}
                    style={isSelected ? activePill : pill}
                  >
                    {district}
                  </button>                
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

const filterHeading = {
  fontSize: '1rem',
  marginBottom: '1rem',
  color: '#D4AF37'
}

const sectionHeading = {
  fontSize: '.8rem',
  marginBottom: '1rem',
  color: '#FFFFFF'
}

const sectionBlock = {
  marginTop: '1rem'
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
  transition: 'all .2s ease',
  textDecoration: 'none',
  display: 'inline-block'
}

const activePill = {
  ...pill,
  background: '#D4AF37',
  border: '1px solid #FFFFFF',
  color: '#000',
  fontWeight: 'bold'
}

const summaryCard = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  background: '#181818',
  border: '1px solid #FFFFFF50',
  borderRadius: '1rem',
  padding: '1rem',
  marginTop: '1rem'
}

const breadcrumbBar = {
  display: 'flex',
  alignItems: 'center',
  gap: '.75rem',
  marginBottom: '1rem'
}

const breadcrumbText = {
  color: '#FFFFFF',
  fontSize: '.85rem'
}

const backButton = {
  background: 'transparent',
  border: 'none',
  color: '#FFFFFF70',
  cursor: 'pointer',
  fontSize: '.85rem',
  textDecoration: 'none'
}

const resetButton = {
  background: 'transparent',
  border: 'none',
  color: '#ff6666',
  cursor: 'pointer',
  fontSize: '1rem',
  textDecoration: 'none'
}