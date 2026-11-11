import 'server-only'
import {supabaseAdmin} from './supabase-admin'
export async function directSinpeReadiness(){try{const r=await supabaseAdmin.rpc('direct_sinpe_ready');return !r.error&&r.data===true}catch{return false}}
