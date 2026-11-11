import 'server-only'
import {createServerSupabaseClient} from '@/lib/supabase-server'
import {canonicalId,referenceDimensions,type ReferenceDimension} from './geography'
export type ClassificationCommand={operation:'classification.record';institution:string;source:string;expected:string;reason:string;classification:Record<string,unknown>}
export type ClassificationQuery={institution:string;mode:'history'|'references';after?:string;dimension?:ReferenceDimension;parent?:string}
export type ClassificationRow=Record<string,unknown>&{id:string}
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
function invalid():never{throw Error('INVALID_REQUEST')}
async function session(){const db=await createServerSupabaseClient();const {data,error}=await db.auth.getUser();if(error||!data.user)throw Error('AUTHORITY_DENIED');return db}
export async function commandClassification(request:string,c:ClassificationCommand){
 if(!uuid.test(request)||!c||Object.keys(c).some(k=>!['operation','institution','source','expected','reason','classification'].includes(k))||c.operation!=='classification.record'||!uuid.test(c.institution)||!uuid.test(c.source)||!canonicalId(c.expected)||typeof c.reason!=='string'||!c.reason.trim()||c.reason.length>2000||!c.classification||typeof c.classification!=='object'||Array.isArray(c.classification)||new TextEncoder().encode(JSON.stringify(c)).length>16384)invalid()
 const db=await session(),{data,error}=await db.rpc('remate_classification_command',{p_request:request,p_command:c});if(error)throw Error(['PT409','40001'].includes(error.code)?'STALE_REVISION':error.code==='42501'?'AUTHORITY_DENIED':['22023','23514','23505','22000','P0002','P0003','22003','22P02'].includes(error.code)?'INVALID_REQUEST':'COMMAND_UNAVAILABLE')
 if(!data||data.ok!==true||!uuid.test(data.id)||!uuid.test(data.receiptId)||!canonicalId(data.revision)||typeof data.minimumReady!=='boolean'||typeof data.replayed!=='boolean')invalid();return data as {ok:true;id:string;receiptId:string;revision:string;minimumReady:boolean;replayed:boolean}
}
export async function readClassification(q:ClassificationQuery):Promise<{items:ClassificationRow[]}>{
 if(!q||Object.keys(q).some(k=>!['institution','mode','after','dimension','parent'].includes(k))||!uuid.test(q.institution)||!['history','references'].includes(q.mode))invalid()
 if(q.mode==='references'){if(!referenceDimensions.includes(q.dimension!)||(q.after!==undefined&&!canonicalId(q.after))||(q.parent!==undefined&&!canonicalId(q.parent)))invalid()}else if(q.dimension!==undefined||q.parent!==undefined||(q.after!==undefined&&!uuid.test(q.after)))invalid()
 const db=await session(),{data,error}=await db.rpc('remate_classification_read',{p_query:q});if(error)throw Error('AUTHORITY_DENIED');if(!data||!Array.isArray(data.items)||data.items.length>26)invalid()
 const keys=q.mode==='references'?['id','parent_id','term_type','official_code','term_name','name_en','name_es']:['id','property_id','property_revision','source_id','observation_id','binding_id','revision','prior_id','reason','snapshot','minimum_ready','recorded_at','current','current_minimum_ready'];const seen=new Set<string>();
 for(const row of data.items){if(!row||!(q.mode==='references'?canonicalId(row.id):uuid.test(row.id))||seen.has(row.id)||Object.keys(row).some(k=>!keys.includes(k))||new TextEncoder().encode(JSON.stringify(row)).length>16384)invalid();if(q.mode==='references'){if(row.parent_id!==null&&!canonicalId(row.parent_id))invalid()}else if(!canonicalId(row.revision)||!canonicalId(row.property_revision)||typeof row.minimum_ready!=='boolean'||typeof row.current!=='boolean'||typeof row.current_minimum_ready!=='boolean')invalid();seen.add(row.id)}return data
}
