'use client'

import { useState } from 'react'

type PriceSelectorSProps = {
  priceMillions: number
  setPriceMillions: (
    updater: (prev: number) => number
  ) => void
  formatColones: (millions: number) => string
  convertToUSD: (millions: number) => number
}

export default function PriceSelectorS({
  priceMillions,
  setPriceMillions,
  formatColones,
  convertToUSD
}: PriceSelectorSProps) {

  const [priceInterval, setPriceInterval] =
    useState<NodeJS.Timeout | null>(null)

  function startIncreasing() {

    const interval = setInterval(() => {

      setPriceMillions(prev =>
        Math.min(500, prev + 5)
      )

    }, 75)

    setPriceInterval(interval)

  }

  function startDecreasing() {

    const interval = setInterval(() => {

      setPriceMillions(prev =>
        Math.max(5, prev - 5)
      )

    }, 75)

    setPriceInterval(interval)

  }

  function stopChanging() {

    if (priceInterval) {
      clearInterval(priceInterval)
    }

  }

  return (

    <div>

      <h2 style={sectionHeading}>
        Price
      </h2>

      <div style={priceWheelContainer}>

  {/* UP */}
<button
  onMouseDown={startIncreasing}
  onMouseUp={stopChanging}
  onMouseLeave={stopChanging}
  onTouchStart={startIncreasing}
  onTouchEnd={stopChanging}
  style={priceArrow}
>
  ▲
</button>

{/* DISPLAY */}
<div style={priceDisplay}>

  <div>
    ₡
    {String(priceMillions).padStart(3)}
    M
  </div>

  <div style={{
    fontSize: '.95rem',
    color: '#888',
    marginTop: '.35rem'
  }}>
    $
      {((priceMillions * 1000000) / 500).toLocaleString()}
      {' '}USD
  </div>

</div>

{/* DOWN */}
<button
  onMouseDown={startDecreasing}
  onMouseUp={stopChanging}
  onMouseLeave={stopChanging}
  onTouchStart={startDecreasing}
  onTouchEnd={stopChanging}
  style={priceArrow}
>
  ▼
</button>

</div>

</div>

)

}
const sectionHeading = {
  fontSize:'1rem',
  marginBottom:'1rem',
  color:'#D4AF37'
}

const priceWheelContainer = {
  display:'flex',
  alignItems:'center',
  justifyContent:'center',
  gap:'.5rem',
  marginBottom:'1rem',
  width:'100%'
}

const priceArrow = {
  background:'#181818',
  border:'1px solid #333',
  color:'#FFFFFF',
  width:'3rem',
  height:'3rem',
  borderRadius:'.75rem',
  cursor:'pointer',
  fontSize:'1.25rem',
  flexShrink:0
}

const priceDisplay = {
  fontSize:'clamp(1.5rem, 6vw, 3rem)',
  fontWeight:'bold',
  minWidth:'0',
  flex:'1',
  textAlign:'center' as const,
  overflow:'hidden',
  textOverflow:'ellipsis',
  whiteSpace:'nowrap' as const
}

const priceConversion = {
  textAlign:'center' as const,
  color:'#888',
  fontSize:'1rem'
}