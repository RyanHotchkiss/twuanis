const MAX_SOURCE_IMAGE_BYTES =
  25 * 1024 * 1024

const MAX_IMAGE_DIMENSION =
  1800

const JPEG_QUALITY =
  0.82

const SUPPORTED_IMAGE_TYPES =
  new Set([
    'image/jpeg',
    'image/png',
    'image/webp'
  ])

export const MAX_OPTIMIZED_IMAGE_BYTES =
  600 * 1024

export async function optimizeListingImage(
  sourceFile: File
): Promise<File> {
  if (
    !SUPPORTED_IMAGE_TYPES.has(
      sourceFile.type
    )
  ) {
    throw new Error(
      `${sourceFile.name} must be a JPEG, PNG, or WebP image.`
    )
  }

  if (
    sourceFile.size >
    MAX_SOURCE_IMAGE_BYTES
  ) {
    throw new Error(
      `${sourceFile.name} exceeds the 25 MB source-image limit.`
    )
  }

  const bitmap =
    await createImageBitmap(
      sourceFile
    )

  const scale =
    Math.min(
      1,
      MAX_IMAGE_DIMENSION /
        Math.max(
          bitmap.width,
          bitmap.height
        )
    )

  const outputWidth =
    Math.max(
      1,
      Math.round(
        bitmap.width * scale
      )
    )

  const outputHeight =
    Math.max(
      1,
      Math.round(
        bitmap.height * scale
      )
    )

  const canvas =
    document.createElement(
      'canvas'
    )

  canvas.width =
    outputWidth

  canvas.height =
    outputHeight

  const context =
    canvas.getContext('2d')

  if (!context) {
    bitmap.close()

    throw new Error(
      'The image could not be processed.'
    )
  }

  context.drawImage(
    bitmap,
    0,
    0,
    outputWidth,
    outputHeight
  )

  bitmap.close()

  const blob =
    await new Promise<Blob>(
      (
        resolve,
        reject
      ) => {
        canvas.toBlob(
          result => {
            if (!result) {
              reject(
                new Error(
                  'The image could not be compressed.'
                )
              )

              return
            }

            resolve(result)
          },
          'image/jpeg',
          JPEG_QUALITY
        )
      }
    )

  if (
    blob.size >
    MAX_OPTIMIZED_IMAGE_BYTES
  ) {
    throw new Error(
      `${sourceFile.name} could not be reduced below 600 KB.`
    )
  }

  const optimizedName =
    `${crypto.randomUUID()}.jpg`

  return new File(
    [blob],
    optimizedName,
    {
      type: 'image/jpeg',
      lastModified:
        Date.now()
    }
  )
}