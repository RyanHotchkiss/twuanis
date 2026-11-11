'use client'
import {useEffect,useRef} from 'react'
import {context,once,state} from '@/lib/measurement/runtime'
import {internalDiscovery} from '@/lib/measurement/attribution'
export function useListingMeasurement(id:string,locale:'en'|'es',market:'private'|'bank',kind:'exposure'|'view',target:'self'|'heading'='self',enabled=true){
 const ref=useRef<HTMLElement>(null)
 useEffect(()=>{if(!enabled)return;const node=target==='heading'?ref.current?.parentElement?.querySelector('h2'):ref.current;if(!node||!/^[a-zA-Z0-9_-]{1,100}$/.test(id))return;let timer:ReturnType<typeof setTimeout>|undefined,visible=false
 const clear=()=>{if(timer!==undefined)clearTimeout(timer);timer=undefined}
 const eligible=()=>visible&&document.visibilityState==='visible'&&document.hasFocus()&&state().consent==='granted'&&state().mode!=='off'
 const update=()=>{clear();if(!eligible())return;const epoch=state().epoch,page=state().page;timer=setTimeout(()=>{timer=undefined;if(!eligible()||state().epoch!==epoch||state().page!==page)return
 if(kind==='exposure')once('tw_listing_exposure',{...context(locale),listing_id:id,listing_market:market,context_digest:'unknown',placement_kind:'search_results'},'exposure:'+market+':'+id)
 else once('tw_listing_view',{...context(locale),listing_id:id,listing_market:market,context_digest:'unknown',internal_discovery:internalDiscovery()},'listing:'+market+':'+id)
 },kind==='exposure'?1000:0)}
 const observer=new IntersectionObserver(entries=>{visible=entries.some(e=>e.isIntersecting&&e.intersectionRatio>=0.5);update()},{threshold:[0,0.5]});observer.observe(node);document.addEventListener('visibilitychange',update);window.addEventListener('tw-measurement-consent',update);window.addEventListener('focus',update);window.addEventListener('blur',update)
 return()=>{clear();observer.disconnect();document.removeEventListener('visibilitychange',update);window.removeEventListener('tw-measurement-consent',update);window.removeEventListener('focus',update);window.removeEventListener('blur',update)}
 },[id,locale,market,kind,target,enabled]);return ref
}
