import 'server-only'
import {createServerSupabaseClient} from '@/lib/supabase-server'
export type IdentityCommand={operation:'identity.propose'|'identity.decide';institution:string;source:string;expected:string;reason:string;identity:Record<string,unknown>}
export type IdentityQuery={institution:string;mode:'cases'|'bindings'|'properties';after?:string}
export type IdentityRow=Record<string,unknown>&{id:string}
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
function invalid():never{throw Error('INVALID_REQUEST')}
async function session(){const db=await createServerSupabaseClient();const {data,error}=await db.auth.getUser();if(error||!data.user)throw Error('AUTHORITY_DENIED');return db}
export async function commandIdentity(request:string,command:IdentityCommand){
 if(!uuid.test(request)||!command||Object.keys(command).some(k=>!['operation','institution','source','expected','reason','identity'].includes(k))||!['identity.propose','identity.decide'].includes(command.operation)||!uuid.test(command.institution)||!uuid.test(command.source)||typeof command.expected!=='string'||!/^[1-9][0-9]{0,18}$/.test(command.expected)||typeof command.reason!=='string'||!command.reason.trim()||command.reason.length>2000||!command.identity||typeof command.identity!=='object'||Array.isArray(command.identity)||new TextEncoder().encode(JSON.stringify(command)).length>16384)invalid()
 const db=await session(),{data,error}=await db.rpc('remate_identity_command',{p_request:request,p_command:command});if(error)throw Error(['PT409','40001'].includes(error.code)?'STALE_REVISION':error.code==='42501'?'AUTHORITY_DENIED':['22023','23514','23505'].includes(error.code)?'INVALID_REQUEST':'COMMAND_UNAVAILABLE')
 if(!data||data.ok!==true||!uuid.test(data.id)||!uuid.test(data.receiptId)||typeof data.replayed!=='boolean'||typeof data.revision!=='string'||!['1','2'].includes(data.revision)||!['PENDING','RESOLVED','REJECTED'].includes(data.status)||(data.offeringId!==undefined&&data.offeringId!==null&&!uuid.test(data.offeringId)))invalid();return data as {ok:true;id:string;receiptId:string;revision:string;status:string;offeringId?:string|null;replayed:boolean}
}
export async function readIdentity(query:IdentityQuery):Promise<{items:IdentityRow[]}>{
 if(!query||Object.keys(query).some(k=>!['institution','mode','after'].includes(k))||!uuid.test(query.institution)||!['cases','bindings','properties'].includes(query.mode)||(query.after!==undefined&&!uuid.test(query.after)))invalid()
 const db=await session(),{data,error}=await db.rpc('remate_identity_read',{p_query:query});if(error)throw Error('AUTHORITY_DENIED')
 if(!data||!Array.isArray(data.items)||data.items.length>26)invalid()
 const keys={cases:['id','source_id','observation_id','record_key','conflict','status','revision','decision','offering_id','reason','created_at','decided_at','proposal'],bindings:['id','source_id','record_key','offering_id','observation_id','revision','starts_at','ends_at','current'],properties:['id','identity_status','revision','identifiers','identifier_limit']}
 const seen=new Set<string>();for(const row of data.items){if(!row||!uuid.test(row.id)||seen.has(row.id)||typeof row.revision!=='string'||!/^[1-9][0-9]*$/.test(row.revision)||Object.keys(row).some(k=>!keys[query.mode].includes(k))||new TextEncoder().encode(JSON.stringify(row)).length>16384)invalid();seen.add(row.id)}return data
}
