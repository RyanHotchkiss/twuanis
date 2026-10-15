import 'server-only'
import {createServerSupabaseClient} from '@/lib/supabase-server'
async function sourceRead(institution:string,source:string){
 if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(institution)||!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(source))throw Error('INVALID_REQUEST')
 const db=await createServerSupabaseClient();const {data:user,error:authError}=await db.auth.getUser();if(authError||!user.user)throw Error('AUTHORITY_DENIED');
 const {data,error}=await db.rpc('remate_adapter_source_read',{p_institution:institution,p_source:source});if(error||!data||data.id!==source||typeof data.revision!=='string'||typeof data.adapter_version!=='string'||typeof data.origin_host!=='string'||typeof data.enabled!=='boolean')throw Error('AUTHORITY_DENIED');return data
}
import {parseFixture,sourceUrl} from './core'
import {profiles,limits,adapterVersion,type AdapterId,type SourceFixture} from './contracts'
export async function previewAdapter(institution:string,source:string,expected:string,id:AdapterId,raw:string){
 if(typeof raw!=='string'||Buffer.byteLength(raw)>limits.totalBytes+8192||!Object.hasOwn(profiles,id)||typeof expected!=='string')throw Error('INVALID_REQUEST')
 const row=await sourceRead(institution,source);if(row.revision!==expected)throw Error('STALE_REVISION');
 if(row.origin_host!==profiles[id].host||row.adapter_version!==adapterVersion(id))throw Error('SOURCE_CONFIGURATION_MISMATCH')
 const fixture=JSON.parse(raw) as SourceFixture;for(const page of fixture.pages||[])sourceUrl(page.url,profiles[id]);const result=parseFixture(id,fixture);
 // No persistence. Revalidate live scope after expensive parsing; no cross-account result release.
 const fresh=await sourceRead(institution,source);
 if(fresh.revision!==expected||fresh.origin_host!==row.origin_host||fresh.adapter_version!==row.adapter_version)throw Error('AUTHORITY_DENIED')
 return result
}

/** Binary PDF preview uses the same live source authority as JSON review, before and after decoding. */
export async function authorizePdfSource(institution:string,source:string,expected:string,id:AdapterId){
 if(!['bp-catalog','bp-auctions'].includes(id)||!/^\d+$/.test(expected))throw Error('INVALID_REQUEST')
 const row=await sourceRead(institution,source);if(row.revision!==expected)throw Error('STALE_REVISION');if(row.origin_host!==profiles[id].host||row.adapter_version!==adapterVersion(id))throw Error('SOURCE_CONFIGURATION_MISMATCH');return row
}
export async function previewPdfAdapter(institution:string,source:string,expected:string,id:'bp-catalog'|'bp-auctions',bytes:Uint8Array,input:import('./pdf').PdfInput){
 const row=await authorizePdfSource(institution,source,expected,id);if(input.mechanism!==id)throw Error('INVALID_REQUEST')
 const {extractBankPdf}=await import('./pdf');const output=await extractBankPdf(bytes,input)
 const fresh=await authorizePdfSource(institution,source,expected,id);if(fresh.origin_host!==row.origin_host||fresh.adapter_version!==row.adapter_version)throw Error('AUTHORITY_DENIED');return output.result
}
