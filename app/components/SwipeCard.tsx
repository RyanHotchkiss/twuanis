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
        
        flexShrink: 0,
       
        color:'#fff',
        padding:'.5rem .5rem',
        borderRadius:'.75rem',
        cursor:'pointer',
        fontSize:'.875rem',
        background: 'transparent',
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

        <svg
          width="25"
          height="25"
          viewBox="0 0 200 200"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >

                  <path
                    d="
                      M20 100
                      L75 45
                      L75 75
                      L125 75
                      L125 45
                      L180 100
                      L125 155
                      L125 125
                      L75 125
                      L75 155
                      Z
                    "
                    
                    stroke="#00ff99"
                    strokeWidth="6"
                    strokeLinejoin="round"
                  />

      </svg>

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