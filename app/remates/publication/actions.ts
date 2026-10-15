'use server'
import {commandPublication,prepareInstitutionalCsv,readPublication,type PublicationCommand,type PublicationQuery} from '@/lib/remates/publication'
export async function publicationRead(q:PublicationQuery){try{return {ok:true as const,data:await readPublication(q)}}catch{return {ok:false as const}}}
export async function publicationCommand(request:string,c:PublicationCommand){try{return {ok:true as const,data:await commandPublication(request,c)}}catch{return {ok:false as const}}}
export async function publicationCsv(request:string,c:{institution:string;source:string;expected:string;reason:string},csv:string){try{return {ok:true as const,data:await prepareInstitutionalCsv(request,c,csv)}}catch{return {ok:false as const}}}
