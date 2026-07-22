import { supabase } from '@/lib/supabase'
import {
  assignListingOntology
} from '@/lib/assign-listing-ontology'

import {
  recordListingCreated
} from '@/lib/activity'

export async function createListing(
  propertyData: any,
  generateListingTitle: (data: any) => string,
  generateListingDescription: (data: any) => string
) {

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

  const response = await supabase
    .from('listings')
    .insert([

      {
        province: propertyData.province,
        canton: propertyData.canton,
        district: propertyData.district,

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