'use server'
import {readRematesAlerts} from '@/lib/remates/alerts'
export async function rematesAlertsRead(after?:string){try{return {ok:true as const,data:await readRematesAlerts(after)}}catch{return {ok:false as const}}}
