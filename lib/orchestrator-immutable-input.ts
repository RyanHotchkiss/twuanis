import 'server-only'

/** Execution-local protection. Plain data is frozen in place; collection backing
 * stores are copied once because Object.freeze does not protect Map/Set entries. */
export type ImmutableInputs={protected:WeakSet<object>;active:WeakSet<object>}
export const immutableInputs=():ImmutableInputs=>({protected:new WeakSet(),active:new WeakSet()})
export function protectExecutionInput<T>(value:T,state:ImmutableInputs,callback?:Function):T{
 const copies=new WeakMap<object,object>()
 const visit=(v:any):any=>{
  if(v===null||!['object','function'].includes(typeof v))return v
  if(typeof v==='function'){
   if(v!==callback)throw Error('Unreviewed invocation callback.')
   // The sole admitted callback is the archived comparison-price normalizer:
   // it reads only its protected row/rate arguments and the pure currency helper.
   Object.freeze(v);state.protected.add(v);return v
  }
  if(state.active.has(v))throw Error('Cyclic invocation input.')
  if(state.protected.has(v))return v
  const old=copies.get(v);if(old)return old
  state.active.add(v)
  try{
   if(v instanceof Map||v instanceof Set){
    const map=v instanceof Map,target:any=map?new Map():new Set();let proxy:any
    const deny=()=>{throw Error('Immutable invocation collection.')}
    proxy=new Proxy(target,{get(t,k){
     if(['set','add','delete','clear'].includes(String(k)))return deny
     if(k==='forEach')return (fn:Function,thisArg?:unknown)=>t.forEach((x:any,y:any)=>fn.call(thisArg,x,y,proxy))
     if(k==='valueOf')return ()=>proxy
     const x=Reflect.get(t,k,t);return typeof x==='function'?x.bind(t):x
    },set:deny,defineProperty:deny,deleteProperty:deny,setPrototypeOf:deny})
    for(const x of v){if(map)target.set(visit(x[0]),visit(x[1]));else target.add(visit(x))}
    for(const k of Reflect.ownKeys(v)){
     if(typeof k!=='string')throw Error('Unsupported invocation symbol.')
     const d=Object.getOwnPropertyDescriptor(v,k)!;if(!('value'in d))throw Error('Invocation accessors are unsupported.')
     Object.defineProperty(target,k,{value:visit(d.value),enumerable:d.enumerable})
    }
    Object.freeze(target);copies.set(v,proxy);state.protected.add(proxy);return proxy
   }
   if(!Array.isArray(v)&&Object.getPrototypeOf(v)!==Object.prototype&&Object.getPrototypeOf(v)!==null)throw Error('Unsupported invocation input structure.')
   let output=v
   for(const k of Reflect.ownKeys(v)){
    if(typeof k!=='string')throw Error('Unsupported invocation symbol.')
    const d=Object.getOwnPropertyDescriptor(v,k)!;if(!('value'in d))throw Error('Invocation accessors are unsupported.')
    const child=visit(d.value)
    if(child!==d.value){
     if(!d.writable&&!d.configurable&&output===v){output=Array.isArray(v)?v.slice():Object.assign(Object.create(Object.getPrototypeOf(v)),v)}
     Object.defineProperty(output,k,{...d,value:child})
    }
   }
   Object.freeze(output);copies.set(v,output);state.protected.add(output);return output
  }finally{state.active.delete(v)}
 }
 return visit(value)
}
