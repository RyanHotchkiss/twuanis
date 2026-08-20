import type {
  SupabaseClient
} from '@supabase/supabase-js'

import {
  resolveCanonicalGeography,
  type CanonicalGeographyTerm,
  type CanonicalGeographyResolution
} from '@/lib/geography/canonical-geography'

function resolveSourceValue(
  value: unknown
): string | null {

  if (
    typeof value !==
      'string'
  ) {
    return null
  }


  const normalized =
    value.trim()


  return normalized ||
    null
}

export async function resolveListingGeography({
  supabase,
  province,
  canton,
  district
}: {
  supabase:
    SupabaseClient

  province?:
    unknown

  canton?:
    unknown

  district?:
    unknown

}): Promise<CanonicalGeographyResolution> {

  const {
    data,
    error
  } =
    await supabase
      .from(
        'ontology_terms'
      )
      .select(`
        id,
        parent_id,
        term_type,
        term_name,
        term_name_en,
        term_name_es,
        slug,
        slug_en,
        slug_es,
        official_code
      `)
      .in(
        'term_type',
        [
          'province',
          'canton',
          'district'
        ]
      )


  if (error) {
    throw error
  }


  const terms =
    (
      data ??
      []
    ) as CanonicalGeographyTerm[]


  return resolveCanonicalGeography({
    province:
      resolveSourceValue(
        province
      ),

    canton:
      resolveSourceValue(
        canton
      ),

    district:
      resolveSourceValue(
        district
      ),

    terms
  })
}