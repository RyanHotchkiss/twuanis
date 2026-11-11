import 'server-only'
import {readBankProperty} from '@/app/actions/remates-public'
import {bankPath,exactMoney} from './remates/public-types'
import {projectBuyBankListing} from './remates/buy-marketplace'
import {type EngineRow,type Dictionary,type NumericalContext,type PopulationEngineRequest} from './population-engine-execution'
import {type AtomicPreferenceEvidence} from './canonical-market-preferences'
import {explainMarketPreference} from './market-matching-explanation'
import {FACTS,SEMANTICS,type Question} from './asking-price-contract'
import {matchesFact} from './asking-price-data'
import {validateQuestion,compare} from './asking-price-question'
import {resolvePropertyAreaConstraint,resolveConstructionAreaConstraint} from './market-intelligence-area-ranges'
import {buildNumericalDistribution} from './numerical-distribution'
import {normalizeAmountToCrc} from './currency-conversion'
import {type CanonicalMarketRequest} from './canonical-market-request'

const label=(term:any)=>({en:term?.term_name_en||term?.term_name||'',es:term?.term_name_es||term?.term_name||''})
/** Reuses the existing typed Asking Distribution membership predicates; no source acquisition. */
export function selectAskingRows(input:unknown,rows:EngineRow[],r:PopulationEngineRequest,terms:Dictionary){
 const question=validateQuestion(input)
 const transaction=r.scope.population==='RENT'?'rent':'sale'
 const geo=terms.get(r.scope.geography[question.geography.level]??'')
 if(question.transaction!==transaction||!geo||geo.official_code!==question.geography.officialCode||question.propertyType!==r.scope.propertyType)throw Error('Asking question and acquired scope differ.')
 const memberships=(row:EngineRow)=>new Set([...row.selections.map(s=>s.ontology_term_id),...row.facts.filter(f=>f.kind==='category').map(f=>f.category_term_id!)])
 const groups=[...(question.propertyType?[[question.propertyType]]:[]),...SEMANTICS.map(d=>question.filters.semantics[d]??[]).filter(g=>g.length)]
 const selected=rows.filter(row=>{
  const positive=memberships(row)
  if(!groups.every(group=>group.some(id=>positive.has(id))))return false
  for(const d of FACTS){const cs=question.filters.facts[d];if(cs?.length&&!matchesFact(row.facts.find(f=>f.dimension===d),d,cs)&&!cs.some(c=>c.kind==='category'&&positive.has(c.termId)))return false}
  for(const [key,field,resolve]of [['propertyArea','property_area',resolvePropertyAreaConstraint],['constructionArea','construction_area',resolveConstructionAreaConstraint]] as const){
   if(!question.filters[key])continue
   const bounds=resolve(question.filters[key]),raw=row.row[field]
   if(!bounds||typeof raw!=='string'||compare(raw,'0')<=0)return false
   if(bounds.min!==null&&compare(raw,String(bounds.min))<0||bounds.max!==null&&compare(raw,String(bounds.max))>=0)return false
  }
  return true
 })
 const labels:Record<string,{en:string;es:string}>={geography:label(geo)}
 for(const [id,term]of terms)labels[id]=label(term)
 return {question,selected,labels}
}
export function askingResult(input:unknown,rows:EngineRow[],r:PopulationEngineRequest,terms:Dictionary,context:NumericalContext){
 const {question,selected,labels}=selectAskingRows(input,rows,r,terms)
 const exclusions={missingAmount:0,invalidAmount:0,unsupportedCurrency:0},prices:number[]=[]
 for(const item of selected){const raw=question.transaction==='rent'?item.row.monthly_price:item.row.current_price
  if(raw===null||raw===undefined){exclusions.missingAmount++;continue}
  if(!['CRC','USD'].includes(item.row.currency)){exclusions.unsupportedCurrency++;continue}
  const amount=Number(raw);if(!Number.isFinite(amount)||amount<=0){exclusions.invalidAmount++;continue}
  if(item.row.currency==='USD'&&!context.fx)throw Error('Missing committed FX.')
  prices.push(normalizeAmountToCrc({amount,currency:item.row.currency,usdToCrcRate:context.fx?.rate??1}))
 }
 return {ok:true as const,result:{schemaVersion:1 as const,engine:'market-asking-price-distribution' as const,question,questionIdentity:JSON.stringify(question),labels,outcome:!selected.length?'empty_market' as const:!prices.length?'no_eligible_prices' as const:'complete' as const,marketPopulation:selected.length,askingPricePopulation:prices.length,exclusions,currency:'CRC' as const,unit:question.transaction==='rent'?'monthly_asking_price' as const:'total_asking_price' as const,analyticalDate:context.date,fx:context.fx,methodology:'linear_interpolation_n_minus_1_p' as const,statistics:buildNumericalDistribution(prices),completeness:{complete:true as const,snapshotGuaranteed:false as const}}}
}
/** Display authority is the existing public Bank reader, never an ordinary UUID lookup. */
export async function bankCards(ids:readonly string[],items:EngineRow[],language:'en'|'es'){
 const output=new Map<string,ReturnType<typeof projectBuyBankListing>>()
 for(const id of ids){const item=items.find(row=>row.id===id)
  if(!item||item.population!=='BANK'||!id.startsWith('BANK:'))throw Error('Invalid Bank card identity.')
  const response=await readBankProperty(id.slice(5))
  if(!response.ok||!response.data.enabled||response.data.items.length!==1||response.data.items[0].id!==id.slice(5)||response.data.items[0].offering_id!==item.row.bankOfferingId||response.data.items[0].properties.length!==1||response.data.items[0].properties[0].id!==item.row.bankPropertyId)throw Error('Bank display authority unavailable.')
  output.set(id,projectBuyBankListing(response.data.items[0],language,null))
 }
 return output
}
export async function matchingResult(r:PopulationEngineRequest,items:EngineRow[],q:CanonicalMarketRequest,ranked:readonly {id:string;preferences:readonly AtomicPreferenceEvidence[];matchScore:number|null;matchState:string;confirmedMatches:number;confirmedNonmatches:number;unknown:number}[],terms:Dictionary){
 if(r.scope.population!=='BANK')throw Error('Bank-specific presentation requires Bank authority.')
 const displayed=ranked.slice(0,12),cards=await bankCards(displayed.map(x=>x.id),items,r.language)
 const evidence={canonical:new Map(items.map(i=>[i.id,{listing_id:i.id,canonical_domain_version:1 as const,facts:i.facts,selections:i.selections,geography:i.geography}])),classifications:new Map(items.map(i=>[i.id,new Set(i.selections.map(s=>s.ontology_term_id))]))}
 return {language:r.language,filters:r.filters??{},totalListings:items.length,listings:displayed.map(result=>{
  const row=items.find(i=>i.id===result.id)!,card=cards.get(result.id)!
  const geo=(dimension:string)=>{const t=row.geography.find(t=>t.term_type===dimension);return t?label(t)[r.language]:null}
  const fact=(dimension:string)=>{const f=row.facts.find(f=>f.dimension===dimension);return f?.kind==='exact'?f.exact_value:f?.kind==='category'?label(terms.get(f.category_term_id!))[r.language]:null}
  const names:Record<string,[string,string]>={property_area:['Property Area','Área del terreno'],construction_area:['Construction Area','Área de construcción'],year_built:['Year Built','Año de construcción'],distance_to_paved_road:['Distance to paved road','Distancia a carretera pavimentada']}
  const preferences=result.preferences.map(p=>({...p,label:names[p.dimension]?.[r.language==='es'?1:0]??p.label,explanation:explainMarketPreference(q,row.row,evidence,p)}))
  return {id:result.id,bankListingId:card.id,url:`${bankPath(r.language)}/${card.id}`,transaction:'bank',province:geo('province'),canton:geo('canton'),property_type:card.marketplace_property_type_label??null,bedrooms:fact('bedrooms'),bathrooms:fact('bathrooms'),title:card.title,images:card.images.slice(0,1),formattedPrice:row.row.current_price!==null?`${row.row.currency} ${exactMoney(row.row.originalPrice??String(row.row.current_price),r.language)}`:null,matchScore:result.matchScore,matchState:result.matchState,confirmedMatches:result.confirmedMatches,confirmedNonmatches:result.confirmedNonmatches,unknown:result.unknown,preferences,matchReasons:preferences.filter(p=>p.state==='MATCH').map(p=>p.label),missingFeatures:preferences.filter(p=>p.state==='NONMATCH').map(p=>p.label),unknownFeatures:preferences.filter(p=>p.state==='UNKNOWN').map(p=>p.label)}
 })}
}
