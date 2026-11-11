import 'server-only'
import { PRICE_METER_COMPARABLE_DIMENSION_ORDER } from './price-meter-comparable-dimensions'
import type {Question,HypotheticalSubject,Dimension} from './property-price-valuation-contract'
export class InvalidValuationQuestion extends Error {}
export function invalid():never{throw new InvalidValuationQuestion('Invalid committed comparable question')}
export const listingIdPattern=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
function object(v:unknown,keys:string[]):Record<string,any>{if(!v||typeof v!=='object'||Array.isArray(v)||Object.keys(v).some(k=>!keys.includes(k)))invalid();return v as Record<string,any>}
export function termId(v:unknown):number {if(!Number.isSafeInteger(v)||Number(v)<=0)invalid();return v as number}
function exact(v:unknown):number{if(typeof v!=='number'||!Number.isFinite(v)||v<=0)invalid();return v}
export function validateValuationQuestion(input:unknown):Question{
 const q=object(input,['subject','geographyLevel','normalization','activeDimensions'])
 if(!['province','canton','district'].includes(q.geographyLevel)||!['land','construction'].includes(q.normalization)||!Array.isArray(q.activeDimensions)||q.activeDimensions.length>PRICE_METER_COMPARABLE_DIMENSION_ORDER.length||new Set(q.activeDimensions).size!==q.activeDimensions.length||q.activeDimensions.some((d:any)=>!PRICE_METER_COMPARABLE_DIMENSION_ORDER.includes(d)))invalid()
 const activeDimensions=PRICE_METER_COMPARABLE_DIMENSION_ORDER.filter(d=>q.activeDimensions.includes(d)) as Dimension[]
 const s=q.subject;let subject:Question['subject']
 if(s?.kind==='listing'){object(s,['kind','listingId']);if(typeof s.listingId!=='string'||!listingIdPattern.test(s.listingId))invalid();subject={kind:'listing',listingId:s.listingId.toLowerCase()}}
 else {
  object(s,['kind','transaction','province','canton','district','propertyType','propertyArea','constructionArea','characteristics','askingPrice'])
  if(s.kind!=='hypothetical'||!['sale','rent'].includes(s.transaction))invalid()
  const chars=object(s.characteristics,PRICE_METER_COMPARABLE_DIMENSION_ORDER.filter(d=>d!=='construction_land'))
  const characteristics:HypotheticalSubject['characteristics']={}
  for(const d of PRICE_METER_COMPARABLE_DIMENSION_ORDER)if(d!=='construction_land'&&chars[d]!==undefined)characteristics[d]=termId(chars[d])
  let askingPrice:HypotheticalSubject['askingPrice']=null
  if(s.askingPrice!==null){const p=object(s.askingPrice,['amount','currency']);if(p.currency!=='CRC'&&p.currency!=='USD')invalid();askingPrice={amount:exact(p.amount),currency:p.currency}}
  subject={kind:'hypothetical',transaction:s.transaction,province:termId(s.province),canton:termId(s.canton),district:s.district===null?null:termId(s.district),propertyType:termId(s.propertyType),propertyArea:exact(s.propertyArea),constructionArea:s.constructionArea===null?null:exact(s.constructionArea),characteristics,askingPrice}
 }
 return {subject,geographyLevel:q.geographyLevel,normalization:q.normalization,activeDimensions}
}
