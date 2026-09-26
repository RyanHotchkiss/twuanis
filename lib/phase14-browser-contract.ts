// Browser data only. This contract confers no server execution authority.
export type Phase14BrowserFailureCode =
  | 'invalid_request' | 'authentication_required' | 'entitlement_required' | 'execution_failed'
export type Phase14BrowserFailure = Readonly<{
  state: 'error'; contractVersion: 1; code: Phase14BrowserFailureCode
}>
export type Phase14BrowserConstraint =
  | Readonly<{kind: 'exact'; value: string}>
  | Readonly<{kind: 'category'; termId: string}>
  | Readonly<{kind: 'interval'; interval: Readonly<{
      lower: string | null; upper: string | null; lowerInclusive: boolean; upperInclusive: boolean
    }>}>
export type Phase14BrowserFilters = Readonly<{
  semantics?: Readonly<Partial<Record<'environment' | 'terrain' | 'utility' | 'accessibility' | 'legal_status', readonly string[]>>>
  facts?: Readonly<Partial<Record<'bedrooms' | 'bathrooms' | 'parking' | 'year_built', readonly Phase14BrowserConstraint[]>>>
  propertyArea?: 'under-100m2' | '100-500m2' | '500-1000m2' | '1000-5000m2' | '5000m2-1-hectare' | '1-5-hectares' | 'over-5-hectares'
  constructionArea?: 'under-50m2' | '50-100m2' | '100-200m2' | '200-400m2' | '400-800m2' | '800m2-plus'
}>
export type Phase14BrowserQuestion = Readonly<{
  transaction: 'sale' | 'rent'
  geography: Readonly<{level: 'province' | 'canton' | 'district'; officialCode: string; termId: string}>
  propertyType: Readonly<{termId: string}>
  filters: Phase14BrowserFilters
}>
export type Phase14BrowserDistribution = Readonly<{
  state: 'established' | 'empty'
  minimum: number | null; p10: number | null; p25: number | null
  median: number | null; average: number | null; p75: number | null
  p90: number | null; maximum: number | null; iqr: number | null
}>
export type Phase14BrowserTail = Readonly<{
  thresholdPercentile: 10 | 90; thresholdPricePerM2: number
  differenceFromThreshold: number; percentDifferenceFromThreshold: number
  percentageReference: 'selected_population_p10' | 'selected_population_p90'
}>
export type Phase14BrowserObservation = Readonly<{
  listingId: string; pricePerM2: number
  belowCount: number; equalCount: number; aboveCount: number
  percentilePosition: number; percentileMethod: 'midrank'
  differenceFromMedian: number; percentDifferenceFromMedian: number
  percentageReference: 'selected_population_median'
  interval: 'below_p10' | 'p10_to_p25' | 'p25_to_median' | 'at_median' | 'median_to_p75' | 'p75_to_p90' | 'above_p90'
  strictTail: Phase14BrowserTail | null
}>
export type Phase14BrowserSuccess = Readonly<{
  state: 'complete'; contractVersion: 1
  question: Phase14BrowserQuestion
  transaction: 'sale' | 'rent'; normalization: 'land' | 'construction'; unit: 'CRC/m²' | 'CRC/m²/month'
  n: number; resultCount: number
  distribution: Phase14BrowserDistribution
  results: readonly Phase14BrowserObservation[]
  resultOrder: Readonly<{
    primary: 'price_per_square_meter_ascending'
    exactTieOrder: 'canonical_listing_id_ascending'
    exactTieOrderMeaning: 'transport_only'
  }>
  snapshotGuaranteed: false
}>
export type Phase14BrowserResult = Phase14BrowserSuccess | Phase14BrowserFailure
