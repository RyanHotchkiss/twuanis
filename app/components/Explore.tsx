'use client'

export default function Explore({
  href,
  label
}: {
  href: string
  label?: string
}) {

  return (

    <button
      onClick={() => {
        window.location.href = href
      }}
      style={exploreButton}
    >

      <svg
        width="20"
        height="20"
        className="explore-icon"
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >

        <circle
          cx="100"
          cy="100"
          r="72"
          stroke="#D4AF37"
          strokeWidth="10"
        />

        <polygon
          points="100,30 120,100 100,85 80,100"
          fill="#D4AF37"
        />

        <polygon
          points="100,170 120,100 100,115 80,100"
          fill="#ffffff"
          stroke="#D4AF37"
          strokeWidth="4"
        />

        <circle
          cx="100"
          cy="100"
          r="10"
          fill="#D4AF37"
        />

      </svg>

    </button>

  )

}

const exploreButton = {
  color: '#fff',

  borderRadius: '999rem',

  padding: '.5rem .5rem',

  cursor: 'pointer',

  background: 'transparent',

  transition: 'all .2s ease',

  backdropFilter: 'blur(10px)',

  border: 'none'
}