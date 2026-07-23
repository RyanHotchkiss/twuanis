import {
  notFound
} from 'next/navigation'

import {
  supabase
} from '@/lib/supabase'

import SaleListingEditForm from '@/app/components/SaleListingEditForm'

export default async function EditSaleListingPage({
  params
}: {
  params: Promise<{
    id: string
  }>
}) {
  const {
    id
  } = await params

  const {
    data: listing,
    error
  } = await supabase
    .from('listings')
    .select('*')
    .eq('id', id)
    .in(
      'transaction_type',
      [
        'buy',
        'sale'
      ]
    )
    .single()

  if (
    error ||
    !listing
  ) {
    notFound()
  }

  return (
    <SaleListingEditForm
      listing={listing}
      language="es"
    />
  )
}