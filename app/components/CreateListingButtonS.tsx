'use client'

type CreateListingButtonSProps = {
  onCreateListing: () => void
}

export default function CreateListingButtonS({
  onCreateListing
}: CreateListingButtonSProps) {

  return (

  <button
  className="create-listing-button"
  onClick={onCreateListing}
  style={createListingButton}
  >

    <svg
      width="30"
      height="30"
      className="create-listing-icon"
      viewBox="0 0 230 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >

        <polygon
          points="20,60 32,54 32,66"
          fill="#D4AF37"
        />

        <polygon
          points="45,48 75,40 75,80 45,72"
          fill="#D4AF37"
        />

        <polygon
          points="85,36 125,22 125,98 85,84"
          fill="#D4AF37"
        />

        <polygon
          points="135,22 185,4 185,116 135,98"
          fill="#D4AF37"
        />

        <line
          x1="198"
          y1="26"
          x2="214"
          y2="18"
          stroke="#D4AF37"
          strokeWidth="10"
          strokeLinecap="round"
        />

        <line
          x1="202"
          y1="60"
          x2="218"
          y2="60"
          stroke="#D4AF37"
          strokeWidth="10"
          strokeLinecap="round"
        />

        <line
          x1="198"
          y1="94"
          x2="214"
          y2="102"
          stroke="#D4AF37"
          strokeWidth="10"
          strokeLinecap="round"
        />

      </svg>

  </button>

)

}

const createListingButton = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  background: '#ffffff00',
  border: 'none',
  borderRadius: '999px',
  padding: '5px',
  marginTop: '12px',
  cursor: 'pointer'
}