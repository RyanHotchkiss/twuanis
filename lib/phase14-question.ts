import 'server-only'
import { validateOfficialCode, type GeoType } from './geography/dta-request'
import { validateOntologyTermId, type ResolvedGeographicRequest } from './geography/dta-identity'
import { resolvePropertyAreaConstraint, resolveConstructionAreaConstraint } from './market-intelligence-area-ranges'
import type { Phase14CommitInput, Phase14QuestionInput, Phase14Filters, Phase14FactConstraint, Phase14FactDimension } from './phase14-question-contract'

const semantics = ['environment','terrain','utility','accessibility','legal_status'] as const
const facts = ['bedrooms','bathrooms','parking','year_built'] as const
// Operational input bounds only, never listing-population limits. Reject, never truncate.
const MAX_SELECTIONS = 256, MAX_DECIMAL_CHARACTERS = 1024
const prepared = new WeakSet<object>(), canonical = new WeakSet<object>()
export class Phase14QuestionError extends Error {
  constructor() { super('Invalid or incomplete Phase 14 question.'); this.name = 'Phase14QuestionError' }
}
function fail(): never { throw new Phase14QuestionError() }
function object(v: unknown, allowed: readonly string[], required: readonly string[] = []): Record<string, any> {
  if (!v || typeof v !== 'object' || (Object.getPrototypeOf(v) !== Object.prototype && Object.getPrototypeOf(v) !== null)) fail()
  const keys = Reflect.ownKeys(v)
  if (keys.some(k => typeof k !== 'string' || !allowed.includes(k))) fail()
  for (const key of keys) {
    const d = Object.getOwnPropertyDescriptor(v,key)!
    if (!('value' in d) || !d.enumerable || d.value === undefined) fail()
  }
  if (required.some(k => !Object.hasOwn(v,k))) fail()
  return v as Record<string, any>
}
function array(v: unknown): unknown[] {
  if (!Array.isArray(v) || v.length > MAX_SELECTIONS) fail()
  if (Reflect.ownKeys(v).length !== v.length + 1) fail()
  for (let i=0;i<v.length;i++) {
    const d = Object.getOwnPropertyDescriptor(v,String(i))
    if (!d || !('value' in d) || !d.enumerable) fail()
  }
  return v
}
function id(v: unknown): string {
  const result = validateOntologyTermId(v)
  if (BigInt(result) <= BigInt(0)) fail()
  return result
}
const compareId = (a: string,b: string) => BigInt(a)<BigInt(b)?-1:BigInt(a)>BigInt(b)?1:0
function decimal(v: unknown, dim: Phase14FactDimension): string {
  if (typeof v !== 'string' || v.length > MAX_DECIMAL_CHARACTERS || !/^\d+(\.\d+)?$/.test(v)) fail()
  const [whole, fraction=''] = v.split('.')
  const w = whole.replace(/^0+(?=\d)/,''); const f = fraction.replace(/0+$/,'')
  const result = w + (f ? '.'+f : '')
  if (dim !== 'bathrooms' && f) fail()
  if (dim === 'bathrooms' && result === '0') fail()
  if (dim === 'year_built' && (BigInt(w)<BigInt(1) || BigInt(w)>BigInt(9999))) fail()
  return result
}
function compareDecimal(a: string,b: string): number {
  const [aw,af='']=a.split('.'),[bw,bf='']=b.split('.')
  if (aw.length !== bw.length) return aw.length-bw.length
  if (aw!==bw) return aw<bw?-1:1
  const n=Math.max(af.length,bf.length),x=af.padEnd(n,'0'),y=bf.padEnd(n,'0')
  return x<y?-1:x>y?1:0
}
function constraint(v: unknown, dim: Phase14FactDimension): Phase14FactConstraint {
  const c = object(v,['kind','value','termId','interval'],['kind'])
  if (c.kind === 'exact') { object(c,['kind','value'],['kind','value']); return {kind:'exact',value:decimal(c.value,dim)} }
  if (c.kind === 'category') { object(c,['kind','termId'],['kind','termId']); return {kind:'category',termId:id(c.termId)} }
  if (c.kind !== 'interval') fail()
  object(c,['kind','interval'],['kind','interval'])
  const r=object(c.interval,['lower','upper','lowerInclusive','upperInclusive'],['lower','upper','lowerInclusive','upperInclusive'])
  if (typeof r.lowerInclusive !== 'boolean' || typeof r.upperInclusive !== 'boolean') fail()
  const lower=r.lower===null?null:decimal(r.lower,dim), upper=r.upper===null?null:decimal(r.upper,dim)
  if ((lower===null && r.lowerInclusive) || (upper===null && r.upperInclusive) || (lower===null && upper===null)) fail()
  if (lower!==null && upper!==null) {
    const order=compareDecimal(lower,upper)
    if (order>0 || (order===0 && !(r.lowerInclusive && r.upperInclusive))) fail()
  }
  // A nonempty real interval can still contain no valid integer-domain value.
  if (dim !== 'bathrooms') {
    const first=lower===null?(dim==='year_built'?BigInt(1):BigInt(0)):BigInt(lower)+(r.lowerInclusive?BigInt(0):BigInt(1))
    const last=upper===null?(dim==='year_built'?BigInt(9999):null):BigInt(upper)-(r.upperInclusive?BigInt(0):BigInt(1))
    if (last!==null && first>last) fail()
  }
  return {kind:'interval',interval:{lower,upper,lowerInclusive:r.lowerInclusive,upperInclusive:r.upperInclusive}}
}
function freeze<T>(v:T):T {
  if (v && typeof v==='object') { for (const child of Object.values(v)) freeze(child); Object.freeze(v) }
  return v
}
export type PreparedPhase14Question = Readonly<{ question: Phase14QuestionInput; ancestorAssertions?: Phase14CommitInput['ancestorAssertions'] }>
export function preparePhase14Question(input: unknown): PreparedPhase14Question {
  const root=object(input,['question','ancestorAssertions'],['question'])
  const q=object(root.question,['version','transaction','geography','propertyType','filters'],['version','transaction','geography','propertyType'])
  if (q.version!==1 || !['sale','rent'].includes(q.transaction)) fail()
  const g=object(q.geography,['level','officialCode'],['level','officialCode'])
  if (!['province','canton','district'].includes(g.level)) fail()
  const officialCode=validateOfficialCode(g.level,g.officialCode)
  const pt=object(q.propertyType,['termId'],['termId'])
  const propertyType={termId:id(pt.termId)}
  const f=Object.hasOwn(q,'filters')?object(q.filters,['semantics','facts','propertyArea','constructionArea']):{}
  const sem=Object.hasOwn(f,'semantics')?object(f.semantics,semantics):{}
  const fs=Object.hasOwn(f,'facts')?object(f.facts,facts):{}
  const semanticResult: any={}, factResult: any={}; let selectionCount=0
  for (const dim of semantics) if (Object.hasOwn(sem,dim)) {
    const values=array(sem[dim]); selectionCount+=values.length
    const ids=[...new Set(values.map(id))].sort(compareId)
    if (ids.length) semanticResult[dim]=ids
  }
  for (const dim of facts) if (Object.hasOwn(fs,dim)) {
    const values=array(fs[dim]); selectionCount+=values.length
    const list=values.map(v=>constraint(v,dim))
    const keys=[...new Set(list.map(v=>JSON.stringify(v)))].sort((a,b)=>{
      const x=JSON.parse(a), y=JSON.parse(b),rank={exact:0,category:1,interval:2}
      return rank[x.kind as keyof typeof rank]-rank[y.kind as keyof typeof rank] || (x.kind==='category' && y.kind==='category' ? compareId(x.termId,y.termId) : a<b?-1:a>b?1:0)
    })
    if (keys.length) factResult[dim]=keys.map(k=>JSON.parse(k))
  }
  if (selectionCount>MAX_SELECTIONS) fail()
  const filters: any={semantics:semanticResult,facts:factResult}
  for (const [key,resolve] of [['propertyArea',resolvePropertyAreaConstraint],['constructionArea',resolveConstructionAreaConstraint]] as const) {
    if (Object.hasOwn(f,key)) {
      // Resolver dictionaries have prototypes: require a real declared own option.
      const keys=key==='propertyArea'?['under-100m2','100-500m2','500-1000m2','1000-5000m2','5000m2-1-hectare','1-5-hectares','over-5-hectares']:['under-50m2','50-100m2','100-200m2','200-400m2','400-800m2','800m2-plus']
      if (typeof f[key]!=='string' || !keys.includes(f[key]) || !resolve(f[key])) fail()
      filters[key]=f[key]
    }
  }
  let ancestorAssertions: Phase14CommitInput['ancestorAssertions']
  if (Object.hasOwn(root,'ancestorAssertions')) {
    const a=object(root.ancestorAssertions,['provinceCode','cantonCode']); const result: any={}
    for (const [key,level,length] of [['provinceCode','province',1],['cantonCode','canton',3]] as const) if (Object.hasOwn(a,key)) {
      const code=validateOfficialCode(level,a[key])
      if (length>officialCode.length || officialCode.slice(0,length)!==code) fail()
      result[key]=code
    }
    ancestorAssertions=result
  }
  const result=freeze({question:{version:1 as const,transaction:q.transaction as 'sale'|'rent',geography:{level:g.level,officialCode},propertyType,filters},...(ancestorAssertions?{ancestorAssertions}:{})})
  prepared.add(result); return result
}
export function phase14ReferenceTerms(p: PreparedPhase14Question): ReadonlyMap<string,string> {
  if (!prepared.has(p)) fail()
  const map=new Map<string,string>()
  const add=(term:string,dim:string)=>{ if (map.has(term) && map.get(term)!==dim) fail(); map.set(term,dim) }
  add(p.question.propertyType.termId,'property_type')
  for (const dim of semantics) for (const term of p.question.filters?.semantics?.[dim]??[]) add(term,dim)
  for (const dim of facts) for (const c of p.question.filters?.facts?.[dim]??[]) if (c.kind==='category') add(c.termId,dim)
  return map
}
declare const established: unique symbol
export type Phase14Question = Readonly<{
  version:1; transaction:'sale'|'rent'
  geography: Readonly<{level:GeoType;officialCode:string;termId:string}>
  propertyType: Readonly<{termId:string}>
  filters: Phase14Filters
  readonly [established]: true
}>
// Only server reference resolution may call this; unknown input cannot forge a prepared object.
export function establishPhase14Question(p: PreparedPhase14Question, resolved: ResolvedGeographicRequest, rows: readonly Record<string,unknown>[]): Phase14Question {
  if (!prepared.has(p)) fail()
  const expected=phase14ReferenceTerms(p), seen=new Set<string>()
  for (const r of rows) {
    const term=id(r.id)
    if (!expected.has(term) || seen.has(term) || r.term_type!==expected.get(term) || r.level!==1 || typeof r.term_name!=='string' || !r.term_name) fail()
    seen.add(term)
  }
  if (seen.size!==expected.size) fail()
  const g=p.question.geography, entities=resolved[g.level]
  if (!entities || entities.length!==1 || entities[0].officialCode!==g.officialCode || entities[0].termType!==g.level) fail()
  const result=freeze({version:1 as const,transaction:p.question.transaction,geography:{level:g.level,officialCode:g.officialCode,termId:entities[0].ontologyTermId},propertyType:p.question.propertyType,filters:p.question.filters!}) as unknown as Phase14Question
  canonical.add(result);return result
}
export function serializePhase14Question(q: Phase14Question): string {
  if (!canonical.has(q)) fail()
  return JSON.stringify(q)
}
export function equalPhase14Questions(a:Phase14Question,b:Phase14Question):boolean {
  return serializePhase14Question(a)===serializePhase14Question(b)
}
