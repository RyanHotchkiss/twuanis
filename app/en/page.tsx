import {loadAddonHomepage} from '@/lib/addon-homepage-server'
import {supabaseAdmin} from '@/lib/supabase-admin'
import {buildHomePageSchema} from '@/lib/schema/buildHomePageSchema'
import HomeMarketplace from '@/app/components/home-marketplace/HomeMarketplace'
export default async function HomePage() {
  const [terms, relationships, addonHomepage] = await Promise.all([
    supabaseAdmin.from('ontology_terms').select('*'),
    supabaseAdmin.from('ontology_relationships').select('*'),
    loadAddonHomepage()
  ])
  const ontologyTerms = terms.data || []
  const ontologyRelationships = relationships.data || []
  return <HomeMarketplace language="en" addonHomepage={addonHomepage}
    ontologyTerms={ontologyTerms} ontologyRelationships={ontologyRelationships}
    homePageSchema={buildHomePageSchema({lang:'en',ontologyTerms,ontologyRelationships})} />
}
