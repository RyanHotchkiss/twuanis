import {loadAddonHomepage} from '@/lib/addon-homepage-server'
import {canonicalAddonPlacementEnabled} from '@/lib/addon-placement-server'
import HomePageClient from './HomePageClient'
import {
  supabaseAdmin
} from '@/lib/supabase-admin'
import {
  getPublicListings
} from '@/lib/public-listings-server'
import { buildHomePageSchema }
from '@/lib/schema/buildHomePageSchema'

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

const [
    saleListings,
    rentListings
  ] = await Promise.all([
    getPublicListings('sale'),
    getPublicListings('rent')
  ])

  const saleCount =
    saleListings.length

  const rentCount =
    rentListings.length

  const homepagePlacement =
    canonicalAddonPlacementEnabled()?{listings:saleListings}:await resolveMarketplacePlacement({
      supabase:
        supabaseAdmin,

      listings:
        saleListings,

      surface:
        'homepage'
    })

  const addonHomepage = await loadAddonHomepage()

  const homePageSchema =
    buildHomePageSchema({
      lang: 'es',
      ontologyTerms:
        ontologyTerms || [],
      ontologyRelationships:
        ontologyRelationships || []
    })

  return (
    <HomePageClient addonHomepage={addonHomepage}
      ontologyTerms={
        ontologyTerms || []
      }

      ontologyRelationships={
        ontologyRelationships || []
      }

      listings={
        homepagePlacement.listings
      }

      saleCount={
        saleCount
      }

      rentCount={
        rentCount
      }

      homePageSchema={
        homePageSchema
      }
    />
  )
}