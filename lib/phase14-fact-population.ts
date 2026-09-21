import 'server-only'
import { supabaseAdmin } from './supabase-admin'
import { readCanonicalListingEvidence, type CanonicalEvidence, type CanonicalFact } from './canonical-listing-reader'
import { assertPhase14ExecutionEnvelope, type Phase14ExecutionEnvelope } from './phase14-question-commit'
import { assertPhase14MembershipPopulationForExecution, type Phase14MembershipAcquisition, type Phase14MembershipPopulation } from './phase14-membership-population'
import type { Phase14FactDimension, Phase14FactConstraint, Phase14Interval, Phase14PropertyAreaKey, Phase14ConstructionAreaKey } from './phase14-question-contract'
import { resolvePropertyAreaConstraint, resolveConstructionAreaConstraint } from './market-intelligence-area-ranges'

const FACT_ORDER = ['bedrooms','bathrooms','parking','year_built'] as const
const PAGE_SIZE=500, PREDICATE_BUDGET=1500, MEMBERSHIP_CHUNK=25
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
type AreaDimension='propertyArea'|'constructionArea'
type Selection=Readonly<{dimension:Phase14FactDimension;constraints:readonly Phase14FactConstraint[]}>
  | Readonly<{dimension:AreaDimension;rangeKey:Phase14PropertyAreaKey|Phase14ConstructionAreaKey}>
type Completeness=Readonly<{contract:'bounded_selected_evidence_v1';requests:number;snapshotGuaranteed:false}>
type FactEvidence=Readonly<{kind:'canonical_fact_reader';dimension:Phase14FactDimension;records:readonly CanonicalEvidence[]}>
type CategoryEvidence=Readonly<{kind:'recorded_category_membership';dimension:Phase14FactDimension;rows:readonly Readonly<{listingId:string;termId:string}>[]}>
type AreaEvidence=Readonly<{kind:'exact_area_scalar';dimension:AreaDimension;rows:readonly Readonly<{listingId:string;value:string|null}>[]}>
export type Phase14FactStage=Readonly<{
  selection:Selection;inputCount:number;survivorCount:number;excludedCount:number
  execution:'queried'|'empty_input';completeness:Completeness
  evidence:readonly (FactEvidence|CategoryEvidence|AreaEvidence)[]
}>
type Provenance=Readonly<{
  kind:'pre_hydration_fact_scalar_filtered_population';executionId:string;canonicalQuestionSerialization:string
  membershipPopulation:Phase14MembershipPopulation;membershipStartingCount:number
}>
export type Phase14FactPopulation=Provenance & Readonly<{
  state:'complete';withinDimension:'OR';acrossDimensions:'AND';trail:readonly Phase14FactStage[]
  listingIds:readonly string[];survivingListingCount:number;excludedListingCount:number;completeness:Completeness
}>
export type Phase14FactAcquisition=Phase14FactPopulation
  | (Provenance & Readonly<{state:'incomplete';dimension:Selection['dimension'];reason:'incomplete_or_incoherent_evidence'}>)
  | (Provenance & Readonly<{state:'execution_failed';dimension:Selection['dimension'];reason:'evidence_query_failed'}>)
  | Readonly<{state:'invalid_execution'}>
