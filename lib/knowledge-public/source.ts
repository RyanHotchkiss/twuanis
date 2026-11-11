import 'server-only'
import {createClient} from '@/lib/staging-supabase-client'
export const SOURCE_BYTES=1048576
export async function boundedCanonicalFetch(input:RequestInfo|URL,init?:RequestInit){
 const url=new URL(typeof input==='string'?input:input instanceof URL?input.href:input.url),expected=new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!);
 const method=init?.method??(input instanceof Request?input.method:'GET');
 if(url.origin!==expected.origin||method.toUpperCase()!=='GET'||!['/rest/v1/ontology_terms','/rest/v1/ontology_relationships'].includes(url.pathname))throw Error('UNEXPECTED_PUBLIC_SOURCE');
 const response=await fetch(input,init),length=Number(response.headers.get('content-length'));
 if(Number.isFinite(length)&&length>SOURCE_BYTES){await response.body?.cancel();throw Error('SOURCE_BOUNDS_EXCEEDED')}
 const reader=response.body?.getReader();if(!reader)throw Error('SOURCE_UNAVAILABLE');const chunks:Uint8Array[]=[];let size=0;
 try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>SOURCE_BYTES)throw Error('SOURCE_BOUNDS_EXCEEDED');chunks.push(value)}}catch(error){await reader.cancel().catch(()=>{});throw error}finally{reader.releaseLock()}
 const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength}
 return new Response(bytes,{status:response.status,statusText:response.statusText,headers:{'content-type':response.headers.get('content-type')||'application/json'}})
}
let client:ReturnType<typeof createClient>|undefined;
export function publicCanonicalClient(){
 if(!client)client=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!,{auth:{persistSession:false,autoRefreshToken:false},global:{fetch:boundedCanonicalFetch}})
 return client
}
