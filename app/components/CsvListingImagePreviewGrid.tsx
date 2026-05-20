'use client'

type CsvListingImagePreviewGridProps = {
  listing: any
}

export default function CsvListingImagePreviewGrid({
  listing
}: CsvListingImagePreviewGridProps) {

  if (listing.images.length === 0) {
    return null
  }

  return (

    <div style={grid}>

      {listing.images.map((
        image: {
          preview: string
          file: File
          uploadedUrl: string
        },
        imageIndex: number
      ) => (

        <img
          key={imageIndex}
          src={image.preview}
          alt=""
          style={imageStyle}
        />

      ))}

    </div>

  )

}

const grid = {
  display:'grid',
  gridTemplateColumns:'repeat(3,1fr)',
  gap:'.75rem',
  marginTop:'1.5rem'
}

const imageStyle = {
  width:'100%',
  aspectRatio:'4 / 3',
  objectFit:'cover' as const,
  borderRadius:'.75rem',
  border:'1px solid #222'
}