'use client'

export default function Favorites({
  href,
  label,
  icon
}: {
  href: string
  label: string
  icon?: string
}) {

  return (

    <button
      onClick={() => {
        window.location.href = href
      }}
      style={{
       
        color:'#fff',
        borderRadius:'999rem',
        padding:'.5rem .5rem',
        cursor:'pointer',
        background: 'transparent',
        transition:'all .2s ease',
        backdropFilter:'blur(10px)'
      }}
    >

    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >

      <path
        d="
          M12 21
          C12 21,4 14.5,4 9
          C4 5.5,6.5 3,9.5 3
          C11.2 3,12 4.2,12 4.2
          C12 4.2,12.8 3,14.5 3
          C17.5 3,20 5.5,20 9
          C20 14.5,12 21,12 21
        "
        fill="#ff3b30"
        stroke="#D4AF37"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />

    </svg>

    </button>

  )

}

/* 

import Favorites from '@/app/components/Favorites'

<Favorites
  href="/en/favorites"
  label="Favorite Properties"
  icon="♥"
/>

*/