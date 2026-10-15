import {createMyOrchestratorEvidenceReader} from '@/lib/orchestrator-report-delivery'
export const dynamic='force-dynamic'
export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}){
 try{
  const {id}=await params,readChunk=await createMyOrchestratorEvidenceReader(),first=await readChunk(id)
  const encoder=new TextEncoder();let next=first.next
  const stream=new ReadableStream<Uint8Array>({
   start(controller){controller.enqueue(encoder.encode(first.text));if(next===null)controller.close()},
   async pull(controller){if(next===null)return;try{const part=await readChunk(id,next,first.identity);next=part.next;controller.enqueue(encoder.encode(part.text));if(next===null)controller.close()}catch(error){controller.error(error)}}
  })
  return new Response(stream,{headers:{'Content-Type':'application/json; charset=utf-8','Content-Disposition':`attachment; filename="Twuanis-evidence-${id}.json"`,'Cache-Control':'private, no-store','X-Evidence-SHA256':first.identity}})
 }catch{return new Response('Evidence unavailable',{status:403,headers:{'Cache-Control':'no-store'}})}
}
