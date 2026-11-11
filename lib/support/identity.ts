import 'server-only'
import {createServerSupabaseClient} from '@/lib/supabase-server'
export async function readSupportIdentity(){
 try{const db=await createServerSupabaseClient(),{data,error}=await db.auth.getUser();const id=data.user?.id
 return !error&&id&&/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(id)?{ok:true as const,userId:id}:{ok:false as const}
 }catch{return {ok:false as const}}
}
