export type Language = 'en' | 'es'
export type Prefix = '' | 'a_' | 'b_'
export type FilterMode = 'single' | 'comparison'

export type Filters = Record<
  string,
  string | undefined
>

export type FilterOption =
  | string
  | {
      id?: number
      parent_id?: number | null
      slug?: string
      slug_en?: string | null
      slug_es?: string | null
      term_name?: string
      term_name_en?: string | null
      term_name_es?: string | null
    }

export type ExplorerOptions = {
  province?: FilterOption[]
  canton?: FilterOption[]
  district?: FilterOption[]
  property_type?: FilterOption[]
  bedrooms?: FilterOption[]
  bathrooms?: FilterOption[]
  parking?: FilterOption[]
  property_area?: FilterOption[]
  construction_area?: FilterOption[]
  year_built?: FilterOption[]
  environment?: FilterOption[]
  terrain?: FilterOption[]
  utility?: FilterOption[]
  accessibility?: FilterOption[]
  legal_status?: FilterOption[]
}

export type MarketFiltersProps = {
  options: ExplorerOptions
  filters: Filters
  basePath?: string
  mode?: FilterMode
  language?: Language
}