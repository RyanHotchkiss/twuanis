import 'server-only'
import {hasRoomEligiblePropertyType} from './intelligence-room-filter-visibility'
import {bathroomFactConstraint,encodeBathroomSelection,validateBathroomConstraint} from './bathroom-selection'
import {publishedListingSnapshot} from './lpi-published-snapshot'
import type {CanonicalEvidence} from './canonical-listing-reader'
import {readCanonicalListingEvidence} from './canonical-listing-reader'
import {getPublicListingById} from './public-listings-server'
import {supabaseAdmin} from './supabase-admin'
import {tokenCreationInput} from './token-canonical-creation'
import {resolveListingOriginalMonetaryValue} from './listing-monetary-value'
import {QuestionUnavailable,draftSnapshot,type Context,type Question,type Lens} from './lpi-contract'
const semantics=['property_type','utility','environment','terrain','accessibility','legal_status']
export function evidenceQuestion(e:CanonicalEvidence,transaction:'sale'|'rent',revision:string):Question {
 const district=e.geography.find(g=>g.term_type==='district')?.official_code
 const types=e.selections.filter(s=>s.dimension==='property_type')
 if(!district||!/^\d{5}$/.test(district)||types.length!==1)throw new QuestionUnavailable('Exact district and property type are required; no geographic fallback.')
 const filters:Record<string,string>={transaction_type:transaction,district,property_type:types[0].ontology_term_id}
 for(const dimension of semantics.filter(k=>k!=='property_type')){const ids=e.selections.filter(s=>s.dimension===dimension).map(s=>s.ontology_term_id);if(ids.length)filters[dimension]=ids.join(',')}
 const unsupported:string[]=[]
 for(const f of e.facts){if(f.dimension==='bathrooms'){const c=bathroomFactConstraint(f);if(c)filters.bathrooms=encodeBathroomSelection([c]);else unsupported.push(f.dimension);continue}if(f.kind==='category'&&['bedrooms','bathrooms','parking'].includes(f.dimension)&&f.category_term_id)filters[f.dimension]=f.category_term_id;else unsupported.push(f.dimension)}
 return {transaction,district,propertyType:types[0].ontology_term_id,filters,revision,amount:null,currency:null,unsupported}
}
export function requireLensQuestion(q:Question,lens:Lens){
 if(lens==='matching'||lens==='frequency'){
  // Validate the same explicit property-type boundary as the canonical engine.
  // Preserve the supplied room evidence; never drop it to broaden the question.
  if((q.filters.bedrooms||q.filters.bathrooms)&&!hasRoomEligiblePropertyType([q.propertyType]))throw new QuestionUnavailable('ROOM_CONSTRAINT_NOT_APPLICABLE')
  if(Object.keys(q.filters).length<=3)throw new QuestionUnavailable('At least one supported canonical characteristic is required.')
 }
 if(lens==='position'&&!q.listingId)throw new QuestionUnavailable('A published canonical identity and exact eligible normalization area are required.')
 return q
}
export async function bindQuestion(context:Context):Promise<Question>{
 if(context.kind==='published'){
  if(!/^[0-9a-f-]{36}$/i.test(context.id))throw new QuestionUnavailable('Invalid property identity')
  const initialRevision=await readRevision(context.id)
  const row=await getPublicListingById(context.id)
  if(!row||row.transaction_type!==context.transaction)throw new QuestionUnavailable('Current published property unavailable')
  const evidence=(await readCanonicalListingEvidence([context.id],{facts:['bedrooms','bathrooms','parking','year_built','distance_to_paved_road'],semantics})).get(context.id)!
  const revision=await readRevision(context.id)
  if(initialRevision!==revision)throw new QuestionUnavailable('Property changed during question binding')
  if(context.snapshot!==undefined&&context.snapshot!==publishedListingSnapshot(row))throw new QuestionUnavailable('Property changed since the explicit request; run again.')
  const q=evidenceQuestion(evidence,context.transaction,revision)
  const money=resolveListingOriginalMonetaryValue(row)
  return {...q,listingId:context.id,amount:money?.amount??null,currency:money?.currency??null}
 }
 if(context.kind!=='draft'||!['sale','rent'].includes(context.transaction))throw new QuestionUnavailable('Invalid draft')
 const input: Record<string,any>=await tokenCreationInput(supabaseAdmin,{...draftSnapshot(context.draft),transaction_type:context.transaction},'')
 const geo=input.geography??{},s=input.semantics??{},facts=input.facts??{}
 if(!geo.district||s.property_type?.length!==1)throw new QuestionUnavailable('Exact district and property type required')
 const filters:Record<string,string>={transaction_type:context.transaction,district:geo.district,property_type:s.property_type[0]}
 for(const key of semantics.filter(k=>k!=='property_type'))if(s[key]?.length)filters[key]=s[key].join(',')
 const unsupported:string[]=[]
 for(const [key,value] of Object.entries(facts)){const f=value as {kind:string;term?:string;value?:string;lower?:string|null;upper?:string|null;lower_inclusive?:boolean;upper_inclusive?:boolean};if(f.kind==='clear')continue;if(key==='bathrooms'){const c=validateBathroomConstraint(f.kind==='exact'?{kind:'exact',value:f.value}:f.kind==='category'?{kind:'category',termId:f.term}:{kind:'interval',lower:f.lower,upper:f.upper,lowerInclusive:f.lower_inclusive,upperInclusive:f.upper_inclusive});filters.bathrooms=encodeBathroomSelection([c]);continue}if(f.kind==='category'&&['bedrooms','bathrooms','parking'].includes(key)&&f.term)filters[key]=f.term;else unsupported.push(key)}
 return {transaction:context.transaction,district:geo.district,propertyType:s.property_type[0],filters,revision:JSON.stringify({geography:geo,semantics:s,facts,measurements:input.measurements}),amount:Number(input.money?.amount)>0?Number(input.money.amount):null,currency:input.money?.currency??null,unsupported}
}
export async function readRevision(id:string){const {data,error}=await supabaseAdmin.from('listings').select('canonical_revision::text,listing_status').eq('id',id).maybeSingle();if(error||!data||data.listing_status!=='active')throw new QuestionUnavailable('Property no longer published');return String(data.canonical_revision)}
