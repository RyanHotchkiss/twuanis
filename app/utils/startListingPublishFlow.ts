import {supabase} from '@/lib/supabase'
import {
  uploadListingImages
} from '@/app/utils/uploadListingImages'

type ListingImageInput = {
  preview?: string
  file: File
  uploadedUrl?: string
}

type StartListingPublishFlowInput = {
  phone: string
  propertyData:
    Record<string, unknown> & {
      images?: ListingImageInput[]
    }
}

type CreateTokenResponse = {
  success: boolean
  token?: string
  error?: string
}

type SendPublishLinkResponse = {
  success: boolean
  error?: string
}

export async function startListingPublishFlow({
  phone,
  propertyData
}: StartListingPublishFlowInput): Promise<void> {
  const language=typeof window!=='undefined'&&window.location.pathname.startsWith('/es')?'es':'en'
  const {data:{session}}=await supabase.auth.getSession()
  if(!session)throw Error(language==='es'?'Inicie sesión antes de publicar.':'Sign in before publishing.')
  const normalizedPhone =
    phone.trim()

  if (!normalizedPhone) {
    throw new Error(
      'A WhatsApp number is required.'
    )
  }

  const sourceImages =
    Array.isArray(
      propertyData.images
    )
      ? propertyData.images
      : []

  /*
   * File objects and browser preview URLs cannot
   * be stored inside the JSON publishing record.
   */
  const listingDataWithoutFiles = {
    ...propertyData,
    images: [],
    temporary_images: []
  }

  const identityPayload=JSON.stringify({account:session.user.id,phone:normalizedPhone,data:listingDataWithoutFiles,files:sourceImages.map(image=>image instanceof File?{name:image.name,size:image.size,lastModified:image.lastModified}:image)})
  const fingerprint=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(identityPayload)))).map(b=>b.toString(16).padStart(2,'0')).join('')
  const key='tw-listing-submission:'+fingerprint
  let requestId=localStorage.getItem(key)
  if(!requestId){requestId=crypto.randomUUID();localStorage.setItem(key,requestId)}
  /*
   * Step 1:
   * Create the publishing session before upload.
   */
  const createTokenResponse =
    await fetch(
      '/api/create-publish-token',
      {
        method: 'POST',
        headers: {
          'Content-Type':
            'application/json',
          Authorization:`Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          language,
          requestId,
          phone:
            normalizedPhone,

          listingData:
            listingDataWithoutFiles
        })
      }
    )

  const createTokenResult =
    await createTokenResponse.json() as
      CreateTokenResponse

  if (
    !createTokenResponse.ok ||
    !createTokenResult.success ||
    !createTokenResult.token
  ) {
    throw new Error(
      createTokenResult.error ||
      'The secure publishing session could not be created.'
    )
  }

  const publishToken =
    createTokenResult.token

  /*
   * Step 2:
   * Optimize and upload temporary images.
   * The upload endpoint updates listing_data.
   */
  if (sourceImages.length > 0) {
    await uploadListingImages(
      sourceImages,
      publishToken
    )
  }

  /*
   * Step 3:
   * Send the already-created publishing token.
   */
  const sendLinkResponse =
    await fetch(
      '/api/send-otp',
      {
        method: 'POST',
        headers: {
          'Content-Type':
            'application/json',
          Authorization:`Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          phone:
            normalizedPhone,

          token:
            publishToken
        })
      }
    )

  const sendLinkResult =
    await sendLinkResponse.json() as
      SendPublishLinkResponse

  if (
    !sendLinkResponse.ok ||
    !sendLinkResult.success
  ) {
    throw new Error(
      sendLinkResult.error ||
      (language==='es'?'No se pudo enviar el enlace por correo.':'The publication email could not be sent.')
    )
  }
}