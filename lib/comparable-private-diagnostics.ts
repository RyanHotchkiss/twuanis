import 'server-only'
import {AsyncLocalStorage} from 'node:async_hooks'
import {randomUUID} from 'node:crypto'
import {appendFileSync} from 'node:fs'
import {join} from 'node:path'
type Trace={correlationId:string;stage:string;engineInvoked:boolean;engineReturned:boolean;events:{stage:string;at:string}[]}
const storage=new AsyncLocalStorage<Trace>()
export function withComparableDiagnostics<T>(execute:()=>Promise<T>):Promise<T>{
 return storage.run({correlationId:randomUUID(),stage:'action',engineInvoked:false,engineReturned:false,events:[]},execute)
}
export function comparableStage(stage:string){const trace=storage.getStore();if(!trace)return;trace.stage=stage;if(stage==='engine_invocation')trace.engineInvoked=true;if(stage==='engine_returned')trace.engineReturned=true;trace.events.push({stage,at:new Date().toISOString()})}
function redact(value:unknown):string|undefined{
 if(typeof value!=='string')return undefined
 return value.replace(/Bearer\s+[^\s]+/gi,'Bearer [REDACTED]').replace(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g,'[REDACTED_JWT]').replace(/((?:password|secret|api[_-]?key|access[_-]?token|refresh[_-]?token)\s*[=:]\s*)[^\s&,;]+/gi,'$1[REDACTED]').replace(/(postgres(?:ql)?:\/\/)[^@\s]+@/gi,'$1[REDACTED]@').slice(0,16000)
}
export function preserveComparableFailure(error:unknown){
 const trace=storage.getStore();if(!trace)return
 const e=error&&typeof error==='object'?error as Record<string,unknown>:{}
 const record={...trace,failedAt:new Date().toISOString(),errorReference:randomUUID(),classification:error instanceof Error?error.name:typeof e.code==='string'?'upstream_error':'unknown_exception',error:{name:redact(e.name),message:redact(e.message??String(error)),code:redact(e.code),details:redact(e.details),hint:redact(e.hint),stack:redact(e.stack)}}
 // Only the explicit local diagnostic sink receives details. Otherwise use private server logs.
 try{const directory=process.env.TWUANIS_COMPARABLE_DIAGNOSTIC_DIRECTORY;if(directory)appendFileSync(join(directory,'diagnostics.jsonl'),JSON.stringify(record)+'\n',{mode:0o600});else console.error('[comparable-private-failure]',JSON.stringify(record))}catch{console.error('[comparable-private-diagnostic-write-failed]',record.correlationId,record.errorReference)}
}
