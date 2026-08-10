import HomePageClient from './HomePageClient'
import { supabase } from '@/lib/supabase'
import {
  supabaseAdmin
} from '@/lib/supabase-admin'
import { buildHomePageSchema }
from '@/lib/schema/buildHomePageSchema'

import {
  resolveMarketplacePlacement
} from '@/lib/promotion-placement'

export default async function HomePage() {

  const { data: ontologyTerms }
    = await supabase
        .from('ontology_terms')
        .select('*')

  const { data: ontologyRelationships }
    = await supabase
        .from('ontology_relationships')
        .select('*')

  const { data: listings }
    = await supabase
        .from('listings')
        .select('*')
        .eq('transaction_type', 'sale')
        .eq('listing_status', 'active')

  const homepagePlacement =
    await resolveMarketplacePlacement({
      supabase:
        supabaseAdmin,

      listings:
        listings || [],

      surface:
        'homepage'
    })

  const homePageSchema =
    buildHomePageSchema({
      lang: 'es',
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