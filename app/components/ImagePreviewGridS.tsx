'use client'

type ImageObject = {
  preview: string
  file: File
  uploadedUrl: string
}

type ImagePreviewGridSProps = {
  images: ImageObject[]
  removeImage: (index: number) => void
}

export default function ImagePreviewGridS({
  images,
  removeImage
}: ImagePreviewGridSProps) {

  if (images.length === 0) {
    return null
  }

  return (

    <div style={imageGrid}>

      {images.map((image, imageIndex) => (

        <div
          key={imageIndex}
          style={imageCard}
        >

          <img
            src={image.preview}
            alt={`Upload ${imageIndex}`}
            style={previewImage}
          />

          <button
            onClick={() =>
              removeImage(imageIndex)
            }
            style={removeImageButton}
          >
            ✕
          </button>

        </div>

      ))}

    </div>

  )

}

const imageGrid = {
  display:'grid',
  gridTemplateColumns:'repeat(3,1fr)',
  gap:'1rem',
  marginTop:'1.5rem'
}

const imageCard = {
  position:'relative' as const
}

const previewImage = {
  width:'100%',
  aspectRatio:'4 / 3',
  objectFit:'cover' as const,
  borderRadius:'1rem',
  border:'1px solid #222'
}

const removeImageButton = {
  position:'absolute' as const,
  top:'.5rem',
  right:'.5rem',
  background:'#ff4444',
  border:'none',
  color:'#fff',
  width:'2rem',
  height:'2rem',
  borderRadius:'999rem',
  cursor:'pointer',
  fontWeight:'bold'
}