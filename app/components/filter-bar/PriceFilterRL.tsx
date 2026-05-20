'use client'

type PriceFilterRLProps = {
  selectedmonthly_price: string
  setSelectedmonthly_price: (value: string) => void
}

export default function PriceFilterRL({
  selectedmonthly_price,
  setSelectedmonthly_price
}: PriceFilterRLProps) {

  return (

    <div>

      <h3 style={filterHeading}>
        price
      </h3>

      <div style={pillWrap}>

        <button
          onClick={() =>
            setSelectedmonthly_price(
              selectedmonthly_price === '-₡100K / month'
                ? ''
                : '-₡100K / month'
            )
          }
          style={
            selectedmonthly_price === '-₡100K / month'
              ? activePill
              : pill
          }
        >
          -₡100K / month
        </button>

        <button
          onClick={() =>
            setSelectedmonthly_price(
              selectedmonthly_price === '₡100K - ₡200K / month'
                ? ''
                : '₡100K - ₡200K / month'
            )
          }
          style={
            selectedmonthly_price === '₡100K - ₡200K / month'
              ? activePill
              : pill
          }
        >
          ₡100K - ₡200K / month
        </button>

        <button
          onClick={() =>
            setSelectedmonthly_price(
              selectedmonthly_price === '₡200K - ₡300K / month'
                ? ''
                : '₡200K - ₡300K / month'
            )
          }
          style={
            selectedmonthly_price === '₡200K - ₡300K / month'
              ? activePill
              : pill
          }
        >
          ₡200K - ₡300K / month
        </button>

        <button
          onClick={() =>
            setSelectedmonthly_price(
              selectedmonthly_price === '₡300K - ₡400K / month'
                ? ''
                : '₡300K - ₡400K / month'
            )
          }
          style={
            selectedmonthly_price === '₡300K - ₡400K / month'
              ? activePill
              : pill
          }
        >
          ₡300K - ₡400K / month
        </button>

        <button
          onClick={() =>
            setSelectedmonthly_price(
              selectedmonthly_price === '₡400K+ / month'
                ? ''
                : '₡400K+ / month'
            )
          }
          style={
            selectedmonthly_price === '₡400K+ / month'
              ? activePill
              : pill
          }
        >
          ₡400K+ / month
        </button>

      </div>

    </div>

  )

}

const filterHeading = {
  marginBottom:'14px',
  fontSize:'15px',
  color:'#888',
  textTransform:'uppercase' as const,
  letterSpacing:'1px'
}

const pillWrap = {
  display:'flex',
  flexWrap:'wrap' as const,
  gap:'10px'
}

const pill = {
  background:'#181818',
  border:'1px solid #2a2a2a',
  color:'#bbb',
  padding:'10px 14px',
  borderRadius:'999px',
  cursor:'pointer',
  transition:'all .2s ease'
}

const activePill = {
  background:'#00ff99',
  border:'1px solid #00ff99',
  color:'#000',
  padding:'10px 14px',
  borderRadius:'999px',
  cursor:'pointer',
  fontWeight:'bold',
  transition:'all .2s ease'
}

/*

IMPORT:

import PriceFilterRL from '@/app/components/filter-bar/PriceFilterRL'

USAGE:

<PriceFilterRL
  selectedmonthly_price={selectedmonthly_price}
  setSelectedmonthly_price={setSelectedmonthly_price}
/>

*/