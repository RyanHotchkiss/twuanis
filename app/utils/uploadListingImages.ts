import { supabase } from '@/lib/supabase'

export async function uploadListingImages(
  images: {
    file: File
  }[]
) {

  const uploadedImageUrls: string[] = []

  for (const image of images) {

    const fileName =
      `${Date.now()}-${image.file.name}`

    const { error } = await supabase
      .storage
      .from('listings-images')
      .upload(
        fileName,
        image.file
      )

    if (error) {

      console.error(
        'IMAGE UPLOAD ERROR:',
        JSON.stringify(
          error,
          null,
          2
        )
      )

      continue

    }

    const { data } = supabase
      .storage
      .from('listings-images')
      .getPublicUrl(fileName)

    uploadedImageUrls.push(
      data.publicUrl
    )

  }

  return uploadedImageUrls

}