import 'server-only'
import {immutableInputs,protectExecutionInput,type ImmutableInputs} from './orchestrator-immutable-input'
import {AsyncLocalStorage} from 'node:async_hooks'
import {createHash} from 'node:crypto'

export type EvidenceValue=null|boolean|string|number|EvidenceValue[]|{[key:string]:EvidenceValue}
export type EvidenceRecord={kind:string;contentId:string}
export type EvidenceCapture={inputs?:ImmutableInputs;records:EvidenceRecord[];nodes:Map<string,EvidenceValue>;nodeIds?:Map<string,string>;primitiveIds?:Map<unknown,string>;immutableIds?:WeakMap<object,string>;engine:string|null;budget?:{startedAt:number;checks:number};sequence?:{value:number};identity?:Record<string,unknown>;population?:string}
const captures=new AsyncLocalStorage<EvidenceCapture>()
const negativeZeroKey=Symbol("negative zero evidence")
/** A tagged tree preserves Map/Set ordering, absent values and exact binary64 bits.
 * It is evidence, never executable code. Callbacks remain archive dependencies. */
export function encodeEvidence(value:unknown):EvidenceValue {
 if(value===null||typeof value==='string'||typeof value==='boolean')return value
 if(typeof value==='number'){
  if(!Number.isFinite(value))throw Error('Nonfinite evidence is not admissible.')
  const b=Buffer.allocUnsafe(8);b.writeDoubleBE(value)
  return {$type:'binary64',bits:b.toString('hex'),decimal:Object.is(value,-0)?'-0':String(value)}
 }
 if(value===undefined)return {$type:'undefined'}
 if(typeof value==='bigint')return {$type:'bigint',decimal:String(value)}
 if(typeof value==='function')return {$type:'archive-callback',name:value.name||'anonymous'}
 if(value instanceof Map)return {$type:'map',entries:[...value].map(([k,v])=>[encodeEvidence(k),encodeEvidence(v)]),properties:Object.fromEntries(Object.keys(value).map(k=>[k,encodeEvidence((value as unknown as Record<string,unknown>)[k])]))}
 if(value instanceof Set)return {$type:'set',values:[...value].map(encodeEvidence)}
 if(Array.isArray(value))return value.map(encodeEvidence)
 if(value&&typeof value==='object'){
  if(Object.getPrototypeOf(value)!==Object.prototype&&Object.getPrototypeOf(value)!==null)throw Error('Unsupported evidence object.')
  return {$type:'object',entries:Object.keys(value).map(k=>[k,encodeEvidence((value as Record<string,unknown>)[k])])}
 }
 throw Error('Unsupported evidence value.')
}
export function decodeEvidence(v:EvidenceValue):unknown {
 if(v===null||typeof v!=='object')return v
 if(Array.isArray(v))return v.map(decodeEvidence)
 switch(v.$type){
  case 'binary64':{if(typeof v.bits!=='string'||!/^[0-9a-f]{16}$/.test(v.bits))throw Error('Invalid binary64 evidence.');const n=Buffer.from(v.bits,'hex').readDoubleBE();if(!Number.isFinite(n)||(Object.is(n,-0)?'-0':String(n))!==v.decimal)throw Error('Inconsistent binary64 evidence.');return n}
  case 'undefined':return undefined
  case 'bigint':return BigInt(String(v.decimal))
  case 'set':return new Set((v.values as EvidenceValue[]).map(decodeEvidence))
  case 'map':{const m=new Map((v.entries as EvidenceValue[][]).map(([k,x])=>[decodeEvidence(k),decodeEvidence(x)]));for(const [k,x]of Object.entries(v.properties as Record<string,EvidenceValue>))Object.defineProperty(m,k,{value:decodeEvidence(x),enumerable:true});return m}
  case 'object':{const o:Record<string,unknown>={};for(const [k,x]of v.entries as [string,EvidenceValue][]){if(Object.hasOwn(o,k))throw Error('Duplicate evidence key.');Object.defineProperty(o,k,{value:decodeEvidence(x),enumerable:true,writable:true,configurable:true})}return o}
  case 'archive-callback':throw Error('Historical callback must come from the protected release archive.')
  default:throw Error('Unsupported evidence tag.')
 }
}
export const evidenceCaptureActive=()=>!!captures.getStore()
function internEvidence(value:unknown,c:EvidenceCapture):string {
 // Enforce the existing 120-second budget inside synchronous capture too.
 // Between-engine checks cannot interrupt one oversized input traversal.
 if(c.budget&&++c.budget.checks%1024===0&&performance.now()-c.budget.startedAt>120000)throw Error('Bounded execution time exceeded.')
 const primitive=value===null||['string','boolean','number','undefined','bigint'].includes(typeof value)
 const primitiveKey=typeof value==='number'&&Object.is(value,-0)?negativeZeroKey:value
 const primitives=c.primitiveIds??(c.primitiveIds=new Map());if(primitive){const previous=primitives.get(primitiveKey);if(previous)return previous}
 const memo=c.immutableIds??(c.immutableIds=new WeakMap());if(value&&typeof value==='object'){const previous=memo.get(value);if(previous)return previous}
 let node:EvidenceValue
 const ref=(v:unknown)=>internEvidence(v,c)
 if(value===null||typeof value==='string'||typeof value==='boolean')node=['scalar',value]
 else if(typeof value==='number'){if(!Number.isFinite(value))throw Error('Nonfinite evidence is not admissible.');const b=Buffer.allocUnsafe(8);b.writeDoubleBE(value);node=['binary64',b.toString('hex'),Object.is(value,-0)?'-0':String(value)]}
 else if(value===undefined)node=['undefined']
 else if(typeof value==='bigint')node=['bigint',String(value)]
 else if(typeof value==='function')node=['archive-callback',value.name||'anonymous']
 else if(value instanceof Map)node=['map',[...value].map(([k,v])=>[ref(k),ref(v)]),Object.keys(value).map(k=>[k,ref((value as unknown as Record<string,unknown>)[k])])]
 else if(value instanceof Set)node=['set',[...value].map(ref)]
 else if(Array.isArray(value))node=['array',value.map(ref)]
 else if(value&&typeof value==='object'&&(Object.getPrototypeOf(value)===Object.prototype||Object.getPrototypeOf(value)===null))node=['object',Object.keys(value).map(k=>[k,ref((value as Record<string,unknown>)[k])])]
 else throw Error('Unsupported evidence object.')
 // Reuse only an identical serialized node within this capture. Mutable inputs
 // are still traversed on every invocation; no object-identity cache can hide changes.
 const id=createHash('sha256').update(JSON.stringify(node)).digest('hex')
 if(!c.nodes.has(id))c.nodes.set(id,node)
 // Only deeply frozen data properties are reusable. Frozen Map/Set and accessors
 // are excluded because their observable content can still change.
 if(value&&typeof value==='object'&&(c.inputs?.protected.has(value)||Object.isFrozen(value))&&(Array.isArray(value)||Object.getPrototypeOf(value)===Object.prototype||Object.getPrototypeOf(value)===null)&&Object.values(Object.getOwnPropertyDescriptors(value)).every(d=>'value'in d&&(d.value===null||!['object','function'].includes(typeof d.value)||memo.has(d.value))))memo.set(value,id)
 if(value&&typeof value==='object'&&c.inputs?.protected.has(value))memo.set(value,id)
 if(primitive)primitives.set(primitiveKey,id)
 return id
}
export function protectAnalyticalInput<T>(value:T):T {
 const c=captures.getStore();return c?protectExecutionInput(value,c.inputs??(c.inputs=immutableInputs())):value
}
export function recordAnalyticalEvidence<T>(kind:string,value:T):T {
 const c=captures.getStore();if(!c)return value
 value=protectExecutionInput(value,c.inputs??(c.inputs=immutableInputs()))
 c.records.push({kind:(c.engine?c.engine+'/':'')+kind,contentId:internEvidence(value,c)})
 return value
}
export function captureAnalyticalEvidence<T>(run:()=>Promise<T>,identity?:Record<string,unknown>){const capture:EvidenceCapture={inputs:immutableInputs(),records:[],nodes:new Map(),nodeIds:new Map(),primitiveIds:new Map(),immutableIds:new WeakMap(),engine:null,budget:{startedAt:performance.now(),checks:0},sequence:{value:0},identity};return captures.run(capture,async()=>{
 try{return {result:await run(),records:capture.records,nodes:Object.fromEntries(capture.nodes)}}
 finally{
  // These are capture-only lookup indexes, not authoritative evidence. Release
  // duplicate serialized keys before witness/report serialization starts.
  capture.nodeIds?.clear();capture.primitiveIds?.clear();capture.nodes.clear()
 }
})}
export function inEvidenceEngine<T>(engine:string,run:()=>Promise<T>){const parent=captures.getStore();return parent?captures.run({...parent,engine},run):run()}
export function traceEvidenceCall<T extends (...args:any[])=>any>(name:string,fn:T):T {
 return function(this:unknown,...args:Parameters<T>){
  const historical=historicalReads.getStore();if(historical&&['canonicalMarketPrevalence','establishWeightedSubject'].includes(name)){const key=historicalReadKey(name,args);if(!historical.has(key))throw Error('Missing historical reference read.');return Promise.resolve(historical.get(key))}
  if(!captures.getStore())return fn.apply(this,args)
  const capture=captures.getStore()!;args=protectExecutionInput(args,capture.inputs??(capture.inputs=immutableInputs()),name==='calculateMarketComparisonSide'?args[5]:undefined); const context={...capture.identity,engine:capture.engine,population:capture.population??capture.identity?.population}; const invocationOrder=++(capture.sequence??(capture.sequence={value:0})).value; const inputId=internEvidence(args,capture)
  const result=fn.apply(this,args)
  if(result&&typeof result.then==='function')return result.then((output:unknown)=>{capture.records.push({kind:(capture.engine?capture.engine+'/':'')+'call/'+name,contentId:internEvidence({inputId,outputId:internEvidence(output,capture),invocationOrder,context},capture)});return output})
  capture.records.push({kind:(capture.engine?capture.engine+'/':'')+'call/'+name,contentId:internEvidence({inputId,outputId:internEvidence(result,capture),invocationOrder,context},capture)});return result
 } as T
}

