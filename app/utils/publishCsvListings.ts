import { supabase } from '@/lib/supabase'

export async function publishCsvListings(
  csvListings: any[],
  setShowCsvStaging: (value: boolean) => void,
  setCsvListings: (value: any[]) => void
) {

  for (const listing of csvListings) {

    const uploadedImageUrls = []

    if (listing.images?.length) {

      for (const image of listing.images) {

        const file = image.file

        const fileName =
          `${Date.now()}-${file.name}`

        const {
          data,
          error
        } = await supabase
          .storage
          .from('listings-images')
          .upload(fileName, file)

        console.log(data)
        console.log(error)

        if (error) {

          console.error(
            JSON.stringify(error, null, 2)
          )

          continue

        }

        const {
          data: publicUrlData
        } = supabase
          .storage
          .from('listings-images')
          .getPublicUrl(fileName)

        uploadedImageUrls.push(
          publicUrlData.publicUrl
        )

      }

    }

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

      price_millions:
        Number(listing.price_millions),

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
      .insert([finalListing])

    if (response.error) {

      console.error(
        JSON.stringify(response.error, null, 2)
      )

    }

  }

  alert('Listings Published')

  setShowCsvStaging(false)

  setCsvListings([])

}