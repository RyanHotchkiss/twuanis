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
        background:'#00ff9940',
        border:'.0625rem solid #ffffff50',
        color:'#fff',
        borderRadius:'999rem',
        padding:'.85rem 1.25rem',
        cursor:'pointer',
        transition:'all .2s ease',
        backdropFilter:'blur(10px)'
      }}
    >

      {label}

      {icon && (
        <span style={{
          color:'#ff3b30',
          marginLeft:'.4rem'
        }}>
          {icon}
        </span>
      )}

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