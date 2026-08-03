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
            'application/json'
        },
        body: JSON.stringify({
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
            'application/json'
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
      'The WhatsApp publishing link could not be sent.'
    )
  }
}