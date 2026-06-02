'use client'

import { useRouter } from 'next/navigation'

export default function CreateRentalListingButton() {

  const router = useRouter()

  return (

    <button
      onClick={() =>
        router.push(
          '/en/rent-out-lease-out'
        )
      }
      style={createListingButton}
    >
    List Rental Property
    </button>

  )

}

const createListingButton = {
  width:'auto',
  background:'#FFFFFF50',
  color:'#fff',
  border:'.0625rem solid #ffffff50',
  borderRadius:'1.5rem',
  padding:'1rem',
  fontSize:'1rem',
  cursor:'pointer'
}