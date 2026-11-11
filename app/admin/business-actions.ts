'use server'
import {assertAdministrativePermission} from '@/lib/administrative-control'
import {createServerSupabaseClient} from '@/lib/supabase-server'
import {businessOrders,businessPayments} from './business-read'
export async function readBusinessOrders(input:{account?:string;kind?:string;source?:string;currency?:string}={}){try{const a=await assertAdministrativePermission('orders.read');if(!a.owner)throw Error();if(Object.keys(input).some(k=>!['account','kind','source','currency'].includes(k))||input.account&&!/^[a-f0-9-]{36}$/i.test(input.account))throw Error();const db=await createServerSupabaseClient();return{ok:true as const,data:await businessOrders(db,a,{p_account:input.account||null,p_kind:input.kind||null,p_source:input.source||null,p_currency:input.currency||null})}}catch{return{ok:false as const}}}
export async function readBusinessPayments(){try{const a=await assertAdministrativePermission('payments.read');if(!a.owner)throw Error();const db=await createServerSupabaseClient();return{ok:true as const,data:await businessPayments(db,a)}}catch{return{ok:false as const}}}
