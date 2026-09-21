import dotenv from 'dotenv'
import WebSocket from 'ws'

// S7: compatibility fields cannot authorize canonical membership writes.
function rejectRetiredOntologyWriter(): void {
  throw new Error('Bulk ontology assignment is retired; canonical reconciliation is not available here.')
}

rejectRetiredOntologyWriter()

dotenv.config({
  path: '.env.local'
})

;(globalThis as any).WebSocket = WebSocket

async function main() {
  const { supabase } = await import('../lib/supabase')
  const { assignListingOntology } = await import('../lib/assign-listing-ontology')

  const { data: listings, error } = await supabase
    .from('listings')
    .select('*')
    .eq('listing_status', 'active')

  if (error) {
    console.error(error)
    process.exit(1)
  }

  for (const listing of listings || []) {
    console.log('Assigning ontology:', listing.id, listing.title)

    await assignListingOntology(
      listing.id,
      listing
    )
  }

  console.log('Done')
}

main()