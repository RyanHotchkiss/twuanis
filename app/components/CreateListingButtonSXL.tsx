'use client'

type CreateListingButtonSXLProps = {
  onCreateListing: () => void
}

export default function CreateListingButtonSXL({
  onCreateListing
}: CreateListingButtonSXLProps) {

  return (

    <button
      onClick={onCreateListing}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',

        width: '100%',

        background: 'transparent',

        border: 'none',

        padding: '2rem 1rem',

        cursor: 'pointer'
      }}
    >

      <svg
        width="125"
        height="125"
        viewBox="0 0 220 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          overflow: 'visible'
        }}
      >

        <polygon
          points="45,48 75,40 75,80 45,72"
          fill="#00ff99"
        />

        <polygon
          points="85,36 125,22 125,98 85,84"
          fill="#00ff99"
        />

        <polygon
          points="135,22 185,4 185,116 135,98"
          fill="#00ff99"
        />

        <line
          x1="198"
          y1="26"
          x2="214"
          y2="18"
          stroke="#00ff99"
          strokeWidth="10"
          strokeLinecap="round"
        />

        <line
          x1="202"
          y1="60"
          x2="218"
          y2="60"
          stroke="#00ff99"
          strokeWidth="10"
          strokeLinecap="round"
        />

        <line
          x1="198"
          y1="94"
          x2="214"
          y2="102"
          stroke="#00ff99"
          strokeWidth="10"
          strokeLinecap="round"
        />

      </svg>

      <span style={{
        marginTop: '.5rem',

        color: '#ff3b00',

        fontSize: '1.35rem',

        fontWeight: 'bold',

        letterSpacing: '.08rem',

        textTransform: 'uppercase'
      }}>
        Publish Listing
      </span>

    </button>

  )

}