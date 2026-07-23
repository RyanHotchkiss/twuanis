import { notFound } from 'next/navigation'

import { supabase } from '@/lib/supabase'

import AuthenticatedListingPublisher
  from '@/app/components/AuthenticatedListingPublisher'

export default async function PublishPage({
  params
}: {
  params: Promise<{
    token: string
  }>
}) {

  const {
    token
  } = await params

  const {
    data: tokenData
  } = await supabase
    .from('listing_publish_tokens')
    .select('verified')
    .eq('token', token)
    .single()

  if (!tokenData) {

    notFound()

  }

  if (tokenData.verified) {

    return (

      <main
        style={{
          minHeight: '100vh',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          background: '#0a0a0a',
          color: '#fff'
        }}
      >

        <div
          style={{
            textAlign: 'center'
          }}
        >

          <h1>
            Listing Already Published
          </h1>

          <p>
            This listing has already been verified.
          </p>

        </div>

      </main>

    )

  }

  return (

    <AuthenticatedListingPublisher
      token={token}
    />

  )

}