import {NextResponse} from 'next/server'
import {validatePopulationEngineRequest,type PopulationEngineRequest} from '@/lib/population-engine-execution'
import {PackageCapabilityDenied} from '@/lib/package-capability-authorization'

export const dynamic='force-dynamic'
// One requested engine. Account, capability, evidence and FX are server-owned.
export async function POST(request:Request){
 const headers={'Cache-Control':'private, no-store'}
 let input:PopulationEngineRequest
 try{const text=await request.text();if(text.length>16000)return NextResponse.json({error:'invalid_question'},{status:400,headers});input=JSON.parse(text)}catch{return NextResponse.json({error:'invalid_question'},{status:400,headers})}
 try{validatePopulationEngineRequest(input);return NextResponse.json({error:'population_adapter_required'},{status:409,headers})}
 catch(error){return NextResponse.json({error:error instanceof PackageCapabilityDenied?'entitlement_required':'execution_unavailable'},{status:error instanceof PackageCapabilityDenied?403:400,headers})}
}
