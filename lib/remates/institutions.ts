import 'server-only'
import {resolveAdministrativeAuthority} from '@/lib/administrative-control'
import {createServerSupabaseClient} from '@/lib/supabase-server'
export type RegistryQuery={mode:'institutions'|'sources'|'aliases'|'events'|'foundation';after?:string;target?:string}
export type RegistryRow=Record<string,unknown>
export type RegistryRead={items:RegistryRow[];approvalAvailable:boolean}
export type RegistryCommand={operation:'institution.register'|'institution.verify'|'institution.approve'|'source.register'|'source.alias'|'foundation.create';reason:string;[key:string]:unknown}
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const modes=new Set(['institutions','sources','aliases','events','foundation'])
const keys:Record<RegistryCommand['operation'],readonly string[]>={
 'institution.register':['name'], 'institution.verify':['target','expected','legal_identifier','identity_evidence'],
 'institution.approve':['target','expected','mandate_evidence','initial_representative_reference'],
 'source.register':['institution','expected','namespace','channel','origin','adapter_version'],
 'source.alias':['target','expected','namespace'], 'foundation.create':['target','expected']
}
function fail():never{throw Error('Registry access or request unavailable')}
async function client(){const authority=await resolveAdministrativeAuthority();if(!authority.owner)fail();return createServerSupabaseClient()}
export async function readInstitutionRegistry(query:RegistryQuery):Promise<RegistryRead>{
 if(!query||!modes.has(query.mode)||Object.keys(query).some(k=>!['mode','after','target'].includes(k)))fail()
 if(query.target!==undefined&&!uuid.test(query.target))fail()
 if(query.after!==undefined&&(query.mode==='aliases'?query.after.length>128:!uuid.test(query.after)))fail()
 const db=await client();const {data,error}=await db.rpc('remate_registry_read',{p_query:query})
 if(error||!data||!Array.isArray(data.items)||data.items.length>26||typeof data.approvalAvailable!=='boolean')fail()
 const ids=new Set<string>()
 for(const row of data.items){if(!row||typeof row!=='object'||Array.isArray(row))fail();const id=query.mode==='aliases'?row.namespace:row.id;if(typeof id!=='string'||(query.mode!=='aliases'&&!uuid.test(id))||ids.has(id))fail();ids.add(id);if(row.revision!==undefined&&(typeof row.revision!=='string'||!/^[1-9][0-9]*$/.test(row.revision)))fail()}
 return {items:data.items,approvalAvailable:data.approvalAvailable}
}
export async function commandInstitutionRegistry(requestId:string,command:RegistryCommand){
 if(!uuid.test(requestId)||!command||!Object.hasOwn(keys,command.operation)||typeof command.reason!=='string'||!command.reason.trim()||command.reason.length>2000||JSON.stringify(command).length>16384)fail()
 const allowed=keys[command.operation];if(Object.keys(command).some(k=>!['operation','reason',...allowed].includes(k)))fail()
 for(const k of ['target','institution'])if(command[k]!==undefined&&(typeof command[k]!=='string'||!uuid.test(command[k] as string)))fail()
 if(command.expected!==undefined&&(typeof command.expected!=='string'||!/^[1-9][0-9]{0,18}$/.test(command.expected)))fail()
 const db=await client();const {data,error}=await db.rpc('remate_registry_command',{p_request:requestId,p_command:command})
 if(error)throw Error(['PT409','40001'].includes(error.code)?'STALE_REVISION':'Registry access or request unavailable');if(!data||data.ok!==true||!uuid.test(data.id)||!uuid.test(data.eventId)||typeof data.revision!=='string'||!/^[1-9][0-9]*$/.test(data.revision)||typeof data.replayed!=='boolean')fail()
 return data as {ok:true;id:string;eventId:string;revision:string;replayed:boolean}
}
