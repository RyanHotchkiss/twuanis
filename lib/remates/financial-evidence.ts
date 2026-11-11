import 'server-only'
import {createServerSupabaseClient} from '@/lib/supabase-server'
import {canonicalId} from './geography'
import {financialKinds,type FinancialKind} from './financial-types'
export {financialKinds,type FinancialKind} from './financial-types'
export type FinancialCommand={operation:'financial.retain'|'financial.select';institution:string;source:string;expected:string;reason:string;financial:Record<string,unknown>}
export type FinancialQuery={institution:string;mode:'values'|'history';currency?:'CRC'|'USD';kind?:FinancialKind;after?:string;sort?:'identity'|'amount'}
export type FinancialRow=Record<string,unknown>&{id:string}
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
function invalid():never{throw Error('INVALID_REQUEST')}
async function session(){const db=await createServerSupabaseClient();const {data,error}=await db.auth.getUser();if(error||!data.user)throw Error('AUTHORITY_DENIED');return db}
export async function commandFinancial(request:string,c:FinancialCommand){
 if(!uuid.test(request)||!c||Object.keys(c).some(k=>!['operation','institution','source','expected','reason','financial'].includes(k))||!['financial.retain','financial.select'].includes(c.operation)||!uuid.test(c.institution)||!uuid.test(c.source)||!canonicalId(c.expected)||typeof c.reason!=='string'||!c.reason.trim()||c.reason.length>2000||!c.financial||typeof c.financial!=='object'||Array.isArray(c.financial)||new TextEncoder().encode(JSON.stringify(c)).length>12000)invalid()
 const db=await session(),{data,error}=await db.rpc('remate_financial_command',{p_request:request,p_command:c});if(error)throw Error(['PT409','40001'].includes(error.code)?'STALE_REVISION':error.code==='42501'?'AUTHORITY_DENIED':['22023','23514','23505','22000','P0002','P0003','22003','22P02'].includes(error.code)?'INVALID_REQUEST':'COMMAND_UNAVAILABLE')
 if(!data||data.ok!==true||!uuid.test(data.id)||!uuid.test(data.receiptId)||!canonicalId(data.revision)||typeof data.replayed!=='boolean')invalid();return data as {ok:true;id:string;receiptId:string;revision:string;replayed:boolean}
}
export async function readFinancial(q:FinancialQuery):Promise<{items:FinancialRow[]}>{
 if(!q||Object.keys(q).some(k=>!['institution','mode','currency','kind','after','sort'].includes(k))||!uuid.test(q.institution)||!['values','history'].includes(q.mode)||(q.after!==undefined&&!uuid.test(q.after))||(q.currency!==undefined&&!['CRC','USD'].includes(q.currency))||(q.kind!==undefined&&!financialKinds.includes(q.kind))||(q.sort!==undefined&&!['identity','amount'].includes(q.sort))||(q.sort==='amount'&&(!q.currency||!q.kind||q.kind==='DISCOUNT_PERCENT'||q.mode!=='values'))||(q.mode==='history'&&(q.currency!==undefined||q.kind!==undefined)))invalid()
 const db=await session(),{data,error}=await db.rpc('remate_financial_read',{p_query:q});if(error)throw Error('AUTHORITY_DENIED');if(!data||!Array.isArray(data.items)||data.items.length>26)invalid()
 const keys=q.mode==='values'?['id','offering_id','source_id','observation_id','field_path','ordinal','kind','original_label','raw_amount','original_currency','original_unit','amount','currency','status','round_key','actor_id','receipt_id','reason','recorded_at']:['id','offering_id','revision','prior_id','mechanism','selected_value_id','eligible','actor_id','receipt_id','reason','recorded_at','current'];const seen=new Set<string>();
 for(const row of data.items){if(!row||!uuid.test(row.id)||seen.has(row.id)||Object.keys(row).some(k=>!keys.includes(k))||new TextEncoder().encode(JSON.stringify(row)).length>12000)invalid();if(q.mode==='values'){if(!financialKinds.includes(row.kind)||!['VALID','MISSING','AMBIGUOUS','INVALID'].includes(row.status)||(row.amount!==null&&(typeof row.amount!=='string'||!/^\d+(\.\d+)?$/.test(row.amount))))invalid()}else if(!canonicalId(row.revision)||typeof row.current!=='boolean')invalid();seen.add(row.id)}return data
}
