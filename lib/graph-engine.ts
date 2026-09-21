import 'server-only'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { supabase } from '@/lib/supabase'

export async function getGraphNeighbors(

  termIds: number[]

) {

  console.log(

    'GRAPH TERM IDS',

    termIds

  )

  if (!termIds.length) {

    console.log(

      'NO TERM IDS FOUND'

    )

    return []

  }

  const { data, error } = await supabaseAdmin

    .from('ontology_graph_cache')

    .select('source_term_id,target_term_id,relationship_type')

    .or(

      termIds

        .map(

          id =>

            `source_term_id.eq.${id},target_term_id.eq.${id}`

        )

        .join(',')

    )

  if (error) {

    console.error(error)

    return []

  }

  return data || []

}

export async function getOntologyTermsByIds(

  termIds: number[]

) {

  const { data, error } = await supabase

    .from('ontology_terms')

    .select('*')

    .in('id', termIds)

  if (error) {

    console.error(error)

    return []

  }

  return data || []

}

export const getTermRelationships =

  getGraphNeighbors