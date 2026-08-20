export type MarketplaceAreaRange = {
  min: number | null
  max: number | null
}

const PROPERTY_AREA_RANGES: Record<
  string,
  MarketplaceAreaRange
> = {
  '<1,000m²': {
    min: null,
    max: 1000
  },

  '1,000–10,000m²': {
    min: 1000,
    max: 10000
  },

  '10,000–50,000m²': {
    min: 10000,
    max: 50000
  },

  '50,000m²+': {
    min: 50000,
    max: null
  },

  'Más de 50,000m²': {
    min: 50000,
    max: null
  }
}

const CONSTRUCTION_AREA_RANGES: Record<
  string,
  MarketplaceAreaRange
> = {
  '<50m²': {
    min: null,
    max: 50
  },

  '50-100m²': {
    min: 50,
    max: 100
  },

  '100-200m²': {
    min: 100,
    max: 200
  },

  '200-400m²': {
    min: 200,
    max: 400
  },

  '400m²+': {
    min: 400,
    max: null
  }
}

function getCanonicalArea(
  value: unknown
): number | null {
  if (
    typeof value === 'number' &&
    Number.isFinite(value)
  ) {
    return value
  }

  if (typeof value !== 'string') {
    return null
  }

  const normalized =
    value
      .replace(/,/g, '')
      .replace(/\s*m²\s*$/i, '')
      .trim()

  if (!/^\d+(?:\.\d+)?$/.test(normalized)) {
    return null
  }

  const area =
    Number(normalized)

  return Number.isFinite(area)
    ? area
    : null
}

function matchesRange(
  value: unknown,
  range: MarketplaceAreaRange
): boolean {
  const area =
    getCanonicalArea(value)

  if (area === null) {
    return false
  }

  if (
    range.min !== null &&
    area < range.min
  ) {
    return false
  }

  if (
    range.max !== null &&
    area >= range.max
  ) {
    return false
  }

  return true
}

export function matchesPropertyAreaRange(
  value: unknown,
  selectedRange: string
): boolean {
  if (!selectedRange) {
    return true
  }

  const range =
    PROPERTY_AREA_RANGES[selectedRange]

  if (!range) {
    return false
  }

  return matchesRange(
    value,
    range
  )
}

export function matchesConstructionAreaRange(
  value: unknown,
  selectedRange: string
): boolean {
  if (!selectedRange) {
    return true
  }

  const range =
    CONSTRUCTION_AREA_RANGES[selectedRange]

  if (!range) {
    return false
  }

  return matchesRange(
    value,
    range
  )
}