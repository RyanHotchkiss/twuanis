// Browser transport and input syntax only. Analytical execution is server-only.
import {canonicalDecimal,parseRatioQuestion,type RatioQuestion,type RatioEvidence} from './asking-area-ratio-contract'
export const weightedTitle={en:'Weighted Price / m²',es:'Precio ponderado por m²'}
export const weightedQuestion={en:"What is this property's Price / m² when Property Area and Construction Area are weighted by their modeled asking-price relationships in the selected market?",es:'¿Cuál es el precio por m² de esta propiedad cuando las áreas del terreno y de construcción se ponderan por sus relaciones modeladas con el precio de oferta en el mercado seleccionado?'}
export type WeightedQuestion={cohort:RatioQuestion;subject:{kind:'listing';listingId:string}|{kind:'hypothetical';propertyArea:string;constructionArea:string;province:string;canton:string;district:string|null;askingPrice:{amount:string;currency:'CRC'|'USD'}|null}}
function object(v:unknown,keys:string[]):Record<string,unknown>{if(!v||typeof v!=='object'||Array.isArray(v)||Object.keys(v).length!==keys.length||keys.some(k=>!Object.hasOwn(v,k)))throw Error('Invalid question');return v as Record<string,unknown>}
export function parseWeightedQuestion(input:unknown):WeightedQuestion{
 const q=object(input,['cohort','subject']),cohort=parseRatioQuestion(q.cohort),raw=q.subject as Record<string,unknown>|null
 if(raw?.kind==='listing'){const s=object(raw,['kind','listingId']);if(typeof s.listingId!=='string'||! /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(s.listingId))throw Error('Invalid listing');return{cohort,subject:{kind:'listing',listingId:s.listingId}}}
 const s=object(raw,['kind','propertyArea','constructionArea','province','canton','district','askingPrice']);if(s.kind!=='hypothetical')throw Error('Invalid subject')
 const id=(v:unknown)=>parseRatioQuestion({...cohort,geography:{level:'province',termId:v}}).geography.termId
 let askingPrice:Extract<WeightedQuestion['subject'],{kind:'hypothetical'}>['askingPrice']=null
 if(s.askingPrice!==null){const p=object(s.askingPrice,['amount','currency']);if(p.currency!=='CRC'&&p.currency!=='USD')throw Error('Invalid currency');askingPrice={amount:canonicalDecimal(p.amount),currency:p.currency}}
 return{cohort,subject:{kind:'hypothetical',propertyArea:canonicalDecimal(s.propertyArea),constructionArea:canonicalDecimal(s.constructionArea),province:id(s.province),canton:id(s.canton),district:s.district===null?null:id(s.district),askingPrice}}
}
export type WeightedEvidence={weighting:RatioEvidence}&({state:'weighting_not_established'}|{state:'weighting_not_applicable'}|({distribution:{p25:number;median:number;p75:number;n:number}}&({state:'distribution_only'}|{state:'subject_position';subject:{weightedPrice:number;belowCount:number;equalCount:number;aboveCount:number;percentilePosition:number;difference:number;percentDifference:number}})))
export type WeightedSuccess={question:WeightedQuestion;evidence:WeightedEvidence;analyticalDate:string;methodology:string;excluded:number;participation:'subject_excluded'|'no_subject_identity';subjectAreas:{propertyArea:number;constructionArea:number};subjectMoney:{amount:number;currency:'CRC'|'USD';normalizedAmount:number}|null;fx:{rate:number;effectiveDate:string;source:string;resolutionMode:string}|null;marketLabel:{en:string;es:string};propertyTypeLabel:{en:string;es:string}}
export type WeightedResponse=WeightedSuccess|{access:'authentication_required'|'entitlement_required'}|{error:'invalid_question'|'execution_unavailable'}