/** Decode a closed, hash-verified graph; immutable snapshots never consult live data. */
export function reconstructEvidence(id:string,nodes:Record<string,EvidenceValue>,memo=new Map<string,unknown>(),active=new Set<string>()):unknown {
 if(memo.has(id))return memo.get(id)
 if(active.has(id))throw Error('Cyclic evidence reference.')
 const n=nodes[id];if(!Array.isArray(n)||createHash('sha256').update(JSON.stringify(n)).digest('hex')!==id)throw Error('Missing or corrupt evidence node.')
 active.add(id);const ref=(key:EvidenceValue)=>{if(typeof key!=='string')throw Error('Invalid evidence reference.');return reconstructEvidence(key,nodes,memo,active)}
 let out:unknown
 switch(n[0]){
  case 'scalar':out=n[1];break
  case 'undefined':out=undefined;break
  case 'bigint':out=BigInt(String(n[1]));break
  case 'binary64':out=decodeEvidence({$type:'binary64',bits:n[1],decimal:n[2]});break
  case 'array':out=(n[1] as EvidenceValue[]).map(ref);break
  case 'set':out=new Set((n[1] as EvidenceValue[]).map(ref));break
  case 'map':{const m=new Map((n[1] as EvidenceValue[][]).map(([k,v])=>[ref(k),ref(v)]));for(const [k,v]of n[2] as EvidenceValue[][])Object.defineProperty(m,String(k),{value:ref(v),enumerable:true});out=m;break}
  case 'object':{const o:Record<string,unknown>={};for(const [k,v]of n[1] as EvidenceValue[][]){if(typeof k!=='string'||Object.hasOwn(o,k))throw Error('Duplicate or invalid evidence key.');Object.defineProperty(o,k,{value:ref(v),enumerable:true,writable:true,configurable:true})}out=o;break}
  case 'archive-callback':throw Error('Replay requires archived callback implementation.')
  default:throw Error('Unsupported evidence node.')
 }
 active.delete(id);memo.set(id,out);return out
}

export function snapshotAnalyticalEvidence(){
 const c=captures.getStore();if(!c)throw Error('Evidence capture required.')
 return {schema:'twuanis-analytical-evidence-v2' as const,encoding:'ordered-content-graph-binary64-v1' as const,records:[...c.records],nodes:Object.fromEntries(c.nodes)}
}

const historicalReads=new AsyncLocalStorage<Map<string,unknown>>()
export function withHistoricalEvidenceReads<T>(reads:Map<string,unknown>,run:()=>Promise<T>){return historicalReads.run(reads,run)}
export function historicalReadKey(name:string,args:unknown){const c:EvidenceCapture={records:[],nodes:new Map(),engine:null};return name+':'+internEvidence(args,c)}

export function inEvidencePopulation<T>(population:string,run:()=>Promise<T>){const parent=captures.getStore();return parent?captures.run({...parent,population},run):run()}
