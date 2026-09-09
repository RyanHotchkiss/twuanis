import HomePageClient from './HomePageClient'
import {
  supabaseAdmin
} from '@/lib/supabase-admin'
import { buildHomePageSchema }
from '@/lib/schema/buildHomePageSchema'
import {
  getPublicListings
} from '@/lib/public-listings-server'
import {
  resolveMarketplacePlacement
} from '@/lib/promotion-placement'

export default async function HomePage() {

  const { data: ontologyTerms }
  = await supabaseAdmin
      .from('ontology_terms')
      .select('*')

const { data: ontologyRelationships }
  = await supabaseAdmin
      .from('ontology_relationships')
      .select('*')

const listings =
  await getPublicListings(
    'sale'
  )
    
  const homepagePlacement =
    await resolveMarketplacePlacement({
      supabase:
        supabaseAdmin,

      listings:
        listings,

      surface:
        'homepage'
    })

  const homePageSchema =
      buildHomePageSchema({
        lang: 'en',
        ontologyTerms:
          ontologyTerms || [],
        ontologyRelationships:
          ontologyRelationships || []
      })

          return (
            <HomePageClient
              ontologyTerms={
                ontologyTerms || []
              }
              ontologyRelationships={
                ontologyRelationships || []
              }
              listings={
                homepagePlacement.listings
              }
              homePageSchema={
                homePageSchema
              }
            />
          )
}