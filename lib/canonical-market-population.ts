import 'server-only'
import {validateOntologyTermId} from './geography/dta-identity'
import { supabaseAdmin } from './supabase-admin'

// Neutral population transport only. Callers own authorization, the question,
// typed fact reduction, participation, analytical eligibility, and mathematics.
export type CanonicalMarketBoundary = Readonly<{
  transaction: 'sale' | 'rent' | null
  // AND between groups; OR within a group. Atomic AND preferences are never
  // passed here by Matching; Configuration can use singleton requirement groups.
  membershipGroups: readonly (readonly string[])[]
  propertyArea?: Readonly<{min:number|null;max:number|null}>
  constructionArea?: Readonly<{min:number|null;max:number|null}>
}>
const FIELDS = ['id','canonical_domain_version','listing_status','transaction_type','currency',
  'current_price','monthly_price','property_area','construction_area','created_at'] as const
export type MarketScalarField = typeof FIELDS[number]
type Client = Pick<typeof supabaseAdmin,'from'>
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
function fail():never {throw new Error('Incomplete or invalid canonical market population.')}
function validate(b:CanonicalMarketBoundary) {
  if(!b||b.transaction!==null&&b.transaction!=='sale'&&b.transaction!=='rent'||
      !Array.isArray(b.membershipGroups)||b.membershipGroups.length>32)fail()
  for(const group of b.membershipGroups){
    if(!Array.isArray(group)||!group.length||group.length>64||new Set(group).size!==group.length)fail()
    for(const id of group)validateOntologyTermId(id)
  }
  for(const r of [b.propertyArea,b.constructionArea])if(r){
    for(const n of [r.min,r.max])if(n!==null&&(!Number.isFinite(n)||n<0))fail()
    if(r.min!==null&&r.max!==null&&r.min>=r.max)fail()
  }
}
function query(b:CanonicalMarketBoundary,fields:readonly MarketScalarField[],head:boolean,client:Client) {
  validate(b)
  if(!fields.length||fields.some(f=>!FIELDS.includes(f))||new Set(fields).size!==fields.length)fail()
  // Each embedded inner relationship is an EXISTS-style filter of the parent
  // listings result. Empty embeds avoid transporting membership/presentation rows.
  const joins=b.membershipGroups.map((_,i)=>`m${i}:listings_ontology_terms!inner()`)
  let q:any=client.from('listings').select([...fields,...joins].join(','),{count:'exact',head})
    .eq('canonical_domain_version',1).eq('listing_status','active')
  q=b.transaction?q.eq('transaction_type',b.transaction):q.in('transaction_type',['sale','rent'])
  b.membershipGroups.forEach((group,i)=>{q=q.in(`m${i}.ontology_term_id`,[...group])})
  for(const [field,r]of [['property_area',b.propertyArea],['construction_area',b.constructionArea]] as const)if(r){
    if(r.min!==null)q=q.gte(field,r.min)
    if(r.max!==null)q=q.lt(field,r.max)
  }
  return q
}
export async function countCanonicalMarket(b:CanonicalMarketBoundary,client:Client=supabaseAdmin):Promise<number>{
  const {error,count}=await query(b,['id'],true,client)
  if(error||!Number.isSafeInteger(count)||count<0)fail()
  return count
}
export async function readCanonicalMarketScalars(
  b:CanonicalMarketBoundary,fields:readonly MarketScalarField[],client:Client=supabaseAdmin,
):Promise<Record<string,any>[]> {
  const selected=[...new Set(['id',...fields])] as MarketScalarField[],rows:Record<string,any>[]=[],seen=new Set<string>()
  let expected:number|null=null,last=''
  do {
    const {data,error,count}=await query(b,selected,false,client).order('id').range(rows.length,rows.length+499)
    if(error||!Array.isArray(data)||!Number.isSafeInteger(count)||count<0||expected!==null&&count!==expected||
      data.length>500||rows.length+data.length>count||!data.length&&rows.length<count)fail()
    expected=count
    for(const row of data){
      if(!row||typeof row.id!=='string'||!uuid.test(row.id)||seen.has(row.id)||row.id<=last)fail()
      // Never pass embedded objects or unrequested fields through the authority.
      const scalar:Record<string,any>={}
      for(const field of selected){if(!Object.hasOwn(row,field))fail();scalar[field]=row[field]}
      seen.add(row.id);last=row.id;rows.push(scalar)
    }
  }while(rows.length<expected!)
  return rows
}
