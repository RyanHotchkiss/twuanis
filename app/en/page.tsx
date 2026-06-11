import HomePageClient from './HomePageClient'
import { supabase } from '@/lib/supabase'

import { buildHomePageSchema }
from '@/lib/schema/buildHomePageSchema'

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
        .order('id', { ascending: false })

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
                listings || []
              }
              homePageSchema={
                homePageSchema
              }
            />
          )
}