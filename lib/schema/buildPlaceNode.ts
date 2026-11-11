const SITE_URL = 'https://twuanis.com'

export function placeId(
  type: string,
  slug: string
) {
  return `${SITE_URL}/id/${type}/${slug}`
}

export function buildCountryNode() {
  return {
    '@type': 'Country',
    '@id': `${SITE_URL}/id/country/costa-rica`,
    name: 'Costa Rica'
  }
}

export function buildProvinceNode(
  provinceSlug: string,
  provinceName: string
) {
  return {
    '@type': 'AdministrativeArea',
    '@id': placeId('province', provinceSlug),
    name: provinceName,
    containedInPlace: {
      '@id': `${SITE_URL}/id/country/costa-rica`
    }
  }
}

export function buildCantonNode(
  cantonSlug: string,
  cantonName: string,
  provinceSlug: string
) {
  return {
    '@type': 'AdministrativeArea',
    '@id': placeId('canton', cantonSlug),
    name: cantonName,
    containedInPlace: {
      '@id': placeId('province', provinceSlug)
    }
  }
}

export function buildDistrictNode(
  districtSlug: string,
  districtName: string,
  cantonSlug: string
) {
  return {
    '@type': 'Place',
    '@id': placeId('district', districtSlug),
    name: districtName,
    containedInPlace: {
      '@id': placeId('canton', cantonSlug)
    }
  }
}