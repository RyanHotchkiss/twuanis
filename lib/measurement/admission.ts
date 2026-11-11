import {validSupportEvent} from '@/lib/support/contract'
import {safeLaunchPageLocation} from './attribution'
import schemas from './schemas.json'
import type {EventName,EventPayloads} from './types'
type S = {type?:string;const?:unknown;enum?:unknown[];required?:string[];properties?:Record<string,S>;items?:S;minimum?:number;maximum?:number;minLength?:number;maxLength?:number;minItems?:number;maxItems?:number;minProperties?:number;maxProperties?:number;pattern?:string;additionalProperties?:boolean;allOf?:S[];if?:S;then?:S;else?:S;not?:S}
export function conforms(s:S,v:unknown):boolean {
 if(s.const!==undefined&&v!==s.const||s.enum&&!s.enum.includes(v))return false
 if(s.not&&conforms(s.not,v))return false
 if(s.allOf&&!s.allOf.every(x=>conforms(x,v)))return false
 if(s.if&&!conforms(conforms(s.if,v)?s.then||{}:s.else||{},v))return false
 if(s.type==='string'&&(typeof v!=='string'||v.length<(s.minLength||0)||v.length>(s.maxLength??Infinity)||s.pattern&&!new RegExp(s.pattern).test(v)))return false
 if((s.type==='integer'||s.type==='number')&&(typeof v!=='number'||!Number.isFinite(v)||s.type==='integer'&&!Number.isInteger(v)||v<(s.minimum??-Infinity)||v>(s.maximum??Infinity)))return false
 if(s.type==='array'&&(!Array.isArray(v)||v.length<(s.minItems||0)||v.length>(s.maxItems??Infinity)||s.items&&!v.every(x=>conforms(s.items!,x))))return false
 if((s.type==='object'||s.properties||s.required)&&v&&typeof v==='object'&&!Array.isArray(v)){
 const o=v as Record<string,unknown>,keys=Object.keys(o);if(keys.length<(s.minProperties||0)||keys.length>(s.maxProperties??Infinity)||s.required?.some(k=>!(k in o)))return false
 for(const k of keys)if(s.properties?.[k]){if(!conforms(s.properties[k],o[k]))return false}else if(s.additionalProperties===false)return false
 }else if(s.type==='object')return false
 return true
}
const disabled=new Set(['tw_sponsored_exposure','tw_sponsored_engagement','tw_sponsored_conversion','tw_trei_interaction','tw_context_part','refund','tw_contact_result'])
const unsafe=/(?:@|\b(?:bearer|password|access_token|refresh_token|sinpe)\b|https?:\/\/[^\s]*[?#])/i
const authoritative=new Set(['begin_checkout','tw_payment_state','purchase','tw_entitlement_state','tw_execution_request','tw_authorization','tw_execution_result','tw_report_ready','tw_report_retrieve','tw_analysis_save','sign_up'])
export function admit<N extends EventName>(name:N,p:EventPayloads[N],source:'browser'|'server'='browser'):boolean {
 try {if(name==='tw_support_interaction'&&!validSupportEvent(p as EventPayloads['tw_support_interaction']))return false;if(source==='browser'&&authoritative.has(name))return false;if(disabled.has(name)||!Object.hasOwn(schemas,name)||!conforms((schemas as unknown as Record<string,S>)[name],p))return false
 const strings=(v:unknown,s:S):boolean=>typeof v==='string'?!!s.enum?.includes(v)||!unsafe.test(v):Array.isArray(v)?v.every(x=>strings(x,s.items||{})):v!==null&&typeof v==='object'?Object.entries(v).every(([k,x])=>strings(x,s.properties?.[k]||{})):true
 if(name==='page_view'&&typeof (p as any).page_location==='string'&&safeLaunchPageLocation((p as any).page_location,(p as any).environment==='isolated_test'))return strings({...p,page_location:'approved_launch_page'},(schemas as unknown as Record<string,S>)[name]);return strings(p,(schemas as unknown as Record<string,S>)[name])
 }catch{return false}
}
