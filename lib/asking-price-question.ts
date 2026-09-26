import 'server-only'
import { validateOfficialCode } from './geography/dta-request'
import { validateOntologyTermId } from './geography/dta-identity'
import { PROPERTY_AREA_RANGE_OPTIONS, CONSTRUCTION_AREA_RANGE_OPTIONS } from './market-intelligence-area-ranges'
import { FACTS, SEMANTICS, type Question, type Constraint, type Fact, type Interval } from './asking-price-contract'
export class InvalidQuestion extends Error {}
function fail():never {throw new InvalidQuestion('Invalid market question')}
function obj(x:unknown,keys:readonly string[],required:readonly string[]=[]):Record<string,any>{
  if(!x||typeof x!=='object'||![Object.prototype,null].includes(Object.getPrototypeOf(x)))fail()
  for(const k of Reflect.ownKeys(x)){const d=Object.getOwnPropertyDescriptor(x,k)!;if(typeof k!=='string'||!keys.includes(k)||!('value'in d)||!d.enumerable||d.value===undefined)fail()}
  if(required.some(k=>!Object.hasOwn(x,k)))fail();return x as Record<string,any>
}
function list(x:unknown):unknown[]{if(!Array.isArray(x)||x.length>64||Reflect.ownKeys(x).length!==x.length+1)fail();for(let i=0;i<x.length;i++){const d=Object.getOwnPropertyDescriptor(x,String(i));if(!d||!('value'in d)||!d.enumerable)fail()}return Array.from(x)}
function term(x:unknown){try{const s=validateOntologyTermId(x);if(BigInt(s)<=BigInt(0))fail();return s}catch{ return fail()}}
export function decimal(x:unknown):string {if(typeof x!=='string'||x.length>1024||!/^\d+(\.\d+)?$/.test(x))fail();const [w,f='']=x.split('.');const a=w.replace(/^0+(?=\d)/,''),b=f.replace(/0+$/,'');return a+(b?'.'+b:'')}
export function compare(a:string,b:string){const [aw,af='']=a.split('.'),[bw,bf='']=b.split('.');if(aw.length!==bw.length)return aw.length-bw.length;if(aw!==bw)return aw<bw?-1:1;const n=Math.max(af.length,bf.length),x=af.padEnd(n,'0'),y=bf.padEnd(n,'0');return x<y?-1:x>y?1:0}
function dimension(x:unknown,d:Fact,endpoint=false){const s=decimal(x);if(d!=='bathrooms'&&s.includes('.'))fail();if(d==='bathrooms'&&!endpoint&&s==='0')fail();if(d==='year_built'&&(compare(s,'1')<0||compare(s,'9999')>0))fail();return s}
function constraint(x:unknown,d:Fact):Constraint {
 const c=obj(x,['kind','value','termId','interval'],['kind'])
 if(c.kind==='exact'){obj(c,['kind','value'],['value']);return {kind:'exact',value:dimension(c.value,d)}}
 if(c.kind==='category'){obj(c,['kind','termId'],['termId']);return {kind:'category',termId:term(c.termId)}}
 if(c.kind!=='interval')fail();obj(c,['kind','interval'],['interval'])
 const r=obj(c.interval,['lower','upper','lowerInclusive','upperInclusive'],['lower','upper','lowerInclusive','upperInclusive'])
 if(typeof r.lowerInclusive!=='boolean'||typeof r.upperInclusive!=='boolean')fail()
 const lower=r.lower===null?null:dimension(r.lower,d,true),upper=r.upper===null?null:dimension(r.upper,d,true)
 if(lower===null&&r.lowerInclusive||upper===null&&r.upperInclusive||lower===null&&upper===null)fail()
 if(lower!==null&&upper!==null&&(compare(lower,upper)>0||compare(lower,upper)===0&&!(r.lowerInclusive&&r.upperInclusive)))fail()
 if(d!=='bathrooms'){const first=lower===null?BigInt(d==='year_built'?1:0):BigInt(lower)+BigInt(r.lowerInclusive?0:1);const last=upper===null?null:BigInt(upper)-BigInt(r.upperInclusive?0:1);if(last!==null&&first>last)fail()}
 return {kind:'interval',interval:{lower,upper,lowerInclusive:r.lowerInclusive,upperInclusive:r.upperInclusive}}
}
export function validateQuestion(input:unknown):Question {
 const q=obj(input,['version','transaction','geography','propertyType','filters'],['version','transaction','geography'])
 if(q.version!==1||!['sale','rent'].includes(q.transaction))fail()
 const g=obj(q.geography,['level','officialCode'],['level','officialCode']);if(!['province','canton','district'].includes(g.level))fail()
 const officialCode=validateOfficialCode(g.level,g.officialCode)
 const f=q.filters===undefined?{}:obj(q.filters,['semantics','facts','propertyArea','constructionArea'])
 const sem=f.semantics===undefined?{}:obj(f.semantics,SEMANTICS),facts=f.facts===undefined?{}:obj(f.facts,FACTS)
 const filters:Question['filters']={semantics:{},facts:{}};let count=0
 for(const d of SEMANTICS)if(Object.hasOwn(sem,d)){const ids=list(sem[d]).map(term);count+=ids.length;if(ids.length)filters.semantics[d]=[...new Set(ids)].sort((a,b)=>BigInt(a)<BigInt(b)?-1:1)}
 for(const d of FACTS)if(Object.hasOwn(facts,d)){const cs=list(facts[d]).map(c=>constraint(c,d));count+=cs.length;if(cs.length)filters.facts[d]=[...new Set(cs.map(c=>JSON.stringify(c)))].sort().map(s=>JSON.parse(s))}
 if(count>256)fail()
 for(const [k,options]of [['propertyArea',PROPERTY_AREA_RANGE_OPTIONS],['constructionArea',CONSTRUCTION_AREA_RANGE_OPTIONS]] as const)if(Object.hasOwn(f,k)){if(!options.some(o=>o.value===f[k]))fail();filters[k]=f[k]}
 return {version:1,transaction:q.transaction,geography:{level:g.level,officialCode},...(Object.hasOwn(q,'propertyType')?{propertyType:term(q.propertyType)}:{}),filters}
}
export function inside(v:string,r:Interval){return (r.lower===null||compare(v,r.lower)>0||compare(v,r.lower)===0&&r.lowerInclusive)&&(r.upper===null||compare(v,r.upper)<0||compare(v,r.upper)===0&&r.upperInclusive)}
export function contained(a:Interval,b:Interval){return (b.lower===null||a.lower!==null&&(compare(a.lower,b.lower)>0||compare(a.lower,b.lower)===0&&(!a.lowerInclusive||b.lowerInclusive)))&&(b.upper===null||a.upper!==null&&(compare(a.upper,b.upper)<0||compare(a.upper,b.upper)===0&&(!a.upperInclusive||b.upperInclusive)))}
export function referenceTerms(q:Question){const out=new Map<string,string>();const add=(id:string,d:string)=>{if(out.has(id)&&out.get(id)!==d)fail();out.set(id,d)};if(q.propertyType)add(q.propertyType,'property_type');for(const d of SEMANTICS)for(const id of q.filters.semantics[d]??[])add(id,d);for(const d of FACTS)for(const c of q.filters.facts[d]??[])if(c.kind==='category')add(c.termId,d);return out}
