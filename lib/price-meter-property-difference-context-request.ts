import { parsePositionRequest, type PositionRequest } from './price-meter-property-position-request'
export const MAX_CHARACTERISTIC_COMPARISONS=4
export const MAX_CONTEXT_QUESTIONS=7
export const CONTEXT_KEYS=['geographic_children','property_area_to_land_normalized_ratio','construction_area_to_construction_normalized_ratio','construction_land_land','construction_land_construction','characteristic_comparison'] as const
export type ContextKey=typeof CONTEXT_KEYS[number]
export type ContextSelection={questionKey:Exclude<ContextKey,'characteristic_comparison'>} | {questionKey:'characteristic_comparison';params:Record<string,string>}
export type DifferenceRequest={positionRequest:PositionRequest;contexts:ContextSelection[]}
export const COMPARISON_FIELDS=['province','canton','district','property_type','characteristic_1_type','characteristic_1','characteristic_2_type','characteristic_2','property_area','construction_area','construction_land_cohort'] as const
const fields=new Set(['reference_cohort',...['a','b'].flatMap(p=>COMPARISON_FIELDS.map(k=>p+'_'+k))])
function object(v:unknown): asserts v is Record<string,unknown> {if(!v||typeof v!=='object'||Array.isArray(v))throw new Error('Invalid context request.')}
function keys(v:Record<string,unknown>,expected:string[]) {if(Object.keys(v).length!==expected.length||Object.keys(v).some(k=>!expected.includes(k)))throw new Error('Invalid context fields.')}
export function parseDifferenceRequest(input:unknown):DifferenceRequest {
 object(input);keys(input,['positionRequest','contexts'])
 const positionRequest=parsePositionRequest(input.positionRequest) as PositionRequest
 if(!Array.isArray(input.contexts)||input.contexts.length>MAX_CONTEXT_QUESTIONS)throw new Error('Context limit exceeded.')
 const seen=new Set<string>();let comparisons=0
 const contexts=input.contexts.map(raw=>{
  object(raw)
  if(!CONTEXT_KEYS.includes(raw.questionKey as ContextKey))throw new Error('Unknown context.')
  if(raw.questionKey==='characteristic_comparison'){
   keys(raw,['questionKey','params']);object(raw.params)
   if(++comparisons>MAX_CHARACTERISTIC_COMPARISONS)throw new Error('Comparison limit exceeded.')
   const params:Record<string,string>={}
   for(const [k,v] of Object.entries(raw.params)){if(!fields.has(k)||typeof v!=='string'||v.length>160)throw new Error('Invalid comparison intent.');params[k]=v.trim()}
   if(params.reference_cohort!=='A'&&params.reference_cohort!=='B')throw new Error('Explicit reference required.')
   const key=JSON.stringify(Object.entries(params).sort(([a],[b])=>a.localeCompare(b)))
   if(seen.has(key))throw new Error('Duplicate comparison.');seen.add(key)
   return {questionKey:'characteristic_comparison',params} as ContextSelection
  }
  keys(raw,['questionKey'])
  const key=String(raw.questionKey).includes('_area_to_')?'size':String(raw.questionKey).startsWith('construction_land_')?'construction_land':String(raw.questionKey)
  if(seen.has(key))throw new Error('Duplicate family.');seen.add(key)
  return {questionKey:raw.questionKey} as ContextSelection
 })
 return {positionRequest,contexts}
}
