import { authorizePriceMeterIntelligenceExecution, PriceMeterComparableAuthenticationError, PriceMeterComparableAuthorizationError } from '@/lib/price-meter-authorization'
import { parsePositionRequest, type PositionRequest } from '@/lib/price-meter-property-position-request'
import { getPositionConfiguration, executePropertyPosition } from '@/lib/price-meter-property-position-server'
import { toPositionDTO } from '@/lib/price-meter-property-position-dto'
export const dynamic = 'force-dynamic'
const reply = (body: unknown, status = 200) => Response.json(body,{status,headers:{'Cache-Control':'private, no-store'}})
async function handle(request: Request, configuration: boolean) {
  try {
    await authorizePriceMeterIntelligenceExecution()
    let parsed
    try {
      if (configuration) {
        const params = new URL(request.url).searchParams
        if ([...params.keys()].length !== 1) throw new Error('Invalid query.')
        parsed = parsePositionRequest(Object.fromEntries(params),true)
      } else parsed = parsePositionRequest(await request.json())
    } catch { return reply({state:'reference_definition_invalid',reason:'invalid_request'},400) }
    if (configuration) {
      const config = await getPositionConfiguration(parsed.listingId)
      return reply('geographies' in config ? config : {state:config.state,reason:config.reason})
    }
    return reply(toPositionDTO(await executePropertyPosition(parsed as PositionRequest)))
  } catch (error) {
    if (error instanceof PriceMeterComparableAuthenticationError) return reply({access:'authentication_required'},401)
    if (error instanceof PriceMeterComparableAuthorizationError) return reply({access:'entitlement_required'},403)
    return reply({state:'execution_unavailable',reason:'request_unavailable'},503)
  }
}
export const GET = (request: Request) => handle(request,true)
export const POST = (request: Request) => handle(request,false)
