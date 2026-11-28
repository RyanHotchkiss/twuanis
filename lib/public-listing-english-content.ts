
import 'server-only'

import { supabaseAdmin } from '@/lib/supabase-admin'
import {
  generatePublicListingTitle,
  generatePublicListingDescription
} from '@/lib/public-listing-content-generator'

import {
  resolveListingOriginalMonetaryValue,
  type ListingMonetaryInput
} from '@/lib/listing-monetary-value'
import type { CanonicalEvidence } from '@/lib/canonical-listing-reader'

type EnglishPresentationListing = ListingMonetaryInput & {
  id: string
  owner_id?: string | null
  listing_origin?: string | null
  listing_source_type?: string | null
  source_name?: string | null
  source_listing_id?: string | null
  canonical_domain_version?: number | null
  title?: string | null
  description?: string | null
  province?: string | null
  canton?: string | null
  district?: string | null
  property_type?: string | null
  property_area?: string | number | null
  construction_area?: string | number | null
  canonicalEvidence?: CanonicalEvidence
}

export async function resolveSpanishListingContent<
  T extends EnglishPresentationListing
>(listing: T): Promise<T> {
  return resolveCanonicalListingContent(listing, 'es')
}

export async function resolveEnglishListingContent<
  T extends EnglishPresentationListing
>(listing: T): Promise<T> {
  return resolveCanonicalListingContent(listing, 'en')
}

async function resolveCanonicalListingContent<
  T extends EnglishPresentationListing
>(listing: T, language: 'en' | 'es'): Promise<T> {
  // Preserve existing presentation for non-imported listings.
  if (
    listing.listing_origin !== 'imported' ||
    listing.canonical_domain_version !== 1 ||
    !listing.source_name?.trim() ||
    !listing.source_listing_id?.trim()
  ) {
    return listing
  }

  const evidence = listing.canonicalEvidence

  if (!evidence || evidence.listing_id !== listing.id) {
    throw new Error('Canonical English presentation evidence is unavailable.')
  }

  const propertyType = evidence.selections.find(
    term => term.dimension === 'property_type'
  )

  if (!propertyType) {
    throw new Error('Canonical English property type is missing.')
  }

  const semanticIds = [
    ...new Set(evidence.selections.map(term => term.ontology_term_id))
  ]

  const { data, error } = await supabaseAdmin
    .from('ontology_terms')
    .select('id,term_type,term_name_en,term_name_es')
    .in('id', semanticIds)

  if (error || !data || data.length !== semanticIds.length) {
    throw new Error('Canonical English ontology labels could not be resolved.')
  }

  const englishLabels = new Map<string, string>()

  for (const term of data) {
    if (
      typeof term[language === 'en' ? 'term_name_en' : 'term_name_es'] !== 'string' ||
      !term[language === 'en' ? 'term_name_en' : 'term_name_es']?.trim()
    ) {
      throw new Error('A canonical English ontology label is missing.')
    }

    englishLabels.set(
      String(term.id),
      (language === 'en' ? term.term_name_en : term.term_name_es)!.trim()
    )
  }

  const labelsFor = (dimension: string): string[] => {
    const selections = evidence.selections.filter(
      term => term.dimension === dimension
    )

    return selections.map(term => {
      if (term.term_type !== dimension) {
        throw new Error('Canonical semantic dimension mismatch.')
      }

      const label = englishLabels.get(term.ontology_term_id)

      if (!label) {
        throw new Error('Canonical English semantic label is missing.')
      }

      return label
    })
  }

  const geography = (dimension: 'province' | 'canton' | 'district') =>
    evidence.geography.find(term => term.term_type === dimension)

  const province = geography('province')
  const canton = geography('canton')
  const district = geography('district')

  const geographicLabel = (
    term: typeof province
  ): string | undefined =>
    (language === 'es' ? term?.term_name_es : term?.term_name_en) ?? undefined

  if (
    !geographicLabel(province) ||
    !geographicLabel(canton) ||
    (district && !geographicLabel(district))
  ) {
    throw new Error('Canonical geographic labels are incomplete.')
  }

  const exactFact = (dimension: string): string | undefined => {
    const fact = evidence.facts.find(item => item.dimension === dimension)

    return fact?.kind === 'exact'
      ? fact.exact_value ?? undefined
      : undefined
  }

  const monetaryValue =
    resolveListingOriginalMonetaryValue(listing)

  const propertyData = {
    transaction_type: listing.transaction_type,
    asking_price: monetaryValue?.amount,
    currency: monetaryValue?.currency,
    property_type: englishLabels.get(propertyType.ontology_term_id),
    province: geographicLabel(province),
    canton: geographicLabel(canton),
    district: geographicLabel(district) ?? '',

    property_area: listing.property_area ?? undefined,
    construction_area: listing.construction_area ?? undefined,

    bedrooms: exactFact('bedrooms'),
    bathrooms: exactFact('bathrooms'),
    parking: exactFact('parking'),
    year_built: exactFact('year_built'),

    utility: labelsFor('utility'),
    environment: labelsFor('environment'),
    terrain: labelsFor('terrain'),
    accessibility: labelsFor('accessibility'),
    legal_status: labelsFor('legal_status')
  }

  const title = generatePublicListingTitle(propertyData, language)
  const description = generatePublicListingDescription(propertyData, language)

  if (!title.trim() || !description.trim()) {
    throw new Error('English listing content generation returned empty content.')
  }

  return {
    ...listing,
    title,
    description
  } as T
}