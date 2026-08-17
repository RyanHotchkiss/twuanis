import { supabase } from '@/lib/supabase'
import { assignListingOntology } from '@/lib/assign-listing-ontology'

import {
  recordListingCreated
} from '@/lib/activity'

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

  console.log(
    'RENT CSV RECORD:',
    listing,
    'MONTHLY:',
    listing.monthly_price
  )
  
    console.log(
        'RENT CSV RECORD:',
        listing,
        'MONTHLY:',
        listing.monthly_price
)

    const uploadedImageUrls =
  typeof listing.images === 'string'
    ? listing.images.split('|').filter(Boolean)
    : []

console.log(
  'CSV IMAGE FIELD:',
  listing.images
)

    const finalListing = {

      province: listing.province,
      canton: listing.canton,
      district: listing.district,

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
        listing.construction_area,

      property_area:
        listing.property_area,

      utility:
        listing.utility || [],

      environment:
        listing.environment,

      accessibility:
        listing.accessibility || [],

      terrain:
        listing.terrain || [],

      legal_status:
        listing.legal_status,

      monthly_price:
        Number(listing.monthly_price),

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

console.log(
  'FINAL LISTING:',
  finalListing
)

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