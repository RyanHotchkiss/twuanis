import 'server-only'
import {createServerSupabaseClient} from '@/lib/supabase-server'
export type IngestionOperation='policy.record'|'run.verify'|'ingestion.record'|'ingestion.reconcile'|'publication.publish'|'publication.restore'|'publication.revise'|'publication.withdraw'|'lifecycle.unconfirm'|'lifecycle.archive'
export type IngestionCommand={operation:IngestionOperation;institution:string;source:string;expected:string;reason:string;lifecycle:Record<string,unknown>}
export type IngestionQuery={institution:string;source:string;mode:'policies'|'runs'|'ingestion'|'events'|'readiness'|'reconciliations';after?:string}
export type IngestionRow=Record<string,unknown>&{id:string}
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const operations=['policy.record','run.verify','ingestion.record','ingestion.reconcile','publication.publish','publication.restore','publication.revise','publication.withdraw','lifecycle.unconfirm','lifecycle.archive']
const revision=(s:unknown)=>typeof s==='string'&&/^[1-9][0-9]{0,18}$/.test(s)
function invalid():never{throw Error('INVALID_REQUEST')}
async function session(){const db=await createServerSupabaseClient();const {data,error}=await db.auth.getUser();if(error||!data.user)throw Error('AUTHORITY_DENIED');return db}
export async function commandIngestion(request:string,c:IngestionCommand){
 if(!uuid.test(request)||!c||Object.keys(c).some(k=>!['operation','institution','source','expected','reason','lifecycle'].includes(k))||!operations.includes(c.operation)||!uuid.test(c.institution)||!uuid.test(c.source)||!revision(c.expected)||typeof c.reason!=='string'||!c.reason.trim()||c.reason.length>2000||!c.lifecycle||Array.isArray(c.lifecycle)||typeof c.lifecycle!=='object'||Buffer.byteLength(JSON.stringify(c))>12000)invalid()
 const db=await session(),{data,error}=await db.rpc('remate_ingestion_command',{p_request:request,p_command:c});if(error)throw Error(['PT409','40001'].includes(error.code)?'STALE_REVISION':error.code==='42501'?'AUTHORITY_DENIED':error.code==='23514'?'EVIDENCE_REQUIRED':error.code==='23505'?'REQUEST_CONFLICT':'INVALID_REQUEST')
 if(!data||data.ok!==true||!uuid.test(data.id)||!uuid.test(data.receiptId)||!revision(data.revision)||typeof data.replayed!=='boolean')invalid();return data as {ok:true;id:string;receiptId:string;revision:string;replayed:boolean}
}
export async function readIngestion(q:IngestionQuery):Promise<{items:IngestionRow[]}>{
 if(!q||Object.keys(q).some(k=>!['institution','source','mode','after'].includes(k))||!uuid.test(q.institution)||!uuid.test(q.source)||!['policies','runs','ingestion','events','readiness','reconciliations'].includes(q.mode)||(q.after!==undefined&&!uuid.test(q.after)))invalid()
 const db=await session(),{data,error}=await db.rpc('remate_ingestion_read',{p_query:q});if(error)throw Error('AUTHORITY_DENIED');if(!data||!Array.isArray(data.items)||data.items.length>26)invalid()
 const keys={reconciliations:['id','ingestion_id','observation_id','offering_id','original_binding_id','binding_id','decision_id','revision','prior_id','actor_id','receipt_id','reason','evidence','recorded_at'],policies:['id','revision','source_revision','fresh_seconds','archive_seconds','absent_runs','coverage_key','unconfirmed_visibility','suspended_visibility','reason','recorded_at'],runs:['id','run_id','policy_id','observation_count','recorded_at'],ingestion:['id','observation_id','offering_id','binding_id','adapter_version','outcome','reason','recorded_at'],events:['id','listing_id','offering_id','revision','state','operation','policy_id','ingestion_id','financial_event_id','verification_id','actor_id','receipt_id','reason','recorded_at'],readiness:['id','offering_id','state','revision','eligibility','visibility']};const ids=new Set<string>();
 for(const row of data.items){if(!row||!uuid.test(row.id)||ids.has(row.id)||Object.keys(row).some(k=>!keys[q.mode].includes(k))||JSON.stringify(row).length>16000)invalid();ids.add(row.id);for(const key of ['revision','source_revision','fresh_seconds','archive_seconds'])if(key in row&&!revision(row[key]))invalid();if(q.mode==='readiness'&&(!row.visibility||row.visibility.publicActivation!==false||typeof row.visibility.visible!=='boolean'||!row.eligibility||typeof row.eligibility.eligible!=='boolean'||!Array.isArray(row.eligibility.reasons)))invalid()}
 return data
}
