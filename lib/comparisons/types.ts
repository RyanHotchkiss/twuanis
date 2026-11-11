// /lib/comparisons/types.ts

export type ComparisonKind =
  | 'property'
  | 'market'
  | 'entity'

export type ComparisonLanguage =
  | 'en'
  | 'es'

export type ComparisonFilters = {
  transaction_type?: string
  province?: string
  canton?: string
  district?: string
  property_type?: string
  bedrooms?: string
  bathrooms?: string
  parking?: string
  price_range?: string
  year_built?: string
  property_area?: string
  construction_area?: string
  utility?: string
  environment?: string
  terrain?: string
  accessibility?: string
  distance_to_paved_road_range?: string
  legal_status?: string
}

export type ComparisonSummary = {
  id: string
  kind: ComparisonKind
  title: string
  summary: string
  updatedAt: string
  href: string
}

export type PropertyComparison = {
  id: string
  userId: string
  name: string
  propertyIds: string[]
  createdAt: string
  updatedAt: string
}

export type MarketComparison = {
  id: string
  userId: string
  name: string
  leftFilters: ComparisonFilters
  rightFilters: ComparisonFilters
  comparisonResult: unknown
  createdAt: string
  updatedAt: string
}

export type EntityComparison = {
  id: string
  leftTermId: number
  rightTermId: number
  metricName: string
  leftValue: number | null
  rightValue: number | null
  difference: number | null
  calculatedAt: string
}