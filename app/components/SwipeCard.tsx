'use client'

export default function SwipeCard({
  href,
  label
}: {
  href: string
  label: string
}) {

  return (

    <button
      onClick={() => {
        window.location.href = href
      }}
      style={{
        background:'#ff3b0095',
        border:'.0625rem solid #ffffff50',
        color:'#fff',
        padding:'.75rem 1rem',
        borderRadius:'.75rem',
        cursor:'pointer',
        fontSize:'.875rem',
        display:'flex',
        alignItems:'center',
        justifyContent:'center',
        gap:'.35rem'
      }}
    >

      {label}

      <span style={{
        color:'#00ff99',
        display:'inline-flex',
        flexDirection:'column',
        alignItems:'center',
        justifyContent:'center',
        lineHeight:1
      }}>

        <span style={{
          fontSize:'.5rem',
          marginBottom:'-.1rem'
        }}>
          si
        </span>

        <span style={{
          fontSize:'1rem'
        }}>
          ⇄
        </span>

        <span style={{
          fontSize:'.5rem',
          marginTop:'-.1rem'
        }}>
          no
        </span>

      </span>

    </button>

  )

}

/*

import SwipeCard from '@/app/components/SwipeCard'

<SwipeCard
  href="/en/swipe/buy"
  label="Swipe View"
/>

*/