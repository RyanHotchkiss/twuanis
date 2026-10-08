import 'server-only'
// Bound bytes before parsing, including requests without Content-Length.
export async function campaignRequestBytes(request:Request,limit:number):Promise<Uint8Array>{
 if(!request.body)throw Error('body required')
 const reader=request.body.getReader(),parts:Uint8Array[]=[];let size=0
 try{for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>limit){await reader.cancel();throw Error('body too large')}parts.push(value)}}finally{reader.releaseLock()}
 const bytes=new Uint8Array(size);let offset=0;for(const part of parts){bytes.set(part,offset);offset+=part.byteLength}return bytes
}