const owners=new WeakMap<object,Readonly<{envelope:Phase14ExecutionEnvelope;membership:Phase14MembershipPopulation}>>()
class EvidenceFailure extends Error {}
class QueryFailure extends Error {}
function fail():never {throw new EvidenceFailure()}
function freeze<T>(v:T):T {
  if(v&&typeof v==='object'){for(const child of Object.values(v))freeze(child);Object.freeze(v)}return v
}
function completeness(requests:number):Completeness {return freeze({contract:'bounded_selected_evidence_v1',requests,snapshotGuaranteed:false})}
// Equivalent to Step 1's canonical positive-decimal comparison; no Number conversion.
function decimal(value:unknown):string {
  if(typeof value!=='string'||!/^\d+(\.\d+)?$/.test(value))fail()
  const [whole,fraction='']=value.split('.'),w=whole.replace(/^0+(?=\d)/,''),f=fraction.replace(/0+$/,'')
  return w+(f?'.'+f:'')
}
function compare(a:string,b:string):number {
  const [aw,af='']=a.split('.'),[bw,bf='']=b.split('.')
  if(aw.length!==bw.length)return aw.length-bw.length
  if(aw!==bw)return aw<bw?-1:1
  const length=Math.max(af.length,bf.length),x=af.padEnd(length,'0'),y=bf.padEnd(length,'0')
  return x<y?-1:x>y?1:0
}
function dimensionDecimal(v:unknown,d:Phase14FactDimension,exact:boolean):string {
  const n=decimal(v)
  if(d!=='bathrooms'&&n.includes('.'))fail()
  if(d==='bathrooms'&&exact&&n==='0')fail()
  if(d==='year_built'&&(compare(n,'1')<0||compare(n,'9999')>0))fail()
  return n
}
function numericalFact(f:CanonicalFact,d:Phase14FactDimension):Readonly<{kind:'exact';value:string}>|Readonly<{kind:'range';interval:Phase14Interval}>|null {
  if(f.dimension!==d)fail()
  if(f.kind==='category')return null // Never a numerical proof.
  if(f.kind==='exact')return {kind:'exact',value:dimensionDecimal(f.exact_value,d,true)}
  if(f.kind!=='range')fail()
  const lower=f.range_lower===null?null:dimensionDecimal(f.range_lower,d,false),upper=f.range_upper===null?null:dimensionDecimal(f.range_upper,d,false)
  if(typeof f.lower_inclusive!=='boolean'||typeof f.upper_inclusive!=='boolean'||
     lower===null&&f.lower_inclusive||upper===null&&f.upper_inclusive||lower===null&&upper===null)fail()
  if(lower!==null&&upper!==null&&(compare(lower,upper)>0||compare(lower,upper)===0&&!(f.lower_inclusive&&f.upper_inclusive)))fail()
  return {kind:'range',interval:{lower,upper,lowerInclusive:f.lower_inclusive,upperInclusive:f.upper_inclusive}}
}
function inside(value:string,r:Phase14Interval):boolean {
  return (r.lower===null||compare(value,r.lower)>0||compare(value,r.lower)===0&&r.lowerInclusive)&&
    (r.upper===null||compare(value,r.upper)<0||compare(value,r.upper)===0&&r.upperInclusive)
}
function contained(e:Phase14Interval,r:Phase14Interval):boolean {
  const lower=r.lower===null||(e.lower!==null&&(compare(e.lower,r.lower)>0||compare(e.lower,r.lower)===0&&(!e.lowerInclusive||r.lowerInclusive)))
  const upper=r.upper===null||(e.upper!==null&&(compare(e.upper,r.upper)<0||compare(e.upper,r.upper)===0&&(!e.upperInclusive||r.upperInclusive)))
  return lower&&upper
}
function numericalMatch(f:CanonicalFact|undefined,d:Phase14FactDimension,cs:readonly Phase14FactConstraint[]):boolean {
  if(!f)return false
  const evidence=numericalFact(f,d);if(!evidence)return false
  return cs.some(c=>c.kind==='exact'?evidence.kind==='exact'&&compare(evidence.value,c.value)===0:
    c.kind==='interval'?(evidence.kind==='exact'?inside(evidence.value,c.interval):contained(evidence.interval,c.interval)):false)
}
function chunks(values:readonly string[],limit:number):string[][] {
  const result:string[][]=[];let part:string[]=[],length=0
  for(const value of values){const cost=encodeURIComponent(JSON.stringify(value)).length+3;if(cost>PREDICATE_BUDGET)fail()
    if(part.length&&(part.length>=limit||length+cost>PREDICATE_BUDGET)){result.push(part);part=[];length=0}
    part.push(value);length+=cost
  }if(part.length)result.push(part);return result
}
// Step 5 has no externally injectable database/authorization dependency.
export async function acquirePhase14FactPopulation(envelope:Phase14ExecutionEnvelope,membership:Phase14MembershipAcquisition):Promise<Phase14FactAcquisition> {
  try {
    assertPhase14ExecutionEnvelope(envelope)
    if(!membership||membership.state!=='complete')return freeze({state:'invalid_execution'})
    assertPhase14MembershipPopulationForExecution(membership,envelope,membership.fundamentalPopulation)
  }catch{return freeze({state:'invalid_execution'})}
  const provenance:Provenance=freeze({kind:'pre_hydration_fact_scalar_filtered_population',executionId:envelope.executionId,
    canonicalQuestionSerialization:envelope.canonicalQuestionSerialization,membershipPopulation:membership,membershipStartingCount:membership.survivingListingCount})
  const filters=envelope.question.filters,selections:Selection[]=[]
  for(const dimension of FACT_ORDER){const constraints=filters.facts?.[dimension];if(constraints?.length)selections.push(freeze({dimension,constraints}))}
  if(filters.propertyArea)selections.push(freeze({dimension:'propertyArea',rangeKey:filters.propertyArea}))
  if(filters.constructionArea)selections.push(freeze({dimension:'constructionArea',rangeKey:filters.constructionArea}))
  let current:readonly string[]=membership.listingIds,totalRequests=0
  const trail:Phase14FactStage[]=[]
  for(const selection of selections){
    const inputCount=current.length,matched=new Set<string>(),evidence:(FactEvidence|CategoryEvidence|AreaEvidence)[]=[]
    let requests=0
    try {
      if(current.length&&'constraints' in selection){
        const {dimension,constraints}=selection
        if(constraints.some(c=>c.kind!=='category')){
          // The existing 25-ID RPC selects only this fact dimension and no semantics.
          // Its mandatory geography envelope is validated, not used to reacquire a population.
          const rows=await readCanonicalListingEvidence([...current],{facts:[dimension],semantics:[]},{rpc:(name,args,options)=>{
            requests++
            let query
            try{query=supabaseAdmin.rpc(name,args,options)}catch{throw new QueryFailure()}
            // Preserve the SDK's builder contract while categorizing transport failures.
            return new Proxy(query,{get(target,key,receiver){
              if(key!=='then')return Reflect.get(target,key,receiver)
              return (resolve:(value:unknown)=>unknown,reject:(reason:unknown)=>unknown)=>
                Promise.resolve(target).then(response=>{
                  if(response.error)throw new QueryFailure()
                  return response
                },()=>{throw new QueryFailure()}).then(resolve,reject)
            }})
          }})
          const records=[...rows.values()]
          for(const row of records)if(numericalMatch(row.facts[0],dimension,constraints))matched.add(row.listing_id)
          evidence.push(freeze({kind:'canonical_fact_reader',dimension,records}))
        }
        const terms=constraints.flatMap(c=>c.kind==='category'?[c.termId]:[])
        if(terms.length){
          const rows:{listingId:string;termId:string}[]=[],seen=new Set<string>()
          for(const ids of chunks(current,MEMBERSHIP_CHUNK))for(const selected of chunks(terms,MEMBERSHIP_CHUNK)){
            let offset=0,expected:number|null=null,previousId:string|null=null,previousTerm:bigint|null=null
            do{
              requests++;let response
              try{response=await supabaseAdmin.from('listings_ontology_terms').select('listing_id,ontology_term_id::text',{count:'exact'})
                .in('listing_id',ids).in('ontology_term_id',selected).order('listing_id').order('ontology_term_id').range(offset,offset+PAGE_SIZE-1)}catch{throw new QueryFailure()}
              if(response?.error)throw new QueryFailure()
              const data=response?.data,count=response?.count
              if(!Array.isArray(data)||!Number.isSafeInteger(count)||count!<0||count!>ids.length*selected.length||expected!==null&&count!==expected||
                 data.length>PAGE_SIZE||offset+data.length>count!||!data.length&&offset<count!)fail()
              expected=count!
              for(const row of data){
                if(!row||typeof row.listing_id!=='string'||!uuid.test(row.listing_id)||!ids.includes(row.listing_id)||typeof row.ontology_term_id!=='string'||!selected.includes(row.ontology_term_id))fail()
                const id=row.listing_id,term=BigInt(row.ontology_term_id),key=id+':'+row.ontology_term_id
                if(seen.has(key)||previousId!==null&&(id<previousId||id===previousId&&term<=previousTerm!))fail()
                seen.add(key);previousId=id;previousTerm=term;matched.add(id);rows.push({listingId:id,termId:row.ontology_term_id})
              }offset+=data.length
            }while(offset<expected!)
          }evidence.push(freeze({kind:'recorded_category_membership',dimension,rows}))
        }
      }else if(current.length&&'rangeKey' in selection){
        const field=selection.dimension==='propertyArea'?'property_area':'construction_area'
        const bounds=selection.dimension==='propertyArea'?resolvePropertyAreaConstraint(selection.rangeKey):resolveConstructionAreaConstraint(selection.rangeKey)
        if(!bounds)fail()
        const rows:{listingId:string;value:string|null}[]=[]
        // Area queries have no RPC cardinality limit: encoded UUID budget controls batches.
        for(const ids of chunks(current,Infinity)){
          let offset=0,previous:string|null=null;const seen=new Set<string>()
          do{
            requests++;let response
            try{response=await supabaseAdmin.from('listings').select(`id,${field}::text`,{count:'exact'}).in('id',ids).order('id').range(offset,offset+PAGE_SIZE-1)}catch{throw new QueryFailure()}
            if(response?.error)throw new QueryFailure()
            const data=response?.data,count=response?.count
            if(!Array.isArray(data)||count!==ids.length||data.length>PAGE_SIZE||offset+data.length>count||!data.length&&offset<count)fail()
            for(const row of data){
              if(!row||typeof row.id!=='string'||!uuid.test(row.id)||!ids.includes(row.id)||seen.has(row.id)||previous!==null&&row.id<=previous)fail()
              const raw:unknown=field==='property_area'&&'property_area' in row?row.property_area:
                field==='construction_area'&&'construction_area' in row?row.construction_area:undefined
              const value=raw===null?null:decimal(raw)
              if(value!==null&&compare(value,'0')<=0)fail() // Canonical measurements are strictly positive.
              seen.add(row.id);previous=row.id;rows.push({listingId:row.id,value})
              if(value!==null&&(bounds.min===null||compare(value,String(bounds.min))>=0)&&(bounds.max===null||compare(value,String(bounds.max))<0))matched.add(row.id)
            }offset+=data.length
          }while(offset<ids.length)
        }evidence.push(freeze({kind:'exact_area_scalar',dimension:selection.dimension,rows}))
      }
    }catch(error){return error instanceof QueryFailure?freeze({...provenance,state:'execution_failed',dimension:selection.dimension,reason:'evidence_query_failed'}):
      freeze({...provenance,state:'incomplete',dimension:selection.dimension,reason:'incomplete_or_incoherent_evidence'})}
    current=freeze(current.filter(id=>matched.has(id)));totalRequests+=requests
    trail.push(freeze({selection,inputCount,survivorCount:current.length,excludedCount:inputCount-current.length,
      execution:inputCount?'queried':'empty_input',completeness:completeness(requests),evidence}))
  }
  const result:Phase14FactPopulation=freeze({...provenance,state:'complete',withinDimension:'OR',acrossDimensions:'AND',trail,listingIds:current,
    survivingListingCount:current.length,excludedListingCount:membership.survivingListingCount-current.length,completeness:completeness(totalRequests)})
  owners.set(result,freeze({envelope,membership}));return result
}
export function assertPhase14FactPopulationForExecution(value:Phase14FactAcquisition,envelope:Phase14ExecutionEnvelope,membership:Phase14MembershipAcquisition):asserts value is Phase14FactPopulation {
  assertPhase14ExecutionEnvelope(envelope)
  if(!membership||membership.state!=='complete')throw new Error('Invalid Phase 14 membership population.')
  assertPhase14MembershipPopulationForExecution(membership,envelope,membership.fundamentalPopulation)
  const owner=value&&owners.get(value)
  if(!value||value.state!=='complete'||owner?.envelope!==envelope||owner.membership!==membership)throw new Error('Invalid Phase 14 fact population association.')
}
