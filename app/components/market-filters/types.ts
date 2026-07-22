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
      id?: string
      parent_id?: string
      slug?: string
      slug_en?: string
      slug_es?: string
      term_name?: string
      term_name_en?: string
      term_name_es?: string
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