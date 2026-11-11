'use server'
import {commandSaved,readSaved,readSavedWorkspace,type SavedCommand,type SavedQuery} from '@/lib/remates/saved'
export async function savedRemateCommand(request:string,c:SavedCommand){try{return {ok:true as const,data:await commandSaved(request,c)}}catch{return {ok:false as const}}}
export async function savedRemateRead(q:SavedQuery){try{return {ok:true as const,data:await readSaved(q)}}catch{return {ok:false as const}}}
export async function savedRemateWorkspace(institution?:string){try{return {ok:true as const,data:await readSavedWorkspace(institution)}}catch{return {ok:false as const}}}
