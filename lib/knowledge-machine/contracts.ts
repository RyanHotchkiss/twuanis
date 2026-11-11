import 'server-only'
import {CATEGORIES, type Category, type Locale} from '@/lib/knowledge-repository/core'

/** Candidate wire contracts only. No transport, credential issuance or public activation. */
export const CONTRACT_VERSION='KA06-2026-10-16-R1'
export const MCP_VERSION='2026-07-28'
export const OPERATIONS=['lookupDefinition','listCategory','getRelationships','searchKnowledge','getApprovedMethodology','getPackageDescription','getListing'] as const
export type Operation=typeof OPERATIONS[number]
export type RequestLimits=Readonly<{maxRequestBytes:number;maxPageSize:number;maxDepth:number;maxReferenceBytes:number}>
export type KnowledgeRequest={contractVersion:typeof CONTRACT_VERSION;operation:Operation;locale:Locale;category?:Category;reference?:string;query?:string;pageSize:number;cursor?:string;depth?:number}
export class KnowledgeContractError extends Error {
 constructor(readonly code:'INVALID_REQUEST'|'BOUNDS_EXCEEDED'|'SOURCE_UNAVAILABLE'){super(code);this.name='KnowledgeContractError'}
}
const invalid=():never=>{throw new KnowledgeContractError('INVALID_REQUEST')}
const bytes=(s:string)=>Buffer.byteLength(s,'utf8')
const keys=['contractVersion','operation','locale','category','reference','query','pageSize','cursor','depth']
/** Limits come from server configuration; request-supplied policy, principal and scopes are rejected. */
export function validateKnowledgeRequest(value:unknown,limits:RequestLimits|null):KnowledgeRequest{
 if(!limits||Object.keys(limits).sort().join(',')!=='maxDepth,maxPageSize,maxReferenceBytes,maxRequestBytes'||Object.values(limits).some(v=>!Number.isSafeInteger(v)||v<1))throw new KnowledgeContractError('SOURCE_UNAVAILABLE')
 if(!value||typeof value!=='object'||Array.isArray(value)||Object.getPrototypeOf(value)!==Object.prototype)invalid()
 const v=value as Record<string,unknown>
 if(Object.keys(v).some(k=>!keys.includes(k))||v.contractVersion!==CONTRACT_VERSION||!OPERATIONS.includes(v.operation as Operation)||!['en','es'].includes(v.locale as string))invalid()
 if(!Number.isSafeInteger(v.pageSize)||(v.pageSize as number)<1||(v.pageSize as number)>limits.maxPageSize)throw new KnowledgeContractError('BOUNDS_EXCEEDED')
 for(const key of ['reference','query','cursor'])if(v[key]!==undefined&&(typeof v[key]!=='string'||!v[key]||/[\u0000-\u001f\u007f]/.test(v[key] as string)))invalid()
 if(v.reference!==undefined&&bytes(v.reference as string)>limits.maxReferenceBytes)throw new KnowledgeContractError('BOUNDS_EXCEEDED')
 // Accepted KA-01 structural query bound, not a request-rate/capacity claim.
 if(v.query!==undefined&&bytes(v.query as string)>256)throw new KnowledgeContractError('BOUNDS_EXCEEDED')
 if(v.cursor!==undefined&&bytes(v.cursor as string)>limits.maxRequestBytes)throw new KnowledgeContractError('BOUNDS_EXCEEDED')
 if(v.category!==undefined&&!CATEGORIES.includes(v.category as Category))invalid()
 if(v.depth!==undefined&&(!Number.isSafeInteger(v.depth)||(v.depth as number)<1||(v.depth as number)>limits.maxDepth))throw new KnowledgeContractError('BOUNDS_EXCEEDED')
 const required:Record<Operation,string[]>={lookupDefinition:['reference'],listCategory:['category'],getRelationships:['reference','depth'],searchKnowledge:['query'],getApprovedMethodology:['reference'],getPackageDescription:['reference'],getListing:['reference']}
 const permitted:Record<Operation,string[]>={lookupDefinition:['reference'],listCategory:['category','cursor'],getRelationships:['reference','depth','cursor'],searchKnowledge:['query','category','cursor'],getApprovedMethodology:['reference'],getPackageDescription:['reference'],getListing:['reference']}
 const op=v.operation as Operation
 if(required[op].some(k=>v[k]===undefined)||['category','reference','query','cursor','depth'].some(k=>v[k]!==undefined&&!permitted[op].includes(k)))invalid()
 if(bytes(JSON.stringify(v))>limits.maxRequestBytes)throw new KnowledgeContractError('BOUNDS_EXCEEDED')
 return {contractVersion:CONTRACT_VERSION,operation:op,locale:v.locale as Locale,pageSize:v.pageSize as number,...v.category!==undefined?{category:v.category as Category}:{},...v.reference!==undefined?{reference:v.reference as string}:{},...v.query!==undefined?{query:v.query as string}:{},...v.cursor!==undefined?{cursor:v.cursor as string}:{},...v.depth!==undefined?{depth:v.depth as number}:{}}
}
