import 'server-only'
import sharp from 'sharp'
import { createHash } from 'node:crypto'
export const MAX_IMAGE_BYTES=5*1024*1024
export class ImageFailure extends Error { constructor(public reason: 'format'|'size'|'invalid'|'conflict'|'rate'|'storage'|'auth'){super(reason)} }
export async function readImageBody(request: Request){
 const length=Number(request.headers.get('content-length'))
 if(length>MAX_IMAGE_BYTES)throw new ImageFailure('size')
 const reader=request.body?.getReader();if(!reader)throw new ImageFailure('invalid')
 const parts:Uint8Array[]=[];let size=0
 try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>MAX_IMAGE_BYTES){await reader.cancel();throw new ImageFailure('size')}parts.push(value)}}finally{reader.releaseLock()}
 return Buffer.concat(parts,size)
}
function envelope(bytes:Buffer,mime:string){
 // Reject trailing/embedded executable payload markers; never store original input.
 if(/<\?(?:php|=)|<script\b|%PDF-|PK\x03\x04/i.test(bytes.toString('latin1')))throw new ImageFailure('invalid')
 if(mime==='image/jpeg'){
  if(bytes.length<4||bytes[0]!==255||bytes[1]!==216||bytes[2]!==255||bytes[bytes.length-2]!==255||bytes[bytes.length-1]!==217)throw new ImageFailure('invalid')
 }else if(mime==='image/png'){
  if(!bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))throw new ImageFailure('invalid')
  let offset=8,ended=false
  while(offset+12<=bytes.length){const size=bytes.readUInt32BE(offset),kind=bytes.toString('ascii',offset+4,offset+8);if(kind==='acTL'||size>bytes.length-offset-12)throw new ImageFailure('invalid');offset+=12+size;if(kind==='IEND'){if(size!==0||offset!==bytes.length)throw new ImageFailure('invalid');ended=true;break}}
  if(!ended)throw new ImageFailure('invalid')
 }else{
  if(bytes.length<12||bytes.toString('ascii',0,4)!=='RIFF'||bytes.toString('ascii',8,12)!=='WEBP'||bytes.readUInt32LE(4)+8!==bytes.length)throw new ImageFailure('invalid')
  let offset=12;while(offset+8<=bytes.length){const kind=bytes.toString('ascii',offset,offset+4),size=bytes.readUInt32LE(offset+4);if(kind==='ANIM'||kind==='ANMF'||size>bytes.length-offset-8)throw new ImageFailure('invalid');offset+=8+size+(size%2)}if(offset!==bytes.length)throw new ImageFailure('invalid')
 }
}
export async function normalizeProfileImage(bytes:Buffer,mime:string,name:string){
 if(bytes.length>MAX_IMAGE_BYTES)throw new ImageFailure('size')
 const format:Record<string,string>={'image/jpeg':'jpeg','image/png':'png','image/webp':'webp'}
 const ext=name.split('.').pop()?.toLowerCase()
 if(!format[mime]||!ext||!({jpeg:['jpg','jpeg'],png:['png'],webp:['webp']}[format[mime] as 'jpeg'|'png'|'webp']).includes(ext))throw new ImageFailure('format')
 envelope(bytes,mime)
 try{
  const image=sharp(bytes,{failOn:'warning',limitInputPixels:20_000_000,animated:false}).timeout({seconds:5})
  const metadata=await image.metadata()
  if(metadata.format!==format[mime]||!metadata.width||!metadata.height||metadata.width*metadata.height>20_000_000||(metadata.pages??1)>1)throw new ImageFailure('invalid')
  // Sharp strips metadata by default; no keepMetadata/withMetadata on output.
  const {data,info}=await image.rotate().resize({width:1024,height:1024,fit:'inside',withoutEnlargement:true}).webp({quality:85}).toBuffer({resolveWithObject:true})
  if(data.length>MAX_IMAGE_BYTES)throw new ImageFailure('size')
  return {data,width:info.width,height:info.height,bytes:info.size,sha256:createHash('sha256').update(bytes).digest('hex'),outputHash:createHash('sha256').update(data).digest('hex')}
 }catch(e){if(e instanceof ImageFailure)throw e;throw new ImageFailure('invalid')}
}

// The shared TopBar icon is 50 CSS px; preserve sharpness at 2x density.
export const NAV_AVATAR_SIZE=100
export async function normalizeNavigationAvatar(bytes:Buffer){
 try{
  const image=sharp(bytes,{failOn:'warning',limitInputPixels:20_000_000,animated:false}).timeout({seconds:5})
  const metadata=await image.metadata()
  if(!metadata.width||!metadata.height)throw new ImageFailure('invalid')
  const edge=Math.min(NAV_AVATAR_SIZE,metadata.width,metadata.height)
  const {data,info}=await image.rotate().resize({width:edge,height:edge,fit:'cover',position:'centre',withoutEnlargement:true})
   .webp({quality:80}).toBuffer({resolveWithObject:true})
  return {data,width:info.width,height:info.height,bytes:info.size}
 }catch{throw new ImageFailure('invalid')}
}
