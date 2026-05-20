'use client'

type CsvListingImageUploaderProps = {
  listing: any
  index: number
  csvListings: any[]
  setCsvListings: (value: any[]) => void
}

export default function CsvListingImageUploader({
  listing,
  index,
  csvListings,
  setCsvListings
}: CsvListingImageUploaderProps) {

  return (

    <label style={uploadButton}>

      <input
        type="file"
        multiple
        accept="image/*"
        style={{ display:'none' }}

        onChange={(e) => {

          const files = e.target.files

          if (!files) return

          const uploadedFiles =
            Array.from(files)

          const updatedListings =
            [...csvListings]

          const imageObjects =
            uploadedFiles.map(file => ({
              preview:
                URL.createObjectURL(file),
              file,
              uploadedUrl:''
            }))

          updatedListings[index].images = [
            ...updatedListings[index].images,
            ...imageObjects
          ]

          setCsvListings(updatedListings)

        }}
      />

      Upload Images

    </label>

  )

}

const uploadButton = {
  display:'inline-flex',
  alignItems:'center',
  justifyContent:'center',
  background:'#00ff99',
  color:'#000',
  borderRadius:'999px',
  padding:'.85rem 1.25rem',
  cursor:'pointer',
  fontWeight:'bold',
  width:'100%'
}