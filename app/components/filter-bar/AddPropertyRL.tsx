'use client'

export default function AddPropertyRL() {

  return (

    <a
      href="/en/rent-out-lease-out"
      style={rentLeaseButton}
    >
      + List a Property for Rent/Lease
    </a>

  )

}

const rentLeaseButton = {
  background:'#00ff9950',
  color:'#fff',
  textDecoration:'none',
  padding:'1rem 1rem',
  borderRadius:'999rem',
  fontSize:'.95rem',
  display:'inline-flex',
  alignItems:'center',
  justifyContent:'center',
  border:'1px solid #ffffff50',
  transition:'all .2s ease',
  cursor:'pointer'
}

/*

IMPORT:

import AddPropertyRL from '@/app/components/filter-bar/AddPropertyRL'

USAGE:

<AddPropertyRL />

*/