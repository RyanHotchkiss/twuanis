'use server'
import {assertOwner} from '@/lib/administrative-control'
import {createServerSupabaseClient} from '@/lib/supabase-server'
const supported=new Set(['encuentra24-sale','encuentra24-rent'])
export async function scraperRead(){try{await assertOwner();const db=await createServerSupabaseClient();const {data,error}=await db.rpc('scraper_admin_read');return error?{ok:false as const}:{ok:true as const,data}}catch{return {ok:false as const}}}
export async function scraperRequest(requestId:string,scrapers:string[]){try{if(!/^[0-9a-f-]{36}$/i.test(requestId)||!Array.isArray(scrapers)||!scrapers.length||scrapers.length>2||scrapers.some(x=>!supported.has(x)))return{ok:false as const};await assertOwner();const db=await createServerSupabaseClient();const {data,error}=await db.rpc('scraper_admin_request',{p_request:requestId,p_scrapers:scrapers});return error?{ok:false as const}:{ok:true as const,data}}catch{return {ok:false as const}}}
