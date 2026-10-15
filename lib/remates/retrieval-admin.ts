import 'server-only'
import {createServerSupabaseClient} from '@/lib/supabase-server'
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
export type RetrievalConfiguration={worker:string;adapter:string;urls:string[];cadence:number;authorization:string;expires:string;enabled:boolean}
export async function retrievalInventory(){const db=await createServerSupabaseClient();const {data,error}=await db.rpc('remate_retrieval_read',{});if(error||data?.owner!==true||!Array.isArray(data?.items)||data.items.length>100)throw Error('RETRIEVAL_ACCESS_DENIED');return data.items as {source_id:string;worker_id:string;revision:string;adapter:string;urls:string[];cadence_seconds:number;authorization_evidence:string;authorization_expires_at:string;enabled:boolean;next_due_at:string;lease_id:string|null;expires_at:string|null;run_id:string|null;receipt_id:string|null;run_outcome:string|null;last_event:Record<string,unknown>|null}[]}
export async function configureRetrieval(request:string,source:string,expected:string,configuration:RetrievalConfiguration,reason:string){
 if(!uuid.test(request)||!uuid.test(source)||!/^(0|[1-9][0-9]{0,18})$/.test(expected)||JSON.stringify(configuration).length>8000||reason.trim().length<3||reason.length>2000)throw Error('INVALID_RETRIEVAL_CONFIGURATION')
 const db=await createServerSupabaseClient(),{data,error}=await db.rpc('remate_retrieval_configure',{p_request:request,p_source:source,p_expected:expected,p_configuration:configuration,p_reason:reason})
 if(error)throw Error(error.code==='PT409'?'STALE_REVISION':'RETRIEVAL_ACCESS_DENIED');if(data?.ok!==true||!uuid.test(data.receiptId))throw Error('RETRIEVAL_UNAVAILABLE');return data as {ok:true;revision:string;receiptId:string;replayed:boolean}
}
