import {ingestJourney} from '@/app/measurement/journey-actions'
export const runtime='nodejs'
export const maxDuration=5
export async function POST(request:Request){
 try{if(!journeyCollectionEnabled())return new Response(null,{status:404});const origin=request.headers.get('origin'),expected=new URL(request.url).origin
 if(!origin||origin!==expected||!['application/json'].includes((request.headers.get('content-type')||'').split(';')[0])||Number(request.headers.get('content-length')||0)>22000)return new Response(null,{status:403})
 const reader=request.body?.getReader();if(!reader)return new Response(null,{status:400});let length=0;const chunks:Uint8Array[]=[]
 for(;;){const r=await reader.read();if(r.done)break;length+=r.value.byteLength;if(length>22000){await reader.cancel();return new Response(null,{status:413})}chunks.push(r.value)}
 const payload=JSON.parse(Buffer.concat(chunks).toString('utf8'));return Response.json(await ingestJourney(payload),{headers:{'Cache-Control':'no-store'}})
 }catch{return Response.json({state:'UNAVAILABLE'},{status:503,headers:{'Cache-Control':'no-store'}})}
}
import {journeyCollectionEnabled} from '@/lib/measurement/journey-enabled'
