'use client'

type CreateListingButtonSProps = {
  onCreateListing: () => void
}

export default function CreateListingButtonS({
  onCreateListing
}: CreateListingButtonSProps) {

  return (

    <button
      onClick={onCreateListing}
      style={createListingButton}
    >
      Create Listing
    </button>

  )

}

const createListingButton = {
  width:'100%',
  background:'#00ff99',
  color:'#000',
  border:'none',
  borderRadius:'1.5rem',
  padding:'1.5rem',
  fontSize:'1.4rem',
  fontWeight:'bold',
  cursor:'pointer'
}