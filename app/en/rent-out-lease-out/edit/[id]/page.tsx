import { notFound } from 'next/navigation'

import { supabase } from '@/lib/supabase'

import RentalListingEditForm from '@/app/components/RentalListingEditForm'

export default async function EditRentalListingPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const {
    data: listing,
    error
  } = await supabase
    .from('listings')
    .select('*')
    .eq('id', id)
    .eq('transaction_type', 'rent')
    .single()

  if (error || !listing) {
    notFound()
  }

  return (
    <RentalListingEditForm
      listing={listing}
    />
  )
}