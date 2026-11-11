function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/\+/g, 'plus')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function titleize(value: string) {
  return value
    .replace(/,/g, ', ')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase())
}

function buildExploreUrl(
  filters: Record<string, any>,
  additions: Record<string, string>
) {
  const params = new URLSearchParams()

  Object.entries({
    ...filters,
    ...additions
  }).forEach(([key, value]) => {
    if (value) params.set(key, String(value))
  })

  return `/explore?${params.toString()}`
}

export function getRelatedMarkets(
  filters: Record<string, any>,
  marketComposition: Record<string, any[]>
) {
  const markets: {
    title: string
    count: number
    url: string
  }[] = []

  const province =
    filters.province
      ? titleize(filters.province)
      : 'Costa Rica'

  const propertyType =
    filters.property_type
      ? titleize(filters.property_type)
      : 'Properties'

  ;(marketComposition.canton || [])
    .slice(0, 3)
    .forEach((item) => {
      markets.push({
        title: `${propertyType} in ${item.value}, ${province}`,
        count: item.count,
        url: buildExploreUrl(filters, {
          canton: slugify(item.value)
        })
      })
    })

  ;(marketComposition.environment || [])
    .slice(0, 3)
    .forEach((item) => {
      markets.push({
        title: `${item.value} ${propertyType} in ${province}`,
        count: item.count,
        url: buildExploreUrl(filters, {
          environment: slugify(item.value)
        })
      })
    })

  ;(marketComposition.bedrooms || [])
    .slice(0, 3)
    .forEach((item) => {
      markets.push({
        title: `${item.value} ${propertyType} in ${province}`,
        count: item.count,
        url: buildExploreUrl(filters, {
          bedrooms: slugify(item.value)
        })
      })
    })

  return markets
}