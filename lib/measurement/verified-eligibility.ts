import 'server-only'
import {createServerSupabaseClient} from '@/lib/supabase-server'
import {requestMeasurementEligibility} from './owner-ip-exclusion'
import {measurementOwnerExcluded} from './owner-exclusion'
export async function verifiedMeasurementEligibility():Promise<'eligible'|'excluded'|'unknown'>{
 try{
  const source=await requestMeasurementEligibility()
  if(source==='excluded')return 'excluded'
  const db=await createServerSupabaseClient()
  let timer:ReturnType<typeof setTimeout>|undefined
  const result=await Promise.race([db.auth.getUser(),new Promise<null>(resolve=>{timer=setTimeout(()=>resolve(null),2000)})]).finally(()=>{if(timer)clearTimeout(timer)})
  if(!result)return 'unknown'
  const {data,error}=result
  if(error&&error.name!=='AuthSessionMissingError')return 'unknown'
  if(measurementOwnerExcluded(data.user?.id))return 'excluded'
  if(source==='unknown')return 'unknown'
  if(!data.user)return 'eligible'
  // Canonical Owner role is authoritative; unresolved identity never enables delivery.
  let ownerTimer:ReturnType<typeof setTimeout>|undefined
  const owner=await Promise.race([db.rpc('is_current_user_owner'),new Promise<null>(resolve=>{ownerTimer=setTimeout(()=>resolve(null),2000)})]).finally(()=>{if(ownerTimer)clearTimeout(ownerTimer)})
  if(!owner||owner.error||typeof owner.data!=='boolean')return 'unknown'
  return owner.data?'excluded':'eligible'
 }catch{return 'unknown'}
}
