'use server'
import {readRematesOperationsAccess,readRematesOperations,commandRematesOperations} from '@/lib/remates/operations'
import type {OperationsQuery,OperationsCommand} from '@/lib/remates/operations-types'
export async function operationsAccess(){try{return {ok:true as const,data:await readRematesOperationsAccess()}}catch{return {ok:false as const}}}
export async function operationsRead(q:OperationsQuery){try{return {ok:true as const,data:await readRematesOperations(q)}}catch{return {ok:false as const}}}
export async function operationsCommand(request:string,c:OperationsCommand){try{return {ok:true as const,data:await commandRematesOperations(request,c)}}catch{return {ok:false as const}}}
