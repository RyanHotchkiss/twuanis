import { supabase } from '@/lib/supabase'
import { assignListingOntology } from '@/lib/assign-listing-ontology'

import {
  recordListingCreated
} from '@/lib/activity'

import {
  resolveListingGeography
} from '@/lib/geography/resolve-listing-geography'

function optionalNumber(
  value: unknown
): number | null {

  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return null
  }

  const number =
    Number(value)

  return Number.isFinite(number)
    ? number
    : null
}

function normalizeTextArray(
  value: unknown
): string[] {

  if (Array.isArray(value)) {
    return value
      .map(item =>
        String(item).trim()
      )
      .filter(item =>
        item &&
        item !== '{}' &&
        item !== '[]'
      )
  }

  if (
    value === null ||
    value === undefined
  ) {
    return []
  }

  const text =
    String(value).trim()

  if (
    !text ||
    text === '{}' ||
    text === '[]'
  ) {
    return []
  }

  return text
    .split('|')
    .map(item => item.trim())
    .filter(Boolean)
}

export async function publishRentLeaseCsvListings(
  csvListings: any[],
  setShowCsvStaging: (value: boolean) => void,
  setCsvListings: (value: any[]) => void
) {

    
 for (const listing of csvListings) {

  if (
    !listing.province &&
    !listing.canton &&
    !listing.district &&
    !listing.property_type
  ) {
    continue
  }

    const uploadedImageUrls =
      typeof listing.images === 'string'
        ? listing.images.split('|').filter(Boolean)
        : []

    const geography =
      await resolveListingGeography({
        supabase,

        province:
          listing.province,

        canton:
          listing.canton,

        district:
          listing.district
      })

      if (!geography.complete) {

        console.warn(
          'SCRAPED RENT LISTING REJECTED: unresolved canonical geography',
          {
            title:
              listing.title,

            sourceUrl:
              listing.source_url,

            source:
              geography.source,

            reasons:
              geography.reasons
          }
        )

        continue
      }

    const finalListing = {

      listing_origin:
        'scraped',

      listing_source_type:
        'realtor',

      source_url:
        listing.source_url ||
        null,

      source_name:
        listing.source_name ||
        null,

      source_listing_id:
        listing.source_listing_id ||
        null,

      province:
        geography.province?.term_name ??
        null,

      canton:
        geography.canton?.term_name ??
        null,

      district:
        geography.district?.term_name ??
        null,

      property_type:
        listing.property_type,

      bedrooms:
        listing.bedrooms,

      bathrooms:
        listing.bathrooms,

      parking:
        listing.parking,

      year_built_range:
        listing.year_built_range,

      construction_area:
        optionalNumber(
          listing.construction_area
        ),

      property_area:
        optionalNumber(
          listing.property_area
        ),

      utility:
        normalizeTextArray(
          listing.utility
        ),

      environment:
        listing.environment,

      accessibility:
        Array.isArray(
          listing.accessibility
        )
          ? listing.accessibility
              .map((value: unknown) =>
                String(value).trim()
              )
              .filter(Boolean)
              .join('|') || null
          : String(
              listing.accessibility || ''
            ).trim() || null,

      distance_to_paved_road_range:
        (
          Array.isArray(listing.accessibility)
            ? listing.accessibility.includes(
                'Unpaved Road to Property'
              )
            : listing.accessibility ===
                'Unpaved Road to Property'
        )
          ? listing.distance_to_paved_road_range || null
          : null,

      terrain:
        normalizeTextArray(
          listing.terrain
        ),

      legal_status:
        listing.legal_status,

      monthly_price:
        optionalNumber(
          listing.monthly_price
        ),

      currency:
        listing.currency,

      whatsapp:
        listing.whatsapp,

      title:
        listing.title,

      description:
        listing.description,

      images:
        uploadedImageUrls

    }

    const response = await supabase
      .from('listings')
      .insert([
        {
          ...finalListing,
          transaction_type: 'rent',
          listing_status: 'active'
        }
      ])
      .select()

console.log(
  'SUPABASE RESPONSE:',
  response
)

console.log(
  'SUPABASE ERROR:',
  response.error
)

console.log(
  'SUPABASE DATA:',
  response.data
)

    if (response.error) {

      console.error(
        JSON.stringify(response.error, null, 2)
      )

    }

    const insertedListing =
      response.data?.[0]

    if (insertedListing?.id) {

      await assignListingOntology(
        insertedListing.id,
        finalListing
      )

      try {
        await recordListingCreated({
          listingId: insertedListing.id,
          metadata: {
            title: insertedListing.title,
            location: [
              insertedListing.district,
              insertedListing.canton,
              insertedListing.province
            ]
              .filter(Boolean)
              .join(', '),
            price:
              insertedListing.monthly_price,
            source:
              'publish-rent-lease-csv-listings',
            transactionType: 'rent',
            currency:
              insertedListing.currency
          }
        })
      } catch (activityError) {
        console.error(
          'Unable to record listing creation:',
          activityError
        )
      }

    }
  }

  alert('Listings Published')

  setShowCsvStaging(false)

  setCsvListings([])

}