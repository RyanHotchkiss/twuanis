'use server'
import {createServerSupabaseClient} from '@/lib/supabase-server'
import type {PublicResult,PublicFacets,ReadResult} from '@/lib/remates/public-types'
const allowed=new Set(['id','sort','page','province','canton','district','property_type','institution','mechanism','status','currency','financial_kind','price_min','price_max','area_min','area_max','page_size','filters','fx'])
import {safeBankItem} from '@/lib/remates/public-validation'
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const nullable=(x:unknown)=>x===null||typeof x==='string'
function safeResponse(mode:string,data:any,maxItems=20):boolean{
 if(!data||typeof data.enabled!=='boolean'||JSON.stringify(data).length>262144*Math.ceil(maxItems/20))return false;
 if(mode==='facets')return Object.keys(data).every(k=>['enabled','facets'].includes(k))&&data.facets&&Object.keys(data.facets).every(k=>['institutions','terms'].includes(k))&&Array.isArray(data.facets.institutions)&&data.facets.institutions.length<=100&&data.facets.institutions.every((i:any)=>Object.keys(i).every(k=>['id','name'].includes(k))&&uuid.test(i.id)&&typeof i.name==='string')&&Array.isArray(data.facets.terms)&&data.facets.terms.length<=1000&&data.facets.terms.every((t:any)=>Object.keys(t).every(k=>['id','type','parent','en','es'].includes(k))&&typeof t.id==='string'&&/^\d+$/.test(t.id)&&['province','canton','district','property_type'].includes(t.type)&&nullable(t.parent)&&typeof t.en==='string'&&typeof t.es==='string');
 return Object.keys(data).every(k=>['enabled','count','page','items'].includes(k))&&Number.isSafeInteger(data.count)&&data.count>=0&&Number.isSafeInteger(data.page)&&data.page>=0&&data.page<=9999&&Array.isArray(data.items)&&data.items.length<=(mode==='detail'?1:maxItems)&&new Set(data.items.map((x:any)=>x.id)).size===data.items.length&&data.items.every(safeBankItem)
}
async function read<T>(mode:string,query:Record<string,string>):Promise<ReadResult<T>>{
 try{if(Object.keys(query).some(k=>!allowed.has(k))||Object.entries(query).some(([k,v])=>typeof v!=='string'||v.length>(k==='filters'?2000:256)))return {ok:false};const db=await createServerSupabaseClient();const {data,error}=await db.rpc('remate_public_read',{p_query:{...query,mode}});if(error||!safeResponse(mode,data,query.page_size?Number(query.page_size):20))return {ok:false};return {ok:true,data:data as T}}catch{return {ok:false}}
}
export async function readBankProperties(query:Record<string,string>={}):Promise<ReadResult<PublicResult>>{return read('list',query)}
export async function readBankProperty(id:string):Promise<ReadResult<PublicResult>>{return read('detail',{id})}
export async function readBankFacets():Promise<ReadResult<PublicFacets>>{return read('facets',{})}
