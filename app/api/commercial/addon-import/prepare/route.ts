import {prepareBulkAddon} from '@/app/commercial/addon-actions'
export const runtime='nodejs'
export async function POST(request:Request){
 if(request.headers.get('origin')!==new URL(request.url).origin)return Response.json({ok:false,reason:'forbidden'},{status:403})
 if(request.headers.get('content-type')?.split(';')[0]!=='application/json')return Response.json({ok:false,reason:'invalid'},{status:415})
 try{
  const reader=request.body?.getReader();if(!reader)throw Error()
  let size=0,text='';const decoder=new TextDecoder()
  try{for(;;){const part=await reader.read();if(part.done)break;size+=part.value.byteLength;if(size>2097152){await reader.cancel();return Response.json({ok:false,reason:'too_large'},{status:413})}text+=decoder.decode(part.value,{stream:true})}}finally{reader.releaseLock()}
  const input=JSON.parse(text+decoder.decode())
  if(!input||Array.isArray(input)||!['request,rows','provider,request,rows'].includes(Object.keys(input).sort().join(','))||(input.provider!==undefined&&!['stripe','existing'].includes(input.provider)))throw Error()
  const result=await prepareBulkAddon(input.request,input.rows,input.provider??'existing')
  return Response.json(result,{status:result.ok?200:422})
 }catch{return Response.json({ok:false,reason:'invalid'},{status:400})}
}
