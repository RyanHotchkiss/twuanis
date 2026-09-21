import 'server-only'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { readCanonicalListingEvidence, type CanonicalEvidence } from '@/lib/canonical-listing-reader'
import { resolveDtaGeography } from '@/lib/geography/resolve-dta-geography'

export async function resolvePopulationGeography(filters: Record<string,string|undefined>) {
  const request: Record<string,string[]> = {}
  const legacy = {...filters}
  const displayLabels: Record<string,string> = {}
  // Exact old URL aliases are boundary compatibility only, never listing identity.
  for (const type of ['province','canton','district']) {
    if (!filters[type]) continue
    const values = filters[type]!.split(',')
    if (values.length > 25 || values.some(v => !v)) throw new Error('Invalid geographic selection.')
    const codes: string[] = [], slugs: string[] = [], labels: string[] = []
    for (const value of values) {
      const isCode = /^\d+$/.test(value)
      if (!isCode && !/^[a-z0-9-]+$/.test(value)) throw new Error('Invalid geographic identity.')
      const {data,error,count} = await supabaseAdmin.from('ontology_terms')
        .select('official_code,slug,term_name', {count:'exact'}).eq('term_type',type)
        .eq(isCode ? 'official_code' : 'slug',value).limit(2)
      if (error) throw error
      if (count !== 1 || data?.length !== 1 || !data[0].official_code || typeof data[0].slug !== 'string' || !data[0].slug) throw new Error('Unresolved geographic identity or legacy request mapping.')
      codes.push(data[0].official_code); slugs.push(data[0].slug); labels.push(data[0].term_name)
    }
    request[type]=codes; legacy[type]=slugs.join(','); displayLabels[type]=labels.join(', ')
  }
  const resolved = await resolveDtaGeography(request,async()=>supabaseAdmin)
  return {resolved,legacy,displayLabels}
}

export async function hydrateCanonicalPopulation<T extends {id:string;canonical_domain_version?:number|null;transaction_type?:string|null}>(listings:T[], existingEvidence: ReadonlyMap<string,CanonicalEvidence> = new Map(), factDimensions: string[] = ['bedrooms','bathrooms','parking','year_built']) {
  const canonical = listings.filter(l=>l.canonical_domain_version===1)
  if (!canonical.length) return listings
  const acquired = await readCanonicalListingEvidence(canonical.filter(l=>!existingEvidence.has(l.id)).map(l=>l.id),{
    facts:factDimensions,
    semantics:['property_type'],
  })
  const evidence = new Map([...existingEvidence,...acquired])
  return listings.map(listing=>{
    if (listing.canonical_domain_version!==1) return listing
    if (listing.transaction_type!=='sale' && listing.transaction_type!=='rent') {
      throw new Error('Invalid canonical transaction identity.')
    }
    const e=evidence.get(listing.id)!
    const province=e.geography.find(t=>t.term_type==='province')!
    const canton=e.geography.find(t=>t.term_type==='canton')!
    const district=e.geography.find(t=>t.term_type==='district')??null
    const facts=Object.fromEntries(e.facts.map(f=>[f.dimension,f]))
    const exact=(dimension:string)=>facts[dimension]?.kind==='exact' ? facts[dimension].exact_value : null
    const factProjection = Object.fromEntries(factDimensions.flatMap(dimension=>
      dimension==='year_built' ? [['year_built',exact(dimension)],['year_built_range',exact(dimension)]] :
      dimension==='distance_to_paved_road' ? [['distance_to_paved_road_range',exact(dimension)]] : [[dimension,exact(dimension)]]))
    return {...listing,
      // Compatibility labels are derived for output, never used to select canonical rows.
      province:province.term_name,canton:canton.term_name,district:district?.term_name??null,
      property_type:e.selections[0].slug||e.selections[0].term_name,
      ...factProjection,
      canonicalEvidence:e,
      canonicalGeography:{source:{province:null,canton:null,district:null},province,canton,district,
        reasons:{province:'resolved',canton:'resolved',district:district?'resolved':'missing'},complete:true},
    }
  })
}

// Dictionary candidates only: legacy text remains compatibility authority.
export async function loadLegacyGeographyDictionary(listingIds:string[]) {
  const ids=[...new Set(listingIds)]
  const terms=new Map<string,any>()
  for(let offset=0;offset<ids.length;offset+=25) {
    const {data,error}=await supabaseAdmin.rpc('read_legacy_geography_dictionary',{
      p_listing_ids:ids.slice(offset,offset+25),
    })
    if(error) throw error
    if(!Array.isArray(data)||data.length>1000) throw new Error('Incomplete legacy dictionary evidence.')
    for(const term of data) {
      if(typeof term.id!=='string') throw new Error('Lossy legacy ontology identity.')
      terms.set(term.id,term)
    }
  }
  return [...terms.values()]
}
