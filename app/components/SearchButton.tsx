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
      style={{
        background:'#ffffff00',

        border:'none',

        borderRadius:'999px',

        padding:'5px 5px',

        cursor:'pointer',

        display:'flex',
        alignItems:'center',
        justifyContent:'center'
      }}
    >

      <svg
        width="20"
        height="20"
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >

        {/* LENS */}
        <circle
          cx="78"
          cy="78"
          r="52"
          stroke="#00ff99"
          strokeWidth="12"
        />

        <circle
          cx="78"
          cy="78"
          r="38"
          stroke="#00ff99"
          strokeWidth="4"
          opacity="0.65"
        />

        {/* HANDLE */}
        <rect
          x="112"
          y="112"
          width="18"
          height="72"
          rx="8"
          transform="rotate(-45 112 112)"
          fill="#00ff99"
        />

        {/* HANDLE END */}
        <circle
          cx="152"
          cy="152"
          r="10"
          fill="#00ff99"
        />

      </svg>

    </button>

  )

}