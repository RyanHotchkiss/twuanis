'use client'
import {useEffect,useRef,useState} from 'react'
import {usePathname} from 'next/navigation'
import {campaignRoute,type CampaignItem} from '@/lib/campaign-contract'
import './campaigns.css'
// One surface request per navigation, at most three delivered items. No polling or card requests.
export default function CampaignPlacements(){
 const path=usePathname(),[items,setItems]=useState<CampaignItem[]>([])
 const queue=useRef<{token:string;kind:string}[]>([]),sent=useRef(new Set<string>())
 function flush(){const events=queue.current.splice(0,6);if(events.length)void fetch('/api/campaigns',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({operation:'events',events}),keepalive:true}).catch(()=>{})}
 function record(token:string,kind:string){const key=token+kind;if(sent.current.has(key))return;sent.current.add(key);queue.current.push({token,kind});if(kind!=='impression'||queue.current.length>=3)flush()}
 useEffect(()=>{sent.current.clear();setItems([]);const context=campaignRoute(path);if(!context)return;const abort=new AbortController();void fetch('/api/campaigns',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({operation:'resolve',path}),signal:abort.signal}).then(r=>r.json()).then(r=>{if(!abort.signal.aborted&&Array.isArray(r.items)&&r.items.length<=3)setItems(r.items)}).catch(()=>{});return()=>{abort.abort();flush()}},[path])
 useEffect(()=>{if(!items.length)return;const timer=setTimeout(flush,1500);const leave=()=>flush();window.addEventListener('pagehide',leave);return()=>{clearTimeout(timer);flush();window.removeEventListener('pagehide',leave)}},[items])
 return <aside className="campaign-placements" aria-label={path.startsWith('/es')?'Campañas de Twuanis':'Twuanis campaigns'}>{items.map(item=><CampaignCard key={item.token} item={item} es={path.startsWith('/es')} onEvent={record} dismiss={()=>{record(item.token,'dismiss');setItems(rows=>rows.filter(x=>x.token!==item.token))}}/>)}</aside>
}
function CampaignCard({item,es,onEvent,dismiss}:{item:CampaignItem;es:boolean;onEvent:(token:string,kind:string)=>void;dismiss:()=>void}){
 const ref=useRef<HTMLElement>(null)
 useEffect(()=>{const observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting&&e.intersectionRatio>=0.5)){onEvent(item.token,'impression');observer.disconnect()}},{threshold:0.5});if(ref.current)observer.observe(ref.current);return()=>observer.disconnect()},[item.token])
 return <section ref={ref} className={`campaign-card ${item.surface==='popup'?'campaign-popup':''}`} aria-label={item.headline} onKeyDown={e=>{if(item.surface==='popup'&&e.key==='Escape')dismiss()}}>
 <span>{es?'Campaña de Twuanis':'Twuanis campaign'}</span>{item.surface==='popup'&&<button className="campaign-dismiss" onClick={dismiss} aria-label={es?'Cerrar campaña':'Dismiss campaign'}>×</button>}
 <h2>{item.headline}</h2><p>{item.copy}</p>
 {item.image&&<img src={item.image} alt={item.alt} loading="lazy"/>}
 {item.video&&<video controls preload="none" aria-label={item.alt} src={item.video}><a href={item.video}>{item.alt}</a></video>}
 <a href={item.destination} onClick={()=>{onEvent(item.token,'impression');onEvent(item.token,'click')}}>{item.cta}</a>
 <small>{es?'Información comercial: consulte los términos y precios vigentes. La compra no está disponible.':'Commercial information: see current terms and prices. Acquisition is unavailable.'}</small>
 </section>
}
