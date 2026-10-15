import {authorizePdfSource,previewPdfAdapter} from '@/lib/remates/adapters/preview'
import {pdfLimits,type PdfInput} from '@/lib/remates/adapters/pdf'
export const runtime='nodejs'
const reply=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}})
export async function POST(request:Request){
 try{
  if(request.headers.get('origin')!==new URL(request.url).origin)return reply({ok:false},403)
  if(request.headers.get('content-type')!=='application/pdf')return reply({ok:false},415)
  const raw=request.headers.get('x-remate-pdf')||'';if(raw.length>4096)throw Error('INVALID_REQUEST')
  const q=JSON.parse(decodeURIComponent(raw));if(!q||Object.keys(q).some(k=>!['institution','source','expected','mechanism','url','capturedAt','documentComplete'].includes(k)))throw Error('INVALID_REQUEST')
  await authorizePdfSource(q.institution,q.source,q.expected,q.mechanism)
  const reader=request.body?.getReader();if(!reader)throw Error('INVALID_REQUEST');const parts:Uint8Array[]=[];let size=0;const deadline=Date.now()+5000
  try{while(true){const remaining=deadline-Date.now();if(remaining<=0)throw Error('PDF_READ_TIMEOUT');let timer:ReturnType<typeof setTimeout>|undefined;const {done,value}=await Promise.race([reader.read(),new Promise<never>((_,reject)=>{timer=setTimeout(()=>reject(Error('PDF_READ_TIMEOUT')),remaining)})]).finally(()=>{if(timer)clearTimeout(timer)});if(done)break;size+=value.length;if(size>pdfLimits.bytes)throw Error('PDF_SIZE_LIMIT');parts.push(value)}}finally{await reader.cancel()}
  const bytes=new Uint8Array(size);let offset=0;for(const part of parts){bytes.set(part,offset);offset+=part.length}
  const input:PdfInput={mechanism:q.mechanism,url:q.url,capturedAt:q.capturedAt,documentComplete:q.documentComplete}
  return reply({ok:true,data:await previewPdfAdapter(q.institution,q.source,q.expected,q.mechanism,bytes,input)})
 }catch(e){const code=e instanceof Error?e.message:'';return reply({ok:false,error:['STALE_REVISION','SOURCE_CONFIGURATION_MISMATCH'].includes(code)?code:'PDF_PREVIEW_UNAVAILABLE'},code==='PDF_SIZE_LIMIT'?413:code==='AUTHORITY_DENIED'?403:400)}
}
