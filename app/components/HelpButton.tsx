'use client'

import { useEffect, useState } from 'react'

type HelpButtonProps = {
  onClick?: () => void
}

export default function HelpButton({
  onClick
}: HelpButtonProps) {

    const [glow, setGlow] = useState(false)
      useEffect(() => {
        const interval = setInterval(() => {
          setGlow(true)
          setTimeout(() => {
            setGlow(false)
          }, 2000)
        }, 10000)
        return () => clearInterval(interval)
      }, [])
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
        outline:'none',

        boxShadow: glow
            ? `
                0 0 12px #d4af37,
                0 0 24px #d4af37,
                0 0 48px #d4af37,
                0 0 72px rgba(212,175,55,.75)
              `
            : 'none',

          transition:
            'box-shadow .5s ease-in-out'
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
          stroke="#FF3B00"
          strokeWidth="14"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* DOT */}
        <circle
          cx="102"
          cy="148"
          r="9"
          fill="#FF3B00"
        />

      </svg>

    </button>

  )

}