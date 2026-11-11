import 'server-only'
import {createHash} from 'node:crypto'
import {CATEGORIES} from '@/lib/knowledge-repository/core'
import {validateKnowledgeRequest,OPERATIONS,type RequestLimits} from './contracts'

/** Contract evidence validation only. Never authenticates a bearer token, reserves capacity,
 * grants retrieval, persists usage, or substitutes OWNER_INSPECTION for a machine principal. */
export type MachinePolicy={revision:string;issuer:string;audience:string;request:RequestLimits;maxResponseBytes:number;maxClientConcurrent:number;maxAccountConcurrent:number;maxClientRequests:number;maxAccountRequests:number;windowMs:number;timeoutMs:number;maxEvidenceAgeMs:number}
export type MachineContext={purpose:'MACHINE_KNOWLEDGE';clientId:string;credentialId:string;accountId:string;issuer:string;audience:string;status:'ACTIVE'|'PENDING'|'REVOKED'|'EXPIRED';issuedAt:number;expiresAt:number;revokedAt:number|null;verifiedAt:number;authorityRevision:string}
export type AuthorizationEvidence={decision:'ALLOW'|'DENY';clientId:string;accountId:string;requestDigest:string;category:typeof CATEGORIES[number];resourceRef:string|null;permissionRevision:string;policyRevision:string;checkedAt:number}
export type PublicationEvidence={state:'PUBLISHED'|'UNPUBLISHED'|'WITHDRAWN';identityEligible:boolean;category:typeof CATEGORIES[number];resourceRef:string|null;sourceRevision:string;checkedAt:number}
export type AdmissionEvidence={clientId:string;accountId:string;requestId:string;requestDigest:string;policyRevision:string;checkedAt:number;windowStart:number;clientRequests:number;accountRequests:number;clientConcurrent:number;accountConcurrent:number;retry:'NEW'|'DUPLICATE'|'CONFLICT'}
export type ContractAssessment={eligible:boolean;operational:false;code:'CONTRACT_ELIGIBLE'|'AUTHENTICATION_REQUIRED'|'INVALID_CREDENTIAL'|'DENIED'|'UNPUBLISHED'|'LIMIT_REACHED'|'DUPLICATE'|'RETRY_CONFLICT'|'UNAVAILABLE'|'INVALID_REQUEST'}
const object=(v:unknown,keys:string[]):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v)&&Object.getPrototypeOf(v)===Object.prototype&&Object.keys(v).length===keys.length&&Object.keys(v).every(k=>keys.includes(k))
const integer=(v:unknown):v is number=>Number.isSafeInteger(v)&&(v as number)>=0
const positive=(v:unknown):v is number=>integer(v)&&(v as number)>0
const string=(v:unknown):v is string=>typeof v==='string'&&v.length>0&&!/[\u0000-\u001f\u007f]/.test(v)
const uuid=(v:unknown):v is string=>typeof v==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v)
const hash=(v:unknown):v is string=>typeof v==='string'&&/^[a-f0-9]{64}$/.test(v)
const fresh=(v:unknown,now:number,budget:number):v is number=>integer(v)&&v<=now&&now-v<=budget
const answer=(code:ContractAssessment['code']):ContractAssessment=>({eligible:code==='CONTRACT_ELIGIBLE',operational:false,code})
export function validateMachinePolicy(value:unknown):value is MachinePolicy{
 if(!object(value,['revision','issuer','audience','request','maxResponseBytes','maxClientConcurrent','maxAccountConcurrent','maxClientRequests','maxAccountRequests','windowMs','timeoutMs','maxEvidenceAgeMs'])||!string(value.revision)||!string(value.issuer)||!string(value.audience)||!object(value.request,['maxRequestBytes','maxPageSize','maxDepth','maxReferenceBytes'])||Object.values(value.request).some(v=>!positive(v)))return false
 return ['maxResponseBytes','maxClientConcurrent','maxAccountConcurrent','maxClientRequests','maxAccountRequests','windowMs','timeoutMs','maxEvidenceAgeMs'].every(k=>positive(value[k]))
}
export function validateMachineContext(value:unknown,policy:MachinePolicy,now:number):value is MachineContext{
 if(!integer(now)||!object(value,['purpose','clientId','credentialId','accountId','issuer','audience','status','issuedAt','expiresAt','revokedAt','verifiedAt','authorityRevision']))return false
 return value.purpose==='MACHINE_KNOWLEDGE'&&string(value.clientId)&&string(value.credentialId)&&uuid(value.accountId)&&value.issuer===policy.issuer&&value.audience===policy.audience&&value.status==='ACTIVE'&&integer(value.issuedAt)&&integer(value.expiresAt)&&value.issuedAt<=now&&value.expiresAt>now&&value.issuedAt<value.expiresAt&&value.revokedAt===null&&fresh(value.verifiedAt,now,policy.maxEvidenceAgeMs)&&value.verifiedAt>=value.issuedAt&&string(value.authorityRevision)
}
/** Both adapters must use the same evidence shape and current policy. This result is NOT a capability. */
export function assessMachineContract(rawRequest:unknown,rawContext:unknown,authorization:unknown,publication:unknown,admission:unknown,rawPolicy:unknown,now:number):ContractAssessment{
 if(!integer(now)||!validateMachinePolicy(rawPolicy))return answer('UNAVAILABLE')
 const policy=rawPolicy
 let request:ReturnType<typeof validateKnowledgeRequest>
 try{request=validateKnowledgeRequest(rawRequest,policy.request)}catch{return answer('INVALID_REQUEST')}
 if(rawContext===null||rawContext===undefined)return answer('AUTHENTICATION_REQUIRED')
 if(!validateMachineContext(rawContext,policy,now))return answer('INVALID_CREDENTIAL')
 const context=rawContext,digest=createHash('sha256').update(JSON.stringify(request)).digest('hex')
 if(!object(authorization,['decision','clientId','accountId','requestDigest','category','resourceRef','permissionRevision','policyRevision','checkedAt'])||authorization.decision!=='ALLOW'||authorization.clientId!==context.clientId||authorization.accountId!==context.accountId||authorization.requestDigest!==digest||!CATEGORIES.includes(authorization.category as typeof CATEGORIES[number])||request.category!==undefined&&authorization.category!==request.category||authorization.resourceRef!==(request.reference??null)||!string(authorization.permissionRevision)||authorization.policyRevision!==policy.revision||!fresh(authorization.checkedAt,now,policy.maxEvidenceAgeMs))return answer('DENIED')
 // Operation-implied categories cannot be changed by a supplied scope decision.
 if(request.operation==='getApprovedMethodology'&&authorization.category!=='methodologies'||request.operation==='getPackageDescription'&&authorization.category!=='packages'||request.operation==='getRelationships'&&authorization.category!=='relationships')return answer('DENIED')
 if(!object(publication,['state','identityEligible','category','resourceRef','sourceRevision','checkedAt'])||publication.state!=='PUBLISHED'||publication.identityEligible!==true||publication.category!==authorization.category||publication.resourceRef!==authorization.resourceRef||!hash(publication.sourceRevision)||!fresh(publication.checkedAt,now,policy.maxEvidenceAgeMs))return answer('UNPUBLISHED')
 if(!object(admission,['clientId','accountId','requestId','requestDigest','policyRevision','checkedAt','windowStart','clientRequests','accountRequests','clientConcurrent','accountConcurrent','retry'])||admission.clientId!==context.clientId||admission.accountId!==context.accountId||!uuid(admission.requestId)||admission.requestDigest!==digest||admission.policyRevision!==policy.revision||!fresh(admission.checkedAt,now,policy.maxEvidenceAgeMs)||!integer(admission.windowStart)||admission.windowStart>now||now-admission.windowStart>=policy.windowMs||!['NEW','DUPLICATE','CONFLICT'].includes(admission.retry as string)||['clientRequests','accountRequests','clientConcurrent','accountConcurrent'].some(k=>!integer(admission[k])))return answer('UNAVAILABLE')
 if(admission.retry==='DUPLICATE')return answer('DUPLICATE')
 if(admission.retry==='CONFLICT')return answer('RETRY_CONFLICT')
 if((admission.clientRequests as number)>=policy.maxClientRequests||(admission.accountRequests as number)>=policy.maxAccountRequests||(admission.clientConcurrent as number)>=policy.maxClientConcurrent||(admission.accountConcurrent as number)>=policy.maxAccountConcurrent)return answer('LIMIT_REACHED')
 return answer('CONTRACT_ELIGIBLE')
}
export type UsageEvent={requestId:string;clientId:string|null;credentialId:string|null;accountId:string|null;requestDigest:string|null;operation:string|null;category:string|null;outcome:'ADMITTED'|'COMPLETED'|'DENIED'|'REJECTED'|'FAILED'|'CANCELLED'|'DUPLICATE';occurredAt:number;status:number;policyRevision:string|null;rateConsumption:'NONE'|'RESERVED'|'COMMITTED'|'RELEASED'|'UNCHANGED';responseBytes:number|null;sourceQueries:number|null;commercialCreditsDebited:0}
/** Closed safe event schema. It writes nothing and never fabricates authenticated attribution. */
export function validateUsageEvent(value:unknown):value is UsageEvent{
 if(!object(value,['requestId','clientId','credentialId','accountId','requestDigest','operation','category','outcome','occurredAt','status','policyRevision','rateConsumption','responseBytes','sourceQueries','commercialCreditsDebited']))return false
 if(!uuid(value.requestId)||!integer(value.occurredAt)||!integer(value.status)||value.status<100||value.status>599||value.commercialCreditsDebited!==0||!['ADMITTED','COMPLETED','DENIED','REJECTED','FAILED','CANCELLED','DUPLICATE'].includes(value.outcome as string)||!['NONE','RESERVED','COMMITTED','RELEASED','UNCHANGED'].includes(value.rateConsumption as string))return false
 if(['clientId','credentialId','policyRevision'].some(k=>value[k]!==null&&!string(value[k]))||value.accountId!==null&&!uuid(value.accountId)||value.requestDigest!==null&&!hash(value.requestDigest)||value.category!==null&&!CATEGORIES.includes(value.category as typeof CATEGORIES[number])||['responseBytes','sourceQueries'].some(k=>value[k]!==null&&!integer(value[k])))return false
 if(value.operation!==null&&(typeof value.operation!=='string'||!OPERATIONS.includes(value.operation as typeof OPERATIONS[number])))return false
 const attributed=value.clientId!==null&&value.credentialId!==null&&value.accountId!==null
 if((value.clientId!==null||value.credentialId!==null||value.accountId!==null)&&!attributed)return false
 if(['ADMITTED','COMPLETED','DUPLICATE'].includes(value.outcome as string)&&(!attributed||value.operation===null||value.requestDigest===null||value.policyRevision===null))return false
 if(value.outcome==='COMPLETED'&&(value.status<200||value.status>=300))return false
 if(value.outcome==='DENIED'&&![401,403,404].includes(value.status))return false
 if(value.outcome==='DUPLICATE'&&value.rateConsumption!=='UNCHANGED')return false
 return true
}
