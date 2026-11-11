'use client'

type SearchButtonProps = {
  onClick?: () => void
}

export default function SearchButton({
  onClick
}: SearchButtonProps) {

  return (

    <button
      onClick={onClick}
      style={searchButton}
    >

      <svg
        width="20"
        height="20"
        className="search-icon"
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >

        <circle
          cx="78"
          cy="78"
          r="52"
          stroke="#D4AF37"
          strokeWidth="12"
        />

        <circle
          cx="78"
          cy="78"
          r="38"
          stroke="#D4AF37"
          strokeWidth="4"
          opacity="0.65"
        />

        <rect
          x="112"
          y="112"
          width="18"
          height="72"
          rx="8"
          transform="rotate(-45 112 112)"
          fill="#D4AF37"
        />

        <circle
          cx="152"
          cy="152"
          r="10"
          fill="#D4AF37"
        />

      </svg>

    </button>

  )

}

const searchButton = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  background: '#ffffff00',
  border: 'none',
  borderRadius: '999px',
  padding: '5px',
  marginTop: '5px',
  cursor: 'pointer'
}