export type MarketIntelligenceAreaConstraint = {
  min: number | null
  max: number | null
}

const PROPERTY_AREA_CONSTRAINTS: Record<
  string,
  MarketIntelligenceAreaConstraint
> = {
  'under-100m2': {
    min: null,
    max: 100
  },

  '100-500m2': {
    min: 100,
    max: 500
  },

  '500-1000m2': {
    min: 500,
    max: 1000
  },

  '1000-5000m2': {
    min: 1000,
    max: 5000
  },

  '5000m2-1-hectare': {
    min: 5000,
    max: 10000
  },

  '1-5-hectares': {
    min: 10000,
    max: 50000
  },

  'over-5-hectares': {
    min: 50000,
    max: null
  }
}

const CONSTRUCTION_AREA_CONSTRAINTS: Record<
  string,
  MarketIntelligenceAreaConstraint
> = {
  'under-50m2': {
    min: null,
    max: 50
  },

  '50-100m2': {
    min: 50,
    max: 100
  },

  '100-200m2': {
    min: 100,
    max: 200
  },

  '200-400m2': {
    min: 200,
    max: 400
  },

  '400-800m2': {
    min: 400,
    max: 800
  },

  '800m2-plus': {
    min: 800,
    max: null
  }
}

export const PROPERTY_AREA_RANGE_OPTIONS = [
  {
    value:
      'under-100m2',

    label:
      'Under 100 m²'
  },

  {
    value:
      '100-500m2',

    label:
      '100–<500 m²'
  },

  {
    value:
      '500-1000m2',

    label:
      '500–<1,000 m²'
  },

  {
    value:
      '1000-5000m2',

    label:
      '1,000–<5,000 m²'
  },

  {
    value:
      '5000m2-1-hectare',

    label:
      '5,000–<10,000 m²'
  },

  {
    value:
      '1-5-hectares',

    label:
      '1–<5 hectares'
  },

  {
    value:
      'over-5-hectares',

    label:
      '5 hectares+'
  }
] as const


export const CONSTRUCTION_AREA_RANGE_OPTIONS = [
  {
    value:
      'under-50m2',

    label:
      'Under 50 m²'
  },

  {
    value:
      '50-100m2',

    label:
      '50–<100 m²'
  },

  {
    value:
      '100-200m2',

    label:
      '100–<200 m²'
  },

  {
    value:
      '200-400m2',

    label:
      '200–<400 m²'
  },

  {
    value:
      '400-800m2',

    label:
      '400–<800 m²'
  },

  {
    value:
      '800m2-plus',

    label:
      '800 m²+'
  }
] as const

function matchesAreaConstraint(
  exactM2: number | null | undefined,
  constraint: MarketIntelligenceAreaConstraint
): boolean {
  if (
    exactM2 === null ||
    exactM2 === undefined ||
    !Number.isFinite(exactM2)
  ) {
    return false
  }

  if (
    constraint.min !== null &&
    exactM2 < constraint.min
  ) {
    return false
  }

  if (
    constraint.max !== null &&
    exactM2 >= constraint.max
  ) {
    return false
  }

  return true
}

export function resolvePropertyAreaConstraint(
  selectedRange?: string
): MarketIntelligenceAreaConstraint | null {
  if (!selectedRange) {
    return null
  }

  return (
    PROPERTY_AREA_CONSTRAINTS[selectedRange] ??
    null
  )
}

export function resolveConstructionAreaConstraint(
  selectedRange?: string
): MarketIntelligenceAreaConstraint | null {
  if (!selectedRange) {
    return null
  }

  return (
    CONSTRUCTION_AREA_CONSTRAINTS[selectedRange] ??
    null
  )
}

export function matchesPropertyAreaConstraint(
  exactM2: number | null | undefined,
  selectedRange?: string
): boolean {
  if (!selectedRange) {
    return true
  }

  const constraint =
    resolvePropertyAreaConstraint(selectedRange)

  if (!constraint) {
    return false
  }

  return matchesAreaConstraint(
    exactM2,
    constraint
  )
}

export function matchesConstructionAreaConstraint(
  exactM2: number | null | undefined,
  selectedRange?: string
): boolean {
  if (!selectedRange) {
    return true
  }

  const constraint =
    resolveConstructionAreaConstraint(selectedRange)

  if (!constraint) {
    return false
  }

  return matchesAreaConstraint(
    exactM2,
    constraint
  )
}