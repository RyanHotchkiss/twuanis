import { supabase } from '@/lib/supabase'
import { assignListingOntology } from '@/lib/assign-listing-ontology'

function generateFallbackTitle(data: any) {
  const environment = data.environment || ''
  const propertyType = data.property_type || 'property'
  const district = data.district || ''
  const canton = data.canton || ''

  return `${environment} ${propertyType} in ${district} ${canton}`.trim()
}

function generateFallbackDescription(data: any) {
  return `This property is located in ${
    data.district ||
    data.canton ||
    data.province ||
    'Costa Rica'
  }.`
}

export default async function PublishPage({
  params
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params

  const { data: tokenData } = await supabase
    .from('listing_publish_tokens')
    .select('*')
    .eq('token', token)
    .single()

  if (!tokenData) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center' }}>
        <h1>Invalid token</h1>
        <p>This publish link is invalid or expired.</p>
      </div>
    )
  }

  if (tokenData.verified) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center' }}>
        <h1>Listing Already Published</h1>
        <p>This listing has already been verified.</p>
      </div>
    )
  }

  const propertyData = tokenData.listing_data

  const { data: listingData, error: listingError } = await supabase
    .from('listings')
    .insert([
      {
        province: propertyData.province,
        canton: propertyData.canton,
        district: propertyData.district,

        property_type: propertyData.property_type || '',

        bedrooms: propertyData.bedrooms,
        bathrooms: propertyData.bathrooms,
        parking: propertyData.parking,

        year_built_range: propertyData.year_built_range,
        construction_area: propertyData.construction_area,

        utility: propertyData.utility || [],
        property_area: propertyData.property_area,

        environment: propertyData.environment,
        accessibility: propertyData.accessibility,

        terrain: propertyData.terrain || [],
        legal_status: propertyData.legal_status,

        price_millions: propertyData.priceMillions,

        whatsapp: tokenData.phone,

        title:
          propertyData.title ||
          generateFallbackTitle(propertyData),

        description:
          propertyData.description ||
          generateFallbackDescription(propertyData),

        images:
          propertyData.uploadedImageUrls ||
          propertyData.images ||
          []
      }
    ])
    .select()
    .single()

  if (listingError || !listingData) {
    console.error(
      'LISTING PUBLISH ERROR:',
      listingError
    )

    return (
      <div style={{ padding: '3rem', textAlign: 'center' }}>
        <h1>Publishing Error</h1>
        <p>Your listing could not be published.</p>
      </div>
    )
  }

  await assignListingOntology(
    listingData.id,
    {
      ...propertyData,
      price_millions: propertyData.priceMillions
    }
  )

  await supabase
    .from('listing_publish_tokens')
    .update({
      verified: true
    })
    .eq('token', token)

  return (
    <div
      style={{
        padding: '3rem',
        textAlign: 'center'
      }}
    >
      <h1>Listing Published</h1>

      <p>
        Your listing has been published successfully on Twuanis.
      </p>
    </div>
  )
}