import {getPublicListingCounts} from '@/lib/public-listings-server'
import {MethodologyDiscovery} from '@/app/components/methodology/Methodology'
import {loadAddonHomepage} from '@/lib/addon-homepage-server'
import {supabaseAdmin} from '@/lib/supabase-admin'
import {buildHomePageSchema} from '@/lib/schema/buildHomePageSchema'
import HomeMarketplace from '@/app/components/home-marketplace/HomeMarketplace'
export default async function HomePage() {
  const [terms, relationships, addonHomepage, inventory] = await Promise.all([
    supabaseAdmin.from('ontology_terms').select('*'),
    supabaseAdmin.from('ontology_relationships').select('*'),
    loadAddonHomepage(),
    getPublicListingCounts()
  ])
  const ontologyTerms = terms.data || []
  const ontologyRelationships = relationships.data || []
  return <><HomeMarketplace inventory={inventory} language="en" addonHomepage={addonHomepage}
    ontologyTerms={ontologyTerms} ontologyRelationships={ontologyRelationships}
    homePageSchema={buildHomePageSchema({lang:'en',ontologyTerms,ontologyRelationships})} /><MethodologyDiscovery l="en"/></>
}
