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

export async function createListing(
  propertyData: any,
  generateListingTitle: (data: any) => string,
  generateListingDescription: (data: any) => string
) {

  const {
  data: {
    user
  },
  error: userError
} = await supabase.auth.getUser()

if (
  userError ||
  !user
) {
  throw new Error(
    'You must be signed in to publish a listing.'
  )
}

  const uploadedImageUrls = []

  for (const image of propertyData.images) {

    const fileName =
      `${Date.now()}-${image.file.name}`

    const { error: uploadError } = await supabase
      .storage
      .from('listings-images')
      .upload(fileName, image.file)

    if (uploadError) {

      console.error(
        JSON.stringify(uploadError, null, 2)
      )

      continue

    }

    const publicUrlResponse = supabase
      .storage
      .from('listings-images')
      .getPublicUrl(fileName)

    uploadedImageUrls.push(
      publicUrlResponse.data.publicUrl
    )

  }

  const geography =
  await resolveListingGeography({
    supabase,

    province:
      propertyData.province,

    canton:
      propertyData.canton,

    district:
      propertyData.district
  })

  if (!geography.complete) {

    console.error(
      'CUSTOMER SALE LISTING REJECTED: unresolved canonical geography',
      {
        province:
          propertyData.province,

        canton:
          propertyData.canton,

        district:
          propertyData.district,

        source:
          geography.source,

        reasons:
          geography.reasons
      }
    )

    throw new Error(
      'A listing requires a valid Province, Canton, and District before it can be published.'
    )
  }

  const response = await supabase
    .from('listings')
    .insert([
      {

        owner_id:
        user.id,
        listing_origin:
          'customer',
        listing_source_type:
          'customer',

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
          propertyData.property_type || '',

        bedrooms: propertyData.bedrooms,
        bathrooms: propertyData.bathrooms,
        parking: propertyData.parking,
        year_built_range:
          propertyData.year_built_range,
        construction_area:
          propertyData.construction_area,

        utility: propertyData.utility || [],

        property_area:
          propertyData.property_area,

        environment:
          propertyData.environment,

        accessibility:
          propertyData.accessibility,

        terrain:
          propertyData.terrain || [],

        legal_status:
          propertyData.legal_status,

        price_millions:
          propertyData.priceMillions,

        whatsapp:
          propertyData.whatsapp,

        title:
          generateListingTitle(propertyData),

        description:
          generateListingDescription(
            propertyData
          ),
        images: uploadedImageUrls
      }
    ])
.select()

    console.log(

        'FULL INSERT RESPONSE:',

        JSON.stringify(response, null, 2)

      )

  if (response.error) {

    console.error(
      JSON.stringify(response.error, null, 2)
    )

    alert('SUPABASE ERROR')

    return

  }

const insertedListing =
  response.data?.[0]

if (insertedListing?.id) {
  console.log(
    'CREATE LISTING CALLING ASSIGN ONTOLOGY'
  )

  await assignListingOntology(
    insertedListing.id,
    {
      ...propertyData,

      province:
        geography.province?.term_name ??
        null,

      canton:
        geography.canton?.term_name ??
        null,

      district:
        geography.district?.term_name ??
        null,

      price_millions:
        propertyData.priceMillions
    }
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
        source: 'create-listing',
        transactionType: 'sale'
      }
    })
  } catch (activityError) {
    console.error(
      'Unable to record listing creation:',
      activityError
    )
  }
}

console.log(response.data)

alert('Listing Created Successfully')

}