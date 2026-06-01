'use client'

type HelpButtonProps = {
  onClick?: () => void
}

export default function HelpButton({
  onClick
}: HelpButtonProps) {

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
          justifyContent:'center',
          WebkitTapHighlightColor:'transparent',
          appearance:'none',
          WebkitAppearance:'none',
          outline:'none'
        }}
      >

      <svg
        width="25"
        height="25"
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >

        {/* QUESTION MARK */}
        <path
          d="
            M78 74
            C78 58, 90 48, 108 48
            C126 48, 138 58, 138 74
            C138 88, 130 96, 118 104
            C108 110, 102 116, 102 126
          "
          stroke="#ffffff"
          strokeWidth="14"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* DOT */}
        <circle
          cx="102"
          cy="148"
          r="9"
          fill="#ffffff"
        />

      </svg>

    </button>

  )

}