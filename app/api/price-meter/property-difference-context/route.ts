import { executeDifferenceContext,DifferenceRequestError } from '@/lib/price-meter-property-difference-context-server'
import { toDifferenceDTO } from '@/lib/price-meter-property-difference-context-dto'
import { contextOptions } from '@/lib/price-meter-property-difference-context-acquisition'
import { authorizePriceMeterIntelligenceExecution,PriceMeterComparableAuthenticationError,PriceMeterComparableAuthorizationError } from '@/lib/price-meter-authorization'
export const dynamic='force-dynamic'
const reply=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'private, no-store'}})
function failure(error:unknown){
 if(error instanceof PriceMeterComparableAuthenticationError)return reply({access:'authentication_required'},401)
 if(error instanceof PriceMeterComparableAuthorizationError)return reply({access:'entitlement_required'},403)
 if(error instanceof DifferenceRequestError)return reply({state:'invalid_request',reason:'invalid_context_request'},400)
 return reply({state:'execution_unavailable',reason:'context_request_unavailable'},503)
}
export async function GET(){try{await authorizePriceMeterIntelligenceExecution('cap-property-price-m2-position');return reply(await contextOptions())}catch(error){return failure(error)}}
export async function POST(request:Request){
 try {
  // JSON decoding does no acquisition; the coordinator authorizes before validation/planning.
  let input:unknown
  try {input=await request.json()}catch{input=null}
  return reply(toDifferenceDTO(await executeDifferenceContext(input)))
 }catch(error){return failure(error)}
}
