'use client'

type FilterButtonProps = {
  onClick: () => void
}

export default function FilterButton({
  onClick
}: FilterButtonProps) {

  return (

    <button
      onClick={onClick}
      style={filterButton}
    >

      <svg
        width="20"
        height="20"
        className="filter-icon"
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        overflow="visible"
      >

        <polygon
          points="15,10 85,10 75,22 25,22"
          fill="#D4AF37"
        />

        <polygon
          points="22,30 78,30 70,40 30,40"
          fill="#D4AF37"
        />

        <polygon
          points="30,48 70,48 64,56 36,56"
          fill="#D4AF37"
        />

        <polygon
          points="38,64 62,64 58,70 42,70"
          fill="#D4AF37"
        />

        <polygon
          points="44,78 56,78 54,82 46,82"
          fill="#D4AF37"
        />

      </svg>

    </button>

  )

}

const filterButton = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',

  flexShrink: 0,

  background: '#ffffff00',

  border: 'none',

  borderRadius: '999px',

  padding: '5px',

  marginTop: '5px',

  boxShadow: '0 10px 30px rgba(0,0,0,.45)',

  cursor: 'pointer'
}