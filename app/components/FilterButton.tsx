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
     style={{

  background: '#ffffff00',

  border: 'none',

  borderRadius: '9px',

  padding: '5px 5px',

  boxShadow:

    '0 10px 30px rgba(0,0,0,.45)',

  cursor: 'pointer'

}}
    >

      <svg
        width="20"
        height="20"
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
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