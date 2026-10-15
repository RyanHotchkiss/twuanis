'use server'
import {commandMedia,readMedia,type MediaCommand,type MediaQuery} from '@/lib/remates/media'
export async function mediaRead(q:MediaQuery){try{return {ok:true as const,data:await readMedia(q)}}catch{return {ok:false as const}}}
export async function mediaCommand(request:string,c:MediaCommand){try{if(!['reference.retain','media.remove'].includes(c.operation))throw Error('INVALID_REQUEST');return {ok:true as const,data:await commandMedia(request,c)}}catch(e){return {ok:false as const,error:e instanceof Error&&['AUTHORITY_DENIED','STALE_REVISION','INVALID_REQUEST'].includes(e.message)?e.message:'MEDIA_UNAVAILABLE'}}}
