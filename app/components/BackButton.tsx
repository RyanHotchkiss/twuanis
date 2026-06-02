'use client'

export default function BackButton({
  label = '← Back To Marketplace'
}: {
  label?: string
}) {

  return (

    <button
      onClick={() => window.history.back()}
      style={{
        background:'#FFFFFF40',
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
    </button>

  )

}

/*

IMPORT:

import BackButton from '@/app/components/BackButton'

USAGE:

<BackButton />

OR

<BackButton
  label="← Back To Buy"
/>

*/