import { supabase } from '@/lib/supabase'
import {
  assignListingOntology
} from '@/lib/assign-listing-ontology'

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

export async function publishCsvListings(
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

console.log(
  'IMAGE STRING LENGTH:',
  listing.images?.length
)

const uploadedImageUrls =
  typeof listing.images === 'string'
    ? listing.images
        .split('|')
        .filter((url: string) =>
          url.includes(
            'photos.encuentra24.com'
          )
        )
    : [] 

console.log(
  'FINAL IMAGE URLS:',
  uploadedImageUrls
)

console.log(
  'IMAGE COUNT:',
  uploadedImageUrls.length
)

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
        'SCRAPED SALE LISTING REJECTED: unresolved canonical geography',
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

      property_area:
        optionalNumber(
          listing.property_area
        ),

      construction_area:
        optionalNumber(
          listing.construction_area
        ),

      utility:
        listing.utility || [],

      environment:
        listing.environment,

      accessibility:
        listing.accessibility || [],

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
        listing.terrain || [],

      legal_status:
        listing.legal_status,

      price_millions:
        optionalNumber(
          listing.price_millions
        ),

      whatsapp:
        listing.whatsapp,

      title:
        listing.title,

      description:
        listing.description,

      images:
        uploadedImageUrls

    }

console.log(
  'GEOGRAPHY RESOLUTION:',
  {
    source:
      geography.source,

    resolved: {
      province:
        geography.province?.term_name ??
        null,

      canton:
        geography.canton?.term_name ??
        null,

      district:
        geography.district?.term_name ??
        null
    },

    reasons:
      geography.reasons
  }
)

  const response = await supabase
    .from('listings')
    .insert([finalListing])
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

console.log(
  'IMAGES:',
  listing.images
)

        const insertedListing =
      response.data?.[0]

    if (insertedListing?.id) {
      console.log(
        'ABOUT TO CALL ASSIGN ONTOLOGY',
        insertedListing.id
      )

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
              insertedListing.price_millions,
            source:
              'publish-csv-listings',
            transactionType:
              'sale'
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