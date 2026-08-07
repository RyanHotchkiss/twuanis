import {
  notFound,
  redirect
} from 'next/navigation'

import {
  supabaseAdmin
} from '@/lib/supabase-admin'

import AuthenticatedListingPublisher
  from '@/app/components/AuthenticatedListingPublisher'

type PublishTokenState = {
  published_at:
    string | null

  published_listing_id:
    string | null
}

export default async function PublishPage({
  params
}: {
  params: Promise<{
    token: string
  }>
}) {
  const {
    token
  } =
    await params

  const {
    data: tokenData,
    error
  } =
    await supabaseAdmin
      .from(
        'listing_publish_tokens'
      )
      .select(`
        published_at,
        published_listing_id
      `)
      .eq(
        'token',
        token
      )
      .maybeSingle()

  if (
    error ||
    !tokenData
  ) {
    notFound()
  }

  const publishState =
    tokenData as
      PublishTokenState

  if (
    publishState.published_at &&
    publishState.published_listing_id
  ) {
    redirect(
      `/en/buy/listing/${publishState.published_listing_id}`
    )
  }

  return (
    <AuthenticatedListingPublisher
      token={token}
    />
  )
}