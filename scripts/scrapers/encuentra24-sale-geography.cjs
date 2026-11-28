'use strict'

// Encuentra24 exposes authoritative geography in its breadcrumb.  The number
// of category crumbs varies (notably for "Proyectos nuevos"), so locate the
// province marker rather than depending on an absolute breadcrumb position.
const clean = value => String(value || '').replace(/\s+/g, ' ').trim()

function normalizeProvince(value) {
  return clean(value)
    .replace(/\s+provincia$/iu, '')
    .replace(/^San Jose$/iu, 'San José')
    .replace(/^Limon$/iu, 'Limón')
}

function normalizeCanton(value) {
  return clean(value)
    .replace(/^Escazu$/iu, 'Escazú')
    .replace(/^(?:Central\s+)?San José(?:\s+Capital)?$/iu, 'San José')
}

// Encuentra24's breadcrumb calls the Pavas district "Rohrmoser" on some
// listings. This is a source-label equivalence, not a geographic inference:
// it applies only after the breadcrumb identifies San José / San José.
function normalizeDistrict(value, { province = '', canton = '' } = {}) {
  const district = clean(value)
  if (/^Rohrmoser$/iu.test(district) && /^San José$/iu.test(clean(province)) && /^San José$/iu.test(clean(canton))) return 'Pavas'
  return district
}

function breadcrumbParts(value) {
  return Array.isArray(value)
    ? value.map(clean).filter(Boolean)
    : String(value || '').split('|').map(clean).filter(Boolean)
}

function extractEncuentra24SaleGeography(value) {
  const parts = breadcrumbParts(value)
  const provinceIndex = parts.findIndex(part => /\bprovincia$/iu.test(part))
  if (provinceIndex < 0) return { raw_breadcrumbs: parts.join('|'), province: '', canton: '', district: '' }
  const province = normalizeProvince(parts[provinceIndex])
  const canton = normalizeCanton(parts[provinceIndex + 1])
  return {
    raw_breadcrumbs: parts.join('|'),
    province,
    canton,
    district: normalizeDistrict(parts[provinceIndex + 2], { province, canton })
  }
}

function normalizeEncuentra24RowGeography(row = {}) {
  const fromBreadcrumbs = extractEncuentra24SaleGeography(row.raw_breadcrumbs)
  return fromBreadcrumbs.province
    ? { ...row, ...fromBreadcrumbs }
    : (() => {
      const province = normalizeProvince(row.province)
      const canton = normalizeCanton(row.canton)
      return { ...row, province, canton, district: normalizeDistrict(row.district, { province, canton }) }
    })()
}

module.exports = {
  normalizeProvince,
  normalizeCanton,
  normalizeDistrict,
  extractEncuentra24SaleGeography,
  normalizeEncuentra24RowGeography,
  normalizeEncuentra24SaleRowGeography: normalizeEncuentra24RowGeography
}
