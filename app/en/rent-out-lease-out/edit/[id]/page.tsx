import {readCanonicalListingEvidence} from '@/lib/canonical-listing-reader'
import { notFound } from 'next/navigation'

import {
  createServerSupabaseClient
} from '@/lib/supabase-server'

import RentalListingEditForm from '@/app/components/RentalListingEditForm'

export default async function EditRentalListingPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const supabase =
    await createServerSupabaseClient()

  const {
    data: listing,
    error
  } = await supabase
    .from('listings')
    .select('*,canonical_revision::text,current_price::text,monthly_price::text')
    .eq('id', id)
    .eq('transaction_type', 'rent')
    .single()

  if (error || !listing) {
    notFound()
  }

  const {data:{user}}=await supabase.auth.getUser()
  if(!user||listing.owner_id!==user.id)notFound()
  const canonicalBathroom=listing.canonical_domain_version===1?(await readCanonicalListingEvidence([id],{facts:['bathrooms'],semantics:[]})).get(id)?.facts.find(f=>f.dimension==='bathrooms'):undefined
  return (
    <RentalListingEditForm
      listing={{...listing,canonicalBathroom}}
      language="en"
    />
  )
}