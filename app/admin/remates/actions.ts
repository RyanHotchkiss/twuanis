'use server'
import {readInstitutionRegistry,commandInstitutionRegistry,type RegistryQuery,type RegistryCommand} from '@/lib/remates/institutions'
export async function registryRead(query:RegistryQuery){try{return {ok:true as const,data:await readInstitutionRegistry(query)}}catch{return {ok:false as const}}}
export async function registryCommand(requestId:string,command:RegistryCommand){try{return {ok:true as const,data:await commandInstitutionRegistry(requestId,command)}}catch{return {ok:false as const}}}
