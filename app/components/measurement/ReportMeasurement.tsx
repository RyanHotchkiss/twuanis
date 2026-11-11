'use client'
import {useEffect,useRef} from 'react'
import {context,once,state} from '@/lib/measurement/runtime'
export default function ReportMeasurement({id,locale}:{id:string;locale:'en'|'es'}){
 const ref=useRef<HTMLSpanElement>(null)
 useEffect(()=>{if(!/^[0-9a-f-]{36}$/i.test(id))return;const target=ref.current?.parentElement?.querySelector('h1,h2');if(!target)return;let visible=false,active=true
 const observe=()=>{if(!visible||document.visibilityState!=='visible'||state().consent!=='granted'||state().mode==='off')return;const epoch=state().epoch,page=state().page;void crypto.subtle.digest('SHA-256',new TextEncoder().encode('tw-ka09:report:'+id)).then(b=>{if(!active||epoch!==state().epoch||page!==state().page||state().consent!=='granted')return;const key='m'+Array.from(new Uint8Array(b),x=>x.toString(16).padStart(2,'0')).join('');once('tw_report_view',{...context(locale),report_measurement_key:key,view_kind:'report'},'report-view:'+key)}).catch(()=>{})}
 const io=new IntersectionObserver(es=>{visible=es.some(e=>e.isIntersecting&&e.intersectionRatio>=.5);observe()},{threshold:[0,.5]});io.observe(target);window.addEventListener('tw-measurement-consent',observe);document.addEventListener('visibilitychange',observe);return()=>{active=false;io.disconnect();window.removeEventListener('tw-measurement-consent',observe);document.removeEventListener('visibilitychange',observe)}
 },[id,locale]);return <span hidden ref={ref}/>
}
