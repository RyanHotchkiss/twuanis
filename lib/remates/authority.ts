import 'server-only'
import {createServerSupabaseClient} from '@/lib/supabase-server'
export type AuthorityQuery={mode:'institutions'|'members'|'events'|'sources'|'foundation';institution?:string;after?:string}
export type AuthorityCommand={operation:string;institution:string;reason:string;target?:string;expected:string;permission?:string;mandate_evidence?:string;review_evidence?:string}
export type AuthorityRow=Record<string,unknown>
export type AuthorityRead={items:AuthorityRow[];owner:boolean;permissions:string[];catalog:string[];actor:string;membershipClass:string|null;institutionRevision?:string|null}
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const operations=['administrator.appoint','administrator.revoke','representative.activate','representative.revoke','permission.grant','permission.revoke','institution.suspend','institution.restore','institution.reject','foundation.create']
async function session(){const db=await createServerSupabaseClient();const {data,error}=await db.auth.getUser();if(error||!data.user)throw Error('AUTHORITY_DENIED');return db}
function invalid():never{throw Error('INVALID_REQUEST')}
export async function readInstitutionAuthority(query:AuthorityQuery):Promise<AuthorityRead>{
 if(!query||!['institutions','members','events','sources','foundation'].includes(query.mode)||Object.keys(query).some(k=>!['mode','institution','after'].includes(k)))invalid()
 if(query.institution!==undefined&&!uuid.test(query.institution))invalid();if(query.after!==undefined&&!uuid.test(query.after))invalid();if(query.mode!=='institutions'&&!query.institution)invalid()
 const db=await session(),{data,error}=await db.rpc('remate_authority_read',{p_query:query});if(error)throw Error('AUTHORITY_DENIED')
 if(!data||!Array.isArray(data.items)||data.items.length>26||typeof data.owner!=='boolean'||!Array.isArray(data.permissions)||!Array.isArray(data.catalog)||data.catalog.length>32||!uuid.test(data.actor)||!(data.membershipClass===null||['ADMINISTRATOR','REPRESENTATIVE'].includes(data.membershipClass)))invalid()
 if(data.institutionRevision!==undefined&&data.institutionRevision!==null&&(typeof data.institutionRevision!=='string'||!/^[1-9][0-9]*$/.test(data.institutionRevision)))invalid()
 const ids=new Set<string>();for(const row of data.items){if(!row||!uuid.test(row.id)||ids.has(row.id)||(row.revision!==undefined&&(typeof row.revision!=='string'||!/^[1-9][0-9]*$/.test(row.revision))))invalid();ids.add(row.id)}
 if([...data.permissions,...data.catalog].some(p=>typeof p!=='string'||p.length>64)||data.permissions.some((p:string)=>!data.catalog.includes(p)))invalid()
 return data
}
export async function commandInstitutionAuthority(request:string,command:AuthorityCommand){
 if(!uuid.test(request)||!command||!operations.includes(command.operation)||Object.keys(command).some(k=>!['operation','institution','reason','target','expected','permission','mandate_evidence','review_evidence'].includes(k))||!uuid.test(command.institution)||typeof command.expected!=='string'||!/^(0|[1-9][0-9]{0,18})$/.test(command.expected)||typeof command.reason!=='string'||!command.reason.trim()||command.reason.length>2000)invalid()
 if(command.target!==undefined&&!uuid.test(command.target))invalid();if(JSON.stringify(command).length>16384)invalid()
 const db=await session(),{data,error}=await db.rpc('remate_authority_command',{p_request:request,p_command:command});if(error)throw Error(['PT409','40001'].includes(error.code)?'STALE_REVISION':error.code==='42501'?'AUTHORITY_DENIED':'COMMAND_UNAVAILABLE')
 if(!data||data.ok!==true||!uuid.test(data.id)||!uuid.test(data.eventId)||typeof data.revision!=='string'||!/^[1-9][0-9]*$/.test(data.revision)||typeof data.replayed!=='boolean')invalid()
 return data as {ok:true;id:string;revision:string;eventId:string;replayed:boolean}
}
