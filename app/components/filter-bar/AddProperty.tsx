'use client'

export default function AddProperty() {

  return (

    <a
      href="/en/sell"
      style={sellButton}
    >
      + List a Property for Sale
    </a>

  )

}

const sellButton = {
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

import AddProperty from '@/app/components/buy/AddProperty'

USAGE:

<AddProperty />

*/