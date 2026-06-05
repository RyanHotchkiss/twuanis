
import { supabase } from '@/lib/supabase'
import { createListingId } from '@/lib/createListingId'

export type EntityType =
  | 'country'
  | 'province'
  | 'canton'
  | 'district'
  | 'property_type'
  | 'bedrooms'
  | 'bathrooms'
  | 'parking'
  | 'year_built'
  | 'construction_area'
  | 'property_area'
  | 'utility'
  | 'environment'
  | 'accessibility'
  | 'terrain'
  | 'legal_status'

export async function getEntity(
  entityType: EntityType,
  slug: string
) {
  const cleanSlug = decodeURIComponent(slug)

  const { data: entity, error: entityError } = await supabase
    .from('ontology_terms')
    .select('*')
    .eq('term_type', entityType)
    .or(`slug.eq.${cleanSlug},slug_en.eq.${cleanSlug},slug_es.eq.${cleanSlug}`)
    .maybeSingle()

  if (entityError) {
        console.error(
            'ENTITY ERROR:',
            JSON.stringify(entityError, null, 2)
        )

        throw entityError
        }

  if (!entity) {

        console.log(
            'ENTITY NOT FOUND:',
            entityType,
            slug
        )

        return null

        }

  let parentEntity = null

        if (entity?.parent_id) {

        const { data } = await supabase
            .from('ontology_terms')
            .select('*')
            .eq('id', entity.parent_id)
            .maybeSingle()

        parentEntity = data

        }

  const { data: childEntities } = await supabase
    .from('ontology_terms')
    .select('*')
    .eq('parent_id', entity.id)
    .order('term_name', { ascending: true })

  const { data: listingEdges } = await supabase
    .from('listings_ontology_terms')
    .select('listing_id')
    .eq('ontology_term_id', entity.id)

  const listingIds =
    listingEdges?.map((edge) => edge.listing_id) || []

  let listings: any[] = []

  if (listingIds.length > 0) {
    const { data: listingData } = await supabase
      .from('listings')
      .select('*')
      .in('id', listingIds)
      .order('id', { ascending: false })

    listings =
      listingData?.map((listing: any) => ({
        ...listing,
        id: createListingId(listing),
        images:
          Array.isArray(listing.images)
            ? listing.images
            : typeof listing.images === 'string'
            ? listing.images
                .split('|')
                .map((img: string) => img.trim())
                .filter(Boolean)
            : []
      })) || []
  }

  let relatedEntities: any[] = []

  if (listingIds.length > 0) {
    const { data: relatedEdges } = await supabase
      .from('listings_ontology_terms')
      .select('ontology_term_id')
      .in('listing_id', listingIds)

    const relatedIds = Array.from(
      new Set(
        relatedEdges
          ?.map((edge) => edge.ontology_term_id)
          .filter((id) => id !== entity.id) || []
      )
    )

    if (relatedIds.length > 0) {
      const { data: relatedTerms } = await supabase
        .from('ontology_terms')
        .select('*')
        .in('id', relatedIds)
        .order('term_type', { ascending: true })

      relatedEntities = relatedTerms || []
    }
  }

  return {
    entity,
    parentEntity,
    childEntities: childEntities || [],
    relatedEntities,
    listings,
    listingCount: listings.length
  }
}
