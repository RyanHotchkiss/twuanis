'use client'
import {useEffect,useRef,useState} from 'react'
import {context,emit,state} from '@/lib/measurement/runtime'
export function useSearchMeasurement(filters:Record<string,unknown>,count:number,loading:boolean,locale:'en'|'es',transaction:'sale'|'rent',market:'private'|'bank',surface:'marketplace'|'home'|'bank'){
 const previous=useRef<Record<string,unknown>|null>(null),version=useRef(0),lastSearch=useRef<{signature:string;logical_id:string}|null>(null);const [epoch,setEpoch]=useState('')
 useEffect(()=>{const sync=()=>{previous.current=null;lastSearch.current=null;setEpoch(state().epoch)};window.addEventListener('tw-measurement-consent',sync);return()=>window.removeEventListener('tw-measurement-consent',sync)},[])
 const serialized=JSON.stringify(filters)
 useEffect(()=>{const exit=()=>{const previous=lastSearch.current;if(previous&&!previous.signature.startsWith(serialized+':'))emit('tw_search_exit',{...context(locale),logical_id:previous.logical_id,reason:'dirty_state_exit',observation_scope:'pagehide'},previous.logical_id+':dirty-exit')};window.addEventListener('pagehide',exit);return()=>window.removeEventListener('pagehide',exit)},[serialized,locale])
 useEffect(()=>{if(loading||state().consent!=='granted'||state().mode==='off')return;const current=++version.current,eligibleEpoch=state().epoch;const timer=setTimeout(()=>{void(async()=>{
 const {encodeSearch}=await import('@/lib/measurement/search');const profile=transaction==='sale'?(locale==='en'?'BuySidebar':'BuySidebarES'):(locale==='en'?'RentLeaseSidebar':'RentLeaseSidebarES');const encoded=await encodeSearch(filters,profile);if(!encoded||version.current!==current||state().epoch!==eligibleEpoch||state().consent!=='granted')return
 const signature=serialized+':'+encoded.cfg;if(lastSearch.current?.signature===signature){emit('tw_search_result',{...context(locale),logical_id:lastSearch.current.logical_id,result_version:String(current),result_status:'settled',count_kind:'filtered_local_total',result_count:count},lastSearch.current.logical_id+':result:'+current);return}
 const before=previous.current;previous.current=JSON.parse(serialized);let reason:'initial_load'|'refinement'|'reset'|'removed'=before?'refinement':'initial_load';if(before){const chosen=(x:unknown)=>Array.isArray(x)?x.length:x!==''&&x!=null;if(Object.values(filters).every(v=>!chosen(v)))reason='reset';else if(Object.keys(filters).some(k=>chosen(before[k])&&!chosen(filters[k])))reason='removed'}
 const logical_id='q'+crypto.randomUUID().replaceAll('-','');const key=encoded.digest+':'+current
 const commit=emit('tw_search_commit',{...context(locale),logical_id,state_digest:encoded.digest,reason,transaction,count_kind:'filtered_local_total',listing_market:market,surface,expected_state_scopes:1,source_coverage:encoded.coverage},key+':commit')
 if(!commit)return
 lastSearch.current={signature,logical_id}
 emit('tw_search_part',{...encoded.facets,logical_id,cfg:encoded.cfg} as any,key+':state')
 emit('tw_search_result',{...context(locale),logical_id,result_version:String(current),result_status:'settled',count_kind:'filtered_local_total',result_count:count},key+':result')
 })().catch(()=>{})},500);return()=>{version.current++;clearTimeout(timer)}
 },[serialized,count,loading,locale,transaction,market,surface,epoch])
}
