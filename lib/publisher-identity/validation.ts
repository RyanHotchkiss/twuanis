import 'server-only'
import {createHash,verify} from 'node:crypto'

export type State='PROPOSED'|'APPROVED'|'ISSUED'|'RETIRED'
export type Reference={reference:string;sha256:string}
export type Binding={namespace:'existing-population-engine-registry';canonicalKey:string;jurisdiction:string|null;publicId:string|null;aliases:{publicId:string;targetId:string}[];state:State;sourceRevision:string;representationRevision:string;reviewEvidence:Reference|null;ownerDecision:Reference|null;issuance:{firstPublishedAt:string;evidence:Reference}|null;retirement:{retiredAt:string;reasonReference:Reference}|null}
export type Attestation={keyId:string;scope:'review'|'issue'|'retire';signature:string}
export type Manifest={schemaVersion:1;revision:string;sequence:number;previousDigest:string|null;authorityDigest:string;representationManifestDigest:string;entries:Binding[];attestations:Attestation[]}
export type Authority={registryDigest:string;representationManifestDigest:string;engines:ReadonlyMap<string,{sourceRevision:string;representationRevision:string;jurisdiction:string|null}>}
export type Trust={keys:ReadonlyMap<string,{publicKey:string;scopes:readonly Attestation['scope'][]}>}
export type Anchor={sequence:number;digest:string}
export type Reservation={publicId:string;namespace:string;canonicalKey:string;jurisdiction:string|null}
export type Floor={sequence:number;digest:string;minimumConsumerVersion:number;keyId:string;signature:string}
export class IdentityValidationError extends Error{constructor(readonly code:string){super('Publisher identity validation unavailable');this.name='IdentityValidationError'}}
function deny(code:string):never{throw new IdentityValidationError(code)}
const object=(v:unknown):Record<string,unknown>=>{if(!v||typeof v!=='object'||Array.isArray(v))return deny('SHAPE');return v as Record<string,unknown>}
const exact=(v:unknown,keys:string[])=>{const r=object(v);if(Object.keys(r).length!==keys.length||keys.some(k=>!Object.hasOwn(r,k)))deny('FIELDS');return r}
const str=(v:unknown)=>{if(typeof v!=='string'||!v.length||v.length>4096)deny('STRING')}
const hash=(v:unknown)=>{if(typeof v!=='string'||!/^[a-f0-9]{64}$/.test(v))deny('HASH')}
const ref=(v:unknown)=>{const r=exact(v,['reference','sha256']);str(r.reference);hash(r.sha256)}
const stamp=(v:unknown)=>{if(typeof v!=='string'||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(v)||!Number.isFinite(Date.parse(v))||new Date(v).toISOString()!==v)deny('TIME')}
const uri=(v:unknown)=>{str(v);try{const u=new URL(v as string);if(u.protocol!=='https:'||u.username||u.password||u.search||u.hash||u.href!==v)deny('URI')}catch{deny('URI')}}
export function stableJSON(value:unknown):string{
 if(value===null||typeof value==='string'||typeof value==='boolean')return JSON.stringify(value)
 if(typeof value==='number'&&Number.isFinite(value))return JSON.stringify(value)
 if(Array.isArray(value))return '['+value.map(stableJSON).join(',')+']'
 const r=object(value);return '{'+Object.keys(r).sort().map(k=>JSON.stringify(k)+':'+stableJSON(r[k])).join(',')+'}'
}
/** Digest binds all content except detached attestations. SHA alone is never approval. */
export function manifestDigest(m:Manifest):string{const {attestations:_,...content}=m;void _;return createHash('sha256').update(stableJSON(content)).digest('hex')}
export function tuple(r:Pick<Binding,'namespace'|'canonicalKey'|'jurisdiction'>):string{return stableJSON([r.namespace,r.canonicalKey,r.jurisdiction])}
function shape(input:unknown):asserts input is Manifest{
 const m=exact(input,['schemaVersion','revision','sequence','previousDigest','authorityDigest','representationManifestDigest','entries','attestations'])
 if(m.schemaVersion!==1||!Number.isSafeInteger(m.sequence)||(m.sequence as number)<1)deny('VERSION');str(m.revision);hash(m.authorityDigest);hash(m.representationManifestDigest)
 if(m.previousDigest!==null)hash(m.previousDigest)
 if(!Array.isArray(m.entries)||m.entries.length!==17||!Array.isArray(m.attestations))deny('ROSTER')
 for(const value of m.entries as unknown[]){const r=exact(value,['namespace','canonicalKey','jurisdiction','publicId','aliases','state','sourceRevision','representationRevision','reviewEvidence','ownerDecision','issuance','retirement'])
  if(r.namespace!=='existing-population-engine-registry')deny('NAMESPACE');str(r.canonicalKey);if(r.jurisdiction!==null)str(r.jurisdiction);if(r.publicId!==null)uri(r.publicId)
  str(r.sourceRevision);str(r.representationRevision);if(!['PROPOSED','APPROVED','ISSUED','RETIRED'].includes(r.state as string))deny('STATE')
  if(!Array.isArray(r.aliases))deny('ALIASES');for(const a of r.aliases as unknown[]){const x=exact(a,['publicId','targetId']);uri(x.publicId);uri(x.targetId)}
  if(r.reviewEvidence!==null)ref(r.reviewEvidence);if(r.ownerDecision!==null)ref(r.ownerDecision)
  if(r.issuance!==null){const x=exact(r.issuance,['firstPublishedAt','evidence']);stamp(x.firstPublishedAt);ref(x.evidence)}
  if(r.retirement!==null){const x=exact(r.retirement,['retiredAt','reasonReference']);stamp(x.retiredAt);ref(x.reasonReference)}
 }
 for(const a of m.attestations as unknown[]){const x=exact(a,['keyId','scope','signature']);str(x.keyId);str(x.signature);if(!['review','issue','retire'].includes(x.scope as string))deny('SCOPE')}
}
export function attestationMessage(m:Manifest,scope:Attestation['scope']):Buffer{return Buffer.from('TWUANIS-PUBLISHER-IDENTITY-V1\n'+scope+'\n'+manifestDigest(m))}
function authenticatedScopes(m:Manifest,trust:Trust):Set<string>{
 const scopes=new Set<string>();const seen=new Set<string>()
 for(const a of m.attestations){const k=trust.keys.get(a.keyId);if(!k||!k.scopes.includes(a.scope)||seen.has(a.keyId+':'+a.scope))deny('UNTRUSTED_APPROVAL')
  try{if(!verify(null,attestationMessage(m,a.scope),k.publicKey,Buffer.from(a.signature,'base64')))deny('SIGNATURE')}catch{deny('SIGNATURE')}
  scopes.add(a.scope);seen.add(a.keyId+':'+a.scope)
 }return scopes
}
function validateManifest(m:Manifest,trust:Trust):void{
 const scopes=authenticatedScopes(m,trust),tuples=new Set<string>(),keys=new Set<string>(),ids=new Map<string,string>()
 for(const r of m.entries){const t=tuple(r);if(tuples.has(t)||keys.has(r.canonicalKey))deny('DUPLICATE_PRIMARY');tuples.add(t);keys.add(r.canonicalKey)
  if(r.state==='PROPOSED'){if(r.publicId!==null||r.aliases.length||r.issuance||r.retirement||r.reviewEvidence||r.ownerDecision)deny('PROPOSED_IS_NOT_APPROVED')}
  else{if(!r.publicId||!r.reviewEvidence||!r.ownerDecision||!scopes.has('review'))deny('MISSING_APPROVAL')}
  if((r.state==='ISSUED'&&!r.issuance)||(r.issuance&&!scopes.has('issue')))deny('MISSING_ISSUANCE')
  if(r.state==='APPROVED'&&(r.issuance||r.retirement))deny('APPROVED_IS_NOT_ISSUED')
  if(r.state==='RETIRED'&&(!r.retirement||!scopes.has('retire')))deny('MISSING_RETIREMENT')
  if(r.state!=='RETIRED'&&r.retirement)deny('RETIREMENT_STATE')
  if(r.issuance&&r.retirement&&r.retirement.retiredAt<r.issuance.firstPublishedAt)deny('RETIREMENT_TIME')
  for(const id of [r.publicId,...r.aliases.map(a=>a.publicId)].filter((x):x is string=>x!==null)){if(ids.has(id))deny('DUPLICATE_ID');ids.set(id,t)}
  for(const alias of r.aliases)if(alias.targetId!==r.publicId||alias.publicId===r.publicId)deny('ALIAS_TARGET') // Direct same-entity target: cycles/chains are forbidden.
 }
}
function advance(old:Manifest,next:Manifest){
 const transitions:Record<State,State[]>={PROPOSED:['PROPOSED','APPROVED'],APPROVED:['APPROVED','ISSUED','RETIRED'],ISSUED:['ISSUED','RETIRED'],RETIRED:['RETIRED']}
 const latest=new Map(next.entries.map(r=>[tuple(r),r]))
 for(const p of old.entries){const n=latest.get(tuple(p));if(!n)deny('HISTORY_DELETION')
  if(!transitions[p.state].includes(n.state))deny('TRANSITION')
  if(p.publicId!==null&&p.publicId!==n.publicId)deny('REASSIGNMENT')
  for(const a of p.aliases)if(!n.aliases.some(x=>x.publicId===a.publicId&&x.targetId===a.targetId))deny('ALIAS_DELETION')
  if(p.issuance&&stableJSON(p.issuance)!==stableJSON(n.issuance))deny('ISSUANCE_REWRITE')
  if(p.retirement&&stableJSON(p.retirement)!==stableJSON(n.retirement))deny('RETIREMENT_REWRITE')
 }
}
/** Complete history from pinned genesis; callers supply an independently approved anchor, never trust JSON self-claims. */
export function validateHistory(input:unknown,authority:Authority,trust:Trust,anchor:Anchor,existing:readonly Reservation[]=[]):{manifest:Manifest;digest:string}{
 if(!Array.isArray(input)||!input.length||input.length>10000)deny('HISTORY_MISSING');hash(anchor.digest)
 const history=input as unknown[];const revisions=new Set<string>(),reserved=new Map<string,string>()
 for(const r of existing){uri(r.publicId);const t=stableJSON([r.namespace,r.canonicalKey,r.jurisdiction]);const prior=reserved.get(r.publicId);if(prior&&prior!==t)deny('EXISTING_COLLISION');reserved.set(r.publicId,t)}
 let old:Manifest|undefined
 for(let i=0;i<history.length;i++){const item=history[i];shape(item);const m=item
  if(m.sequence!==i+1||m.previousDigest!==(old?manifestDigest(old):null)||revisions.has(m.revision))deny('HISTORY_CHAIN')
  revisions.add(m.revision);validateManifest(m,trust);if(old)advance(old,m)
  for(const r of m.entries)for(const id of [r.publicId,...r.aliases.map(a=>a.publicId)].filter((x):x is string=>x!==null)){const t=tuple(r);if(reserved.has(id)&&reserved.get(id)!==t)deny('RESERVED_COLLISION');reserved.set(id,t)}
  old=m
 }
 const tip=old!;const digest=manifestDigest(tip)
 if(tip.sequence!==anchor.sequence||digest!==anchor.digest)deny('ANCHOR_CONFLICT')
 if(tip.authorityDigest!==authority.registryDigest||tip.representationManifestDigest!==authority.representationManifestDigest||authority.engines.size!==17)deny('SOURCE_MISMATCH')
 for(const r of tip.entries){const a=authority.engines.get(r.canonicalKey);if(!a||a.sourceRevision!==r.sourceRevision||a.representationRevision!==r.representationRevision||a.jurisdiction!==r.jurisdiction)deny('ENGINE_SOURCE_MISMATCH')}
 return {manifest:tip,digest}
}
export function floorMessage(f:Omit<Floor,'signature'>):Buffer{return Buffer.from('TWUANIS-PUBLISHER-FLOOR-V1\n'+stableJSON(f))}
/** Pure compatibility contract; does not discover or activate an independent production release floor. */
export function validateDeployment(m:Manifest,floor:Floor|null,trust:Trust,consumerVersion:number):void{
 if(!floor)deny('INDEPENDENT_FLOOR_UNAVAILABLE')
 exact(floor,['sequence','digest','minimumConsumerVersion','keyId','signature']);hash(floor.digest)
 if(!Number.isSafeInteger(floor.sequence)||floor.sequence<1||!Number.isSafeInteger(floor.minimumConsumerVersion)||floor.minimumConsumerVersion<1||!Number.isSafeInteger(consumerVersion))deny('FLOOR_SHAPE')
 const key=trust.keys.get(floor.keyId);if(!key||!key.scopes.includes('review'))deny('FLOOR_AUTHORITY')
 const {signature,...content}=floor
 try{if(!verify(null,floorMessage(content),key.publicKey,Buffer.from(signature,'base64')))deny('FLOOR_SIGNATURE')}catch{deny('FLOOR_SIGNATURE')}
 if(consumerVersion<floor.minimumConsumerVersion)deny('CONSUMER_VERSION')
 if(m.sequence!==floor.sequence||manifestDigest(m)!==floor.digest)deny('STALE_OR_CONFLICTING_ARTIFACT')
}
/** Deliberately unavailable until separate issuance/publication authorization and operational qualification. */
export function publicEngineIdentity(_canonicalKey:string,_locale:'en'|'es'):null{return null}
export function requestIdentityMutation():never{return deny('ISSUANCE_AND_PROMOTION_DISABLED')}
