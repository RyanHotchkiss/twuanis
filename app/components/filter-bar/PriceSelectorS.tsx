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
        Math.min(500, prev + 1)
      )

    }, 75)

    setPriceInterval(interval)

  }

  function startDecreasing() {

    const interval = setInterval(() => {

      setPriceMillions(prev =>
        Math.max(1, prev - 1)
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
  gap:'1rem',
  marginBottom:'1rem'
}

const priceArrow = {
  background:'#181818',
  border:'1px solid #333',
  color:'#FFFFFF',
  width:'4rem',
  height:'4rem',
  borderRadius:'1rem',
  cursor:'pointer',
  fontSize:'1.5rem'
}

const priceDisplay = {
  fontSize:'3rem',
  fontWeight:'bold',
  minWidth:'12rem',
  textAlign:'center' as const
}

const priceConversion = {
  textAlign:'center' as const,
  color:'#888',
  fontSize:'1rem'
}