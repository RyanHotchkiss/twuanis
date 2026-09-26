import 'server-only'
import { matchingCardEvidence } from './market-matching-presentation'
import { supabaseAdmin } from './supabase-admin'
import { resolveCanonicalMarketRequest } from './canonical-market-request'
import { readCanonicalMarketScalars } from './canonical-market-population'
import { acquireMarketPreferenceEvidence,evaluateMarketPreferences,rankMarketPreferences } from './canonical-market-preferences'
import { resolveListingOriginalMonetaryValue } from './listing-monetary-value'
import { resolveListingImages } from '@/app/utils/resolveListingImages'

export async function getMarketMatches(filters:Record<string,string|undefined>,language:'en'|'es'='en'){
  const request=await resolveCanonicalMarketRequest(filters,language)
  const fields=[...(request.propertyArea?['property_area' as const]:[]),...(request.constructionArea?['construction_area' as const]:[])]
  const candidates=await readCanonicalMarketScalars(request.base,fields)
  const evidence=await acquireMarketPreferenceEvidence(request,candidates.map(row=>row.id))
  const labels:Record<string,[string,string]>={property_area:['Property Area','Área del terreno'],construction_area:['Construction Area','Área de construcción'],year_built:['Year Built','Año de construcción'],distance_to_paved_road:['Distance to paved road','Distancia a carretera pavimentada']}
  const ranked=rankMarketPreferences(candidates.map(row=>({id:row.id,preferences:evaluateMarketPreferences(request,row,evidence).map(p=>({...p,label:labels[p.dimension]?.[language==='es'?1:0]??p.label}))})))
  const displayed=ranked.slice(0,12),presentation=new Map<string,Record<string,any>>()
  if(displayed.length){
    const {data,error,count}=await supabaseAdmin.from('listings')
      .select('id,title,images,canonical_domain_version,transaction_type,current_price,monthly_price,currency',{count:'exact'})
      .in('id',displayed.map(r=>r.id)).eq('canonical_domain_version',1).eq('listing_status','active')
      .order('id').limit(13)
    if(error||!Array.isArray(data)||count!==displayed.length||data.length!==count)throw Error('Matching presentation changed or is incomplete.')
    const wanted=new Set(displayed.map(r=>r.id))
    for(const row of data){if(!wanted.has(row.id)||presentation.has(row.id)||row.canonical_domain_version!==1||!['sale','rent'].includes(row.transaction_type)||request.base.transaction&&row.transaction_type!==request.base.transaction)throw Error('Invalid matching presentation.');presentation.set(row.id,row)}
  }
  const cards=await matchingCardEvidence(displayed.map(r=>r.id),evidence.canonical,request.terms.filter(t=>['bedrooms','bathrooms'].includes(t.dimension)).map(t=>t.dimension),language)
  const listings=displayed.map(result=>{
    const row=presentation.get(result.id)!,money=resolveListingOriginalMonetaryValue(row)
    // Explicit browser projection. No spread of candidate rows/canonical envelopes.
    return {id:result.id,province:cards.get(result.id)?.province??null,canton:cards.get(result.id)?.canton??null,property_type:cards.get(result.id)?.property_type??null,bedrooms:cards.get(result.id)?.bedrooms??null,bathrooms:cards.get(result.id)?.bathrooms??null,title:typeof row.title==='string'?row.title:null,images:resolveListingImages(row.images).slice(0,1),
      formattedPrice:money?`${money.currency} ${money.amount.toLocaleString(language==='es'?'es-CR':'en-US')}`:null,
      matchScore:result.matchScore,matchState:result.matchState,confirmedMatches:result.confirmedMatches,
      confirmedNonmatches:result.confirmedNonmatches,unknown:result.unknown,preferences:result.preferences,
      matchReasons:result.preferences.filter(p=>p.state==='MATCH').map(p=>p.label),
      missingFeatures:result.preferences.filter(p=>p.state==='NONMATCH').map(p=>p.label),
      unknownFeatures:result.preferences.filter(p=>p.state==='UNKNOWN').map(p=>p.label)}
  })
  return {language,filters,totalListings:candidates.length,listings}
}
