'use client'
import PromotionRevealLink from './PromotionRevealLink'
import controlsStyle from '../home-carousel-controls.module.css'
import {HOMEPAGE_ROTATION_MS} from '@/lib/homepage-presentation-timing'
import styles from './AddonHomepageCarousel.module.css'
import StableCarouselFrame from './StableCarouselFrame'
import {useEffect,useRef,useState,type ReactNode} from 'react'
import {usePlacementRotation} from './usePlacementRotation'
import Link from 'next/link'
import {Pause,Play} from 'lucide-react'
import {spotlightWhatsAppLink} from '@/lib/spotlight-contact'
import {useSiteTheme} from '../theme/ThemeProvider'
import {listingHref} from '@/lib/listing-route'
import type {AddonHomepageItem} from '@/lib/addon-homepage-contract'
export default function AddonHomepageCarousel({items,language,children,demonstration=false,homepage=false}:{items:AddonHomepageItem[];language:'en'|'es';demonstration?:boolean;homepage?:boolean;children?:(item:AddonHomepageItem,contactHref?:string)=>ReactNode}){
 const {theme}=useSiteTheme()
 const [paused,setPaused]=useState(false)
 const [interacting,setInteracting]=useState(false)
 const focused=useRef(false),pointer=useRef(false),scrollTimer=useRef<ReturnType<typeof setTimeout>|null>(null)
 const [contacts,setContacts]=useState<Record<string,unknown>>({})
 const contactKey=JSON.stringify([...new Set(items.map(item=>item.id))].slice(0,5).sort())
 useEffect(()=>{const controller=new AbortController();const ids=JSON.parse(contactKey)as string[]
  void Promise.all(ids.filter(id=>/^[0-9a-f-]{36}$/i.test(id)).map(async id=>{
   try{const response=await fetch('/api/public-listing-contact?listingId='+encodeURIComponent(id),{cache:'no-store',signal:controller.signal});return [id,response.ok?(await response.json()).whatsapp:null]as const}catch{return [id,null]as const}
  })).then(entries=>{if(!controller.signal.aborted)setContacts(Object.fromEntries(entries))})
  return()=>controller.abort()
 },[contactKey])
 useEffect(()=>{const release=()=>{if(!pointer.current)return;pointer.current=false;if(!focused.current&&!scrollTimer.current)setInteracting(false)};window.addEventListener('pointerup',release);window.addEventListener('pointercancel',release);return()=>{window.removeEventListener('pointerup',release);window.removeEventListener('pointercancel',release);if(scrollTimer.current)clearTimeout(scrollTimer.current)}},[])
 const details=(target:EventTarget|null)=>target instanceof Element&&!!target.closest('[data-spotlight-details]')
 const scrollDetails=()=>{setInteracting(true);if(scrollTimer.current)clearTimeout(scrollTimer.current);scrollTimer.current=setTimeout(()=>{scrollTimer.current=null;if(!focused.current&&!pointer.current)setInteracting(false)},800)}
 const [index,setIndex]=usePlacementRotation(items.length,homepage?HOMEPAGE_ROTATION_MS:5000,paused||interacting)
 if(!items.length)return null
 const es=language==='es'
 return <section className={styles.spotlight} data-language={language} data-theme={theme} data-homepage-exposure data-placement-kind={items[index%items.length]?.demonstration?'demonstration':demonstration?'demonstration':'paid'} aria-label={es?'Exposición en la página de inicio':'Homepage Exposure'} style={{width:'100%',minWidth:0,marginBottom:28}}>
  <div className={styles.heading} style={{display:'flex',gap:12,alignItems:'center',justifyContent:'space-between',padding:'12px 1.25rem 0',boxSizing:'border-box',marginBottom:12,color:theme==='light'?'#000000':'var(--foreground)'}}>
   <h2 style={{margin:0,minWidth:0,maxWidth:'60%',fontSize:'clamp(14px, 2vw, 20px)'}}>{es?'Propiedades en el foco de Twuanis':'Twuanis Spotlight Properties'}</h2>
   <PromotionRevealLink data-spotlight-promotion className={`listing-advertising-action ${styles.promotion}`} href={es?'/es/inteligencia-de-mercado/paquetes?tab=addons':'/en/market-intelligence/packages?tab=addons'} style={{marginLeft:'auto',maxWidth:'40%',textAlign:'center',background:theme==='dark'?'#000000':'#ffffff',color:'inherit',fontSize:'clamp(12px, 1.4vw, 16px)'}}>{es?'Destaque su propiedad':'Spotlight Your Property'}</PromotionRevealLink>
  </div>
   {items.length>1&&<div className={styles.controls} style={{display:'flex',alignItems:'center',gap:12,flexWrap:'wrap',justifyContent:homepage?'center':undefined,marginBottom:12}}>
    <button type="button" className={homepage?`${controlsStyle.control} ${controlsStyle.thin} ${controlsStyle.chevron}`:undefined} data-control-theme={theme} aria-label={es?'Anterior':'Previous'} onClick={()=>setIndex(i=>(i-1+items.length)%items.length)}>{homepage?<span aria-hidden="true">‹</span>:'←'}</button>
    <span className={styles.counter}>{index%items.length+1} / {items.length}</span>
    <button type="button" className={homepage?`${controlsStyle.control} ${controlsStyle.thin} ${controlsStyle.pauseControl}`:undefined} data-control-theme={theme} aria-label={paused?(es?'Reanudar rotación':'Resume rotation'):(es?'Pausar rotación':'Pause rotation')} aria-pressed={paused} onClick={()=>setPaused(p=>!p)} style={homepage?undefined:{display:'inline-flex',alignItems:'center',justifyContent:'center',width:32,height:32,padding:0}}>{paused?<Play size={16} aria-hidden="true"/>:<span aria-hidden="true"><Pause size={16} strokeWidth={1} className={controlsStyle.pauseGlyph}/></span>}</button>
    <button type="button" className={homepage?`${controlsStyle.control} ${controlsStyle.thin} ${controlsStyle.chevron}`:undefined} data-control-theme={theme} aria-label={es?'Siguiente':'Next'} onClick={()=>setIndex(i=>(i+1)%items.length)}>{homepage?<span aria-hidden="true">›</span>:'→'}</button>
   </div>}
  <div className={styles.frame} onPointerDownCapture={event=>{if(details(event.target)){pointer.current=true;setInteracting(true)}}} onFocusCapture={event=>{if(details(event.target)){focused.current=true;setInteracting(true)}}} onBlurCapture={event=>{if(!details(event.relatedTarget)){focused.current=false;setInteracting(pointer.current||!!scrollTimer.current)}}} onScrollCapture={event=>{if(details(event.target))scrollDetails()}}>
   <StableCarouselFrame active={index%items.length} slides={items.map(slide=>({id:slide.id,content:children?children(slide,spotlightWhatsAppLink(contacts[slide.id],slide.id,slide.transaction,language)):<Link prefetch={false} href={listingHref(slide.id,slide.transaction,language)}>{slide.title}</Link>}))}/>
  </div>
 </section>
}
