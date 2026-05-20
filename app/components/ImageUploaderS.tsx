'use client'

type ImageUploaderSProps = {
  handleImageUpload: (
    event: React.ChangeEvent<HTMLInputElement>
  ) => void
}

export default function ImageUploaderS({
  handleImageUpload
}: ImageUploaderSProps) {

  return (

    <div>

      <h2 style={sectionHeading}>
        Property Images
      </h2>

      <label
        style={{
          ...uploadBox,
          display:'flex',
          flexDirection:'column',
          alignItems:'center',
          justifyContent:'center',
          width:'100%'
        }}
      >

        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageUpload}
          style={{
            display:'none'
          }}
        />

        <div>
          Tap or Click to Upload Images
        </div>

      </label>

    </div>

  )

}

const sectionHeading = {
  fontSize:'1rem',
  marginBottom:'1rem',
  color:'#ff3b00'
}

const uploadBox = {
  background:'#111',
  border:'2px dashed #333',
  borderRadius:'1.5rem',
  padding:'3rem 2rem',
  cursor:'pointer',
  textAlign:'center' as const,
  color:'#888',
  transition:'all .2s ease'
}