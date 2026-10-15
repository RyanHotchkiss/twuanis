import 'server-only'
import {independentOwner} from './independent-import'
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const revision=(x:unknown):x is string=>typeof x==='string'&&/^(0|[1-9][0-9]{0,18})$/.test(x)
export async function readIndependentDiscovery(){
 const db=await independentOwner();const {data,error}=await db.rpc('remate_delivery_read');
 if(error||!data||Object.keys(data).some(k=>!['enabled','revision'].includes(k))||typeof data.enabled!=='boolean'||!revision(data.revision))throw Error('DISCOVERY_STATE_UNAVAILABLE');
 return {enabled:data.enabled as boolean,revision:data.revision as string};
}
export async function commandIndependentDiscovery(request:string,input:{expected:string;enabled:boolean;reason:string;reviewed:boolean}){
 const db=await independentOwner();
 if(!uuid.test(request)||!input||Object.keys(input).some(k=>!['expected','enabled','reason','reviewed'].includes(k))||!revision(input.expected)||typeof input.enabled!=='boolean'||input.reviewed!==true||typeof input.reason!=='string'||!input.reason.trim()||input.reason.length>2000)throw Error('EXPLICIT_DISCOVERY_REVIEW_REQUIRED');
 const {data,error}=await db.rpc('remate_delivery_command',{p_request:request,p_command:{expected:input.expected,enabled:input.enabled,reason:input.reason}});
 if(error)throw Error(['PT409','40001'].includes(error.code)?'STALE_DISCOVERY_REVISION':'DISCOVERY_AUTHORIZATION_DENIED');
 if(!data||data.ok!==true||!uuid.test(data.id)||!uuid.test(data.receiptId)||data.revision!==(BigInt(input.expected)+BigInt(1)).toString()||data.enabled!==input.enabled||typeof data.replayed!=='boolean')throw Error('DISCOVERY_RESULT_UNCONFIRMED');
 return {enabled:data.enabled as boolean,revision:data.revision as string,receiptId:data.receiptId as string,id:data.id as string,replayed:data.replayed as boolean};
}
