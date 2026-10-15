import {authorizeFixture} from '@/lib/remates/retrieval-diagnostic'
import {fixtureResponse} from '@/lib/remates/retrieval-diagnostic-fixture'
export const runtime='nodejs'
export const maxDuration=15
export async function GET(request:Request){try{const ticket=await authorizeFixture(request);return await fixtureResponse(ticket.scenario,ticket.attempt)}catch{return Response.json({error:'Unavailable'},{status:404,headers:{'Cache-Control':'no-store'}})}}
