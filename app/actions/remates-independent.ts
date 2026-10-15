'use server'
import {independentOwner,independentSource,authorizeIndependent,validateIndependent,importIndependent,independentPublication,publishIndependent} from '@/lib/remates/independent-import'
async function result<T>(work:()=>Promise<T>){try{return {ok:true as const,data:await work()}}catch(e){const code=e instanceof Error?e.message:'';return {ok:false as const,error:/^[A-Z_]+$/.test(code)?code:'INDEPENDENT_IMPORT_UNAVAILABLE'}}}
export async function independentAccess(){return result(async()=>{await independentOwner();return {source:await independentSource()}})}
export async function independentAuthorize(request:string,input:Parameters<typeof authorizeIndependent>[1]){return result(()=>authorizeIndependent(request,input))}
export async function independentValidate(csv:string){return result(()=>validateIndependent(csv))}
export async function independentImport(csv:string,ids:string[],reviewed:boolean){return result(()=>importIndependent(csv,ids,reviewed))}
export async function independentReview(){return result(independentPublication)}
export async function independentPublish(ids:string[],request:string,reviewed:boolean){return result(()=>publishIndependent(ids,request,reviewed))}
