import 'server-only'
import {normalizedSavedUniverse} from './saved-universe-contract'
import { createServerSupabaseClient } from '@/lib/supabase-server'

// Reject malformed database identities before making an authenticated query.
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function loadAnalysis(id: string) {
  if (!uuid.test(id)) return null

  const supabase = await createServerSupabaseClient()
  const { data: auth, error: authError } = await supabase.auth.getUser()
  if (authError || !auth.user) return null

  // Ownership and current capability remain enforced by canonical database RLS.
  const { data, error } = await supabase
    .from('saved_analyses')
    .select('*')
    .eq('id', id)
    .eq('user_id', auth.user.id)
    .maybeSingle()

  // Database failures must not expose query details or private evidence.
  if (error) throw new Error('Saved analysis could not be loaded.')
  if(!data)return null
  const permission=await supabase.rpc('can_access_saved_analysis',{p_engine:data.engine_type,p_filters:data.filters})
  if(permission.error||permission.data!==true)return null
  try{return {...data,filters:normalizedSavedUniverse(data.engine_type,data.filters,data.result)}}
  catch{return {...data,result:null,universeReselectionRequired:true}}

}
