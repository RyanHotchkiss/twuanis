import { supabase } from '@/lib/supabase'

export async function createRentalListing(
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
    .from('rent_lease_listings')
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

        monthly_price: Number(
        String(propertyData.monthly_price)
            .replace(/[^\d]/g, '')
        ),

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

  if (response.error) {

    console.error(
      JSON.stringify(response.error, null, 2)
    )

    alert('SUPABASE ERROR')

    return

  }

  console.log(response.data)

  alert('Listing Created Successfully')

}