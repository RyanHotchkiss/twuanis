import 'server-only'
import {createServerSupabaseClient} from '@/lib/supabase-server'
export type EvidenceCommand={operation:'run.retain'|'observation.retain'|'observation.link';institution:string;source:string;expected:string;reason:string;evidence:Record<string,unknown>}
export type EvidenceQuery={institution:string;source:string;mode:'runs'|'observations'|'links';after?:string}
export type EvidenceResult={ok:true;id:string;receiptId:string;revision?:string;replayed:boolean}
export type EvidenceRow=Record<string,unknown>&{id:string}
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
function invalid():never{throw Error('INVALID_REQUEST')}
async function session(){const db=await createServerSupabaseClient();const {data,error}=await db.auth.getUser();if(error||!data.user)throw Error('AUTHORITY_DENIED');return db}
export async function commandEvidence(request:string,command:EvidenceCommand):Promise<EvidenceResult>{
 if(!uuid.test(request)||!command||Object.keys(command).some(k=>!['operation','institution','source','expected','reason','evidence'].includes(k))||!['run.retain','observation.retain','observation.link'].includes(command.operation)||!uuid.test(command.institution)||!uuid.test(command.source)||typeof command.expected!=='string'||!/^[1-9][0-9]{0,18}$/.test(command.expected)||typeof command.reason!=='string'||!command.reason.trim()||command.reason.length>2000||!command.evidence||Array.isArray(command.evidence)||typeof command.evidence!=='object'||new TextEncoder().encode(JSON.stringify(command)).length>16384)invalid()
 const db=await session(),{data,error}=await db.rpc('remate_evidence_command',{p_request:request,p_command:command})
 if(error)throw Error(['PT409','40001'].includes(error.code)?'STALE_REVISION':error.code==='42501'?'AUTHORITY_DENIED':error.code==='22023'?'INVALID_REQUEST':'COMMAND_UNAVAILABLE')
 if(!data||data.ok!==true||!uuid.test(data.id)||!uuid.test(data.receiptId)||typeof data.replayed!=='boolean'||(data.revision!==undefined&&(typeof data.revision!=='string'||!/^[1-9][0-9]*$/.test(data.revision))))invalid();return data
}
export async function readEvidence(query:EvidenceQuery):Promise<{items:EvidenceRow[]}>{
 if(!query||Object.keys(query).some(k=>!['institution','source','mode','after'].includes(k))||!uuid.test(query.institution)||!uuid.test(query.source)||!['runs','observations','links'].includes(query.mode)||(query.after!==undefined&&!uuid.test(query.after)))invalid()
 const db=await session(),{data,error}=await db.rpc('remate_evidence_read',{p_query:query});if(error)throw Error('AUTHORITY_DENIED')
 if(!data||!Array.isArray(data.items)||data.items.length>26)invalid()
 const allowed={runs:['id','run_key','outcome','scope','started_at','ended_at','recorded_at','source_revision','adapter_version','page_manifest'],observations:['id','run_id','observation_key','record_key','retrieved_at','published_at','updated_at','recorded_at','parser_version','parse_status','content_sha256'],links:['id','observation_id','offering_id','property_id','revision','reason','recorded_at']}
 const seen=new Set<string>();for(const row of data.items){if(!row||!uuid.test(row.id)||seen.has(row.id)||Object.keys(row).some(k=>!allowed[query.mode].includes(k))||JSON.stringify(row).length>16384)invalid();seen.add(row.id);for(const key of ['revision','source_revision'])if(key in row&&(typeof row[key]!=='string'||!/^[1-9][0-9]*$/.test(row[key])))invalid()}
 return data
}
