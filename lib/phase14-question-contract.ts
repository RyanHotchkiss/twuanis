// Browser-safe input types only. These types confer no canonical authority.
export type Phase14GeographyLevel = 'province' | 'canton' | 'district'
export type Phase14FactDimension = 'bedrooms' | 'bathrooms' | 'parking' | 'year_built'
export type Phase14SemanticDimension = 'environment' | 'terrain' | 'utility' | 'accessibility' | 'legal_status'
export type Phase14Interval = Readonly<{
  lower: string | null; upper: string | null
  lowerInclusive: boolean; upperInclusive: boolean
}>
export type Phase14FactConstraint =
  | Readonly<{ kind: 'exact'; value: string }>
  | Readonly<{ kind: 'category'; termId: string }>
  | Readonly<{ kind: 'interval'; interval: Phase14Interval }>
export type Phase14PropertyAreaKey = 'under-100m2' | '100-500m2' | '500-1000m2' | '1000-5000m2' | '5000m2-1-hectare' | '1-5-hectares' | 'over-5-hectares'
export type Phase14ConstructionAreaKey = 'under-50m2' | '50-100m2' | '100-200m2' | '200-400m2' | '400-800m2' | '800m2-plus'
export type Phase14Filters = Readonly<{
  semantics?: Readonly<Partial<Record<Phase14SemanticDimension, readonly string[]>>>
  facts?: Readonly<Partial<Record<Phase14FactDimension, readonly Phase14FactConstraint[]>>>
  propertyArea?: Phase14PropertyAreaKey
  constructionArea?: Phase14ConstructionAreaKey
}>
export type Phase14QuestionInput = Readonly<{
  version: 1
  transaction: 'sale' | 'rent'
  geography:
    | Readonly<{ level: 'province'; officialCode: string }>
    | Readonly<{ level: 'canton'; officialCode: string }>
    | Readonly<{ level: 'district'; officialCode: string }>
  propertyType: Readonly<{ termId: string }>
  filters?: Phase14Filters
}>
export type Phase14CommitInput = Readonly<{
  question: Phase14QuestionInput
  ancestorAssertions?: Readonly<{ provinceCode?: string; cantonCode?: string }>
}>
