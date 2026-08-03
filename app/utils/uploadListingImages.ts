import {
  optimizeListingImage
} from '@/app/utils/optimizeListingImage'

type ListingImageInput = {
  file: File
}

type TemporaryUploadResponse = {
  success: boolean
  path?: string
  imageCount?: number
  error?: string
}

export async function uploadListingImages(
  images: ListingImageInput[],
  publishToken: string
): Promise<string[]> {
  if (!publishToken) {
    throw new Error(
      'A publish token is required before uploading images.'
    )
  }

  if (images.length > 25) {
    throw new Error(
      'A listing may contain no more than 25 images.'
    )
  }

  const uploadedPaths:
    string[] = []

  for (const image of images) {
    const optimizedImage =
      await optimizeListingImage(
        image.file
      )

    const formData =
      new FormData()

    formData.append(
      'token',
      publishToken
    )

    formData.append(
      'image',
      optimizedImage
    )

    const response =
      await fetch(
        '/api/upload-temporary-listing-image',
        {
          method: 'POST',
          body:
            formData
        }
      )

    const result =
      await response.json() as
        TemporaryUploadResponse

    if (
      !response.ok ||
      !result.success ||
      !result.path
    ) {
      throw new Error(
        result.error ||
        `${image.file.name} could not be uploaded.`
      )
    }

    uploadedPaths.push(
      result.path
    )
  }

  return uploadedPaths
}