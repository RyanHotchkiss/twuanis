'use client'

type HomeButtonProps = {
  href?: string
  onClick?: () => void
}

export default function HomeButton({
  href,
  onClick
}: HomeButtonProps) {

  return (

    <button
      onClick={() => {

        if (onClick) {

          onClick()

        } else if (href) {

          window.location.href = href

        }

      }}
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

        <path
          d="
            M25 95
            L100 32
            L175 95
            L160 112
            L145 100
            L145 168
            L112 168
            L112 122
            L88 122
            L88 168
            L55 168
            L55 100
            L40 112
            Z
          "
          fill="#00ff99"
        />

        <path
          d="
            M25 95
            L100 32
            L175 95
          "
          stroke="#00ff99"
          strokeWidth="14"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

      </svg>

    </button>

  )

}