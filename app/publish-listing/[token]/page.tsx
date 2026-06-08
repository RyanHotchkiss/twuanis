import { supabase } from '@/lib/supabase'

export default async function PublishPage({
  params
}: {
  params: Promise<{ token: string }>
}) {

  const { token } = await params

  const { data } = await supabase
    .from('listing_publish_tokens')
    .select('*')
    .eq('token', token)
    .single()

  if (!data) {

    return (
      <div>
        Invalid token
      </div>
    )

  }

  await supabase
    .from('listing_publish_tokens')
    .update({
      verified: true
    })
    .eq('token', token)

  return (

    <div
      style={{
        padding:'3rem',
        textAlign:'center'
      }}
    >

      <h1>
        Listing Verified
      </h1>

      <p>
        Return to Twuanis.
      </p>

    </div>

  )

}
