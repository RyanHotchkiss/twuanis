import 'server-only'
import {createServerSupabaseClient} from './supabase-server'

// Commercial identities only. Membership and purchased rights remain database-owned.
export const ANALYTICAL_CAPABILITIES = [
 'cap-market-summary','cap-market-composition','cap-market-asking-price-distribution',
 'cap-property-matching','cap-market-comparison','cap-geographic-price-m2-comparison',
 'cap-comparative-price-m2-discovery','cap-property-configuration-frequency',
 'cap-price-m2-distribution','cap-size-price-m2','cap-construction-land-price-m2',
 'cap-property-price-m2-position','cap-user-defined-comparable-cohort',
 'cap-user-defined-cohort-price-m2-comparison','cap-cross-dimensional-analysis',
 'cap-asking-area-coefficient-ratio','cap-weighted-price-m2'
] as const
export type AnalyticalCapability = typeof ANALYTICAL_CAPABILITIES[number]
// Server deployment control only; never accepted from request input. Default retains
// current production access until separately authorized acquisition/fulfillment cutover.
export function canonicalPackageEnforcement():boolean {
 const mode=process.env.TWUANIS_PACKAGE_ENFORCEMENT
 if(mode===undefined||mode==='legacy')return false
 if(mode==='canonical')return true
 throw new Error('Invalid package enforcement configuration.')
}
export class PackageCapabilityDenied extends Error {
 constructor(){super('Analytical capability access is required.');this.name='PackageCapabilityDenied'}
}
export async function authorizeCanonicalCapability(capability:AnalyticalCapability):Promise<string>{
 if(!ANALYTICAL_CAPABILITIES.includes(capability))throw new PackageCapabilityDenied()
 const db=await createServerSupabaseClient()
 const {data,error}=await db.auth.getUser()
 if(error||!data.user)throw new PackageCapabilityDenied()
 const access=await db.rpc('current_account_has_capability',{p_capability:capability})
 if(access.error||access.data!==true)throw new PackageCapabilityDenied()
 return data.user.id
}
// These exact six engines currently permit public execution. No public fallback
// runs in canonical mode; no Owner override is treated as purchased access.
export async function authorizePreviouslyPublicCapability(capability:AnalyticalCapability):Promise<void>{
 if(!ANALYTICAL_CAPABILITIES.includes(capability))throw new PackageCapabilityDenied()
 if(canonicalPackageEnforcement())await authorizeCanonicalCapability(capability)
}
