import { supabase } from '@/lib/supabase'
import { unstable_cache } from 'next/cache'

export type ExplorerOption = {
  id: number
  term_type: string
  term_name: string
  term_name_en: string | null
  term_name_es: string | null
  slug: string
  slug_en: string | null
  slug_es: string | null
  official_code: string | null
  parent_id: number | null
  level: number | null
}

const EXPLORER_TERM_TYPES = [
  'province',
  'canton',
  'district',
  'property_type',
  'bedrooms',
  'bathrooms',
  'parking',
  'year_built',
  'property_area',
  'construction_area',
  'utility',
  'environment',
  'terrain',
  'accessibility',
  'legal_status'
]

async function loadExplorerOptions() {
  const { data, error } = await supabase
    .from('ontology_terms')
    .select(`
      id,
      term_type,
      term_name,
      term_name_en,
      term_name_es,
      slug,
      slug_en,
      slug_es,
      official_code,
      parent_id,
      level
    `)
    .in('term_type', EXPLORER_TERM_TYPES)
    .order('term_type')
    .order('term_name')

  if (error) throw error

  const grouped = {
    province: [] as ExplorerOption[],
    canton: [] as ExplorerOption[],
    district: [] as ExplorerOption[],
    property_type: [] as ExplorerOption[],
    bedrooms: [] as ExplorerOption[],
    bathrooms: [] as ExplorerOption[],
    parking: [] as ExplorerOption[],
    year_built: [] as ExplorerOption[],
    property_area: [] as ExplorerOption[],
    construction_area: [] as ExplorerOption[],
    utility: [] as ExplorerOption[],
    environment: [] as ExplorerOption[],
    terrain: [] as ExplorerOption[],
    accessibility: [] as ExplorerOption[],
    legal_status: [] as ExplorerOption[]
  }

  for (const option of data || []) {
    const type = option.term_type as keyof typeof grouped

    if (grouped[type]) {
      grouped[type].push(option)
    }
  }

  return grouped
}

export const getExplorerOptions = unstable_cache(
  loadExplorerOptions,
  ['explorer-options'],
  {
    revalidate: 86400,
    tags: ['explorer-options']
  }
)