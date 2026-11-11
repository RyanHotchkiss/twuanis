'use client'
import {supportPath} from '@/lib/support/contract'

import Link from 'next/link'
import {usePathname,useSearchParams} from 'next/navigation'
import {useEffect,useState,useRef} from 'react'
import {ArrowUp,ChevronDown,ChevronUp,ChevronRight,Shield,Heart,ArrowLeftRight} from 'lucide-react'
import {supabase} from '@/lib/supabase'
import {safeAuthNext} from '@/lib/auth/return-context'
import {useAdminNavigation} from '@/lib/account-identity/admin-navigation-client'
import {useSiteTheme} from './theme/ThemeProvider'
import {useHomepageEntrance} from './HomepageEntrance'
import styles from './GlobalUtilityMenu.module.css'

function WhatsAppIcon(){return <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M20.5 11.5a8.5 8.5 0 0 1-12.8 7.3L3 20l1.3-4.5a8.5 8.5 0 1 1 16.2-4Z"/><path d="m8 7 2 3-1 1c1 2 2 3 4 3l1-1 3 2c-1 3-4 2-7 0S6 8 8 7Z"/></svg>}

export default function GlobalUtilityMenu(){
 const pathname=usePathname(),search=useSearchParams(),{theme}=useSiteTheme(),stage=useHomepageEntrance()
 const es=pathname==='/es'||pathname.startsWith('/es/')||pathname.startsWith('/soporte/')||search.get('lang')==='es'
 const locale=es?'es':'en',admin=useAdminNavigation()
 const introBefore=useRef<'expanded'|'compact'|'collapsed'|null>(null)
 const [showTop,setShowTop]=useState(false),[spanishTourUtilities,setSpanishTourUtilities]=useState(false)
 const progressiveHome=pathname==='/en'||pathname==='/es'
 useEffect(()=>{
  if(!progressiveHome||stage!=='complete'){setShowTop(false);return}
  let frame=0
  const update=()=>{const heading=document.querySelector('[data-all-properties]');setShowTop(!!heading&&window.scrollY>0&&heading.getBoundingClientRect().top<=window.innerHeight)}
  const schedule=()=>{window.cancelAnimationFrame(frame);frame=window.requestAnimationFrame(update)}
  update();window.addEventListener('scroll',schedule,{passive:true});window.addEventListener('resize',schedule)
  return()=>{window.cancelAnimationFrame(frame);window.removeEventListener('scroll',schedule);window.removeEventListener('resize',schedule)}
 },[progressiveHome,stage,pathname])
 const [menuState,setMenuState]=useState<'expanded'|'compact'|'collapsed'>('expanded')
 const automatic=useRef<number[]>([])
 const cancelAutomatic=()=>{automatic.current.forEach(id=>window.clearTimeout(id));automatic.current=[]}
 useEffect(()=>{
  cancelAutomatic()
  if(stage!=='complete')return
  setMenuState('expanded')
  automatic.current=[window.setTimeout(()=>setMenuState('compact'),1500),window.setTimeout(()=>setMenuState('collapsed'),3500)]
  return cancelAutomatic
 },[progressiveHome,stage,pathname])
 const [authenticated,setAuthenticated]=useState(false)
 useEffect(()=>{
  let alive=true,version=0
  const verify=()=>{const request=++version;void supabase.auth.getUser().then(({data,error})=>{if(alive&&request===version)setAuthenticated(!error&&!!data.user)}).catch(()=>{if(alive&&request===version)setAuthenticated(false)})}
  const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,session)=>{version++;setAuthenticated(false);if(session)queueMicrotask(verify)})
  verify();window.addEventListener('focus',verify)
  return()=>{alive=false;version++;subscription.unsubscribe();window.removeEventListener('focus',verify)}
 },[])
 useEffect(()=>{const reveal=(event:Event)=>{const detail=(event as CustomEvent).detail;setSpanishTourUtilities(es&&detail==='spanish-utilities');if(detail==='end'){if(introBefore.current!==null)setMenuState(introBefore.current);introBefore.current=null}else{cancelAutomatic();if(introBefore.current===null)introBefore.current=menuState;setMenuState('expanded')}};window.addEventListener('tw-intro-utilities',reveal);return()=>window.removeEventListener('tw-intro-utilities',reveal)},[menuState,es])
 if(stage!=='complete')return null
 const labels={top:es?'Volver arriba':'Back to top',home:es?'Inicio':'Home',support:es?'Ayuda por WhatsApp':'WhatsApp Support',admin:es?'Administración':'Admin',privacy:es?'Preferencias de privacidad':'Privacy Preferences'}
 const login='/login?'+new URLSearchParams({lang:locale,next:safeAuthNext(supportPath(locale),locale)})
 const marketplace=/^\/(en\/(buy|rent-lease|bank-properties)|es\/(comprar|alquilar-arrendar|remates)|remates)(\/|$)/.test(pathname)
 const listingMarketplace=/^\/(en(?:\/(?:buy|rent|rent-lease))?|es(?:\/(?:comprar|alquilar|alquilar-arrendar))?)\/?$/.test(pathname)
 const scrollTop=()=>window.scrollTo({top:0,behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'})
 // Presentation override only: preserve the underlying menu state and administrator authority.
 const visibleMenuState=spanishTourUtilities?'expanded':menuState
 const menuExpanded=visibleMenuState==='expanded'
 const label=(text:string)=><span className={styles.label} aria-hidden="true">{text}</span>
 return <>{progressiveHome&&(showTop||spanishTourUtilities)&&<button data-tour-id="U02" data-theme={theme} className={`${styles.control} ${styles.scrollTopControl}`} aria-label={labels.top} onClick={scrollTop}><ArrowUp aria-hidden="true"/></button>}<nav aria-label={es?'Utilidades':'Utilities'} className={styles.menu} data-expanded={menuExpanded} data-homepage={progressiveHome} data-progressive-menu data-menu-state={visibleMenuState} onPointerDownCapture={cancelAutomatic} onKeyDownCapture={cancelAutomatic} onFocusCapture={cancelAutomatic} data-theme={theme} data-marketplace={marketplace}>
  <button data-tour-id="U01" className={styles.toggle} aria-expanded={visibleMenuState!=='collapsed'} aria-controls="global-utility-controls" aria-label={visibleMenuState==='expanded'?(es?'Compactar menú':'Compact menu'):visibleMenuState==='compact'?(es?'Contraer menú':'Collapse menu'):(es?'Abrir menú':'Expand menu')} onClick={()=>{cancelAutomatic();setMenuState(value=>value==='expanded'?'compact':value==='compact'?'collapsed':'expanded')}}>{visibleMenuState==='expanded'?<ChevronRight size={18}/>:visibleMenuState==='compact'?<ChevronDown size={18}/>:<ChevronUp size={18}/>}</button>
  {visibleMenuState!=='collapsed'&&<div id="global-utility-controls" className={styles.controls}>
   {!progressiveHome&&<button data-tour-id="U02" className={styles.control} aria-label={labels.top} onClick={scrollTop}><ArrowUp aria-hidden="true"/>{label(labels.top)}</button>}
   <Link data-tour-id="U03" className={styles.control} href={es?'/es':'/en'} aria-label={labels.home}><img className={styles.logo} src={theme==='light'?'/images/black-20S-logo.svg':'/images/white-20s-logo.svg'} alt=""/>{label(labels.home)}</Link>
   <a data-tour-id="U04" className={styles.control} data-muted={!authenticated} aria-label={authenticated?labels.support:labels.support+(es?' — Iniciar sesión':' — Sign in')} href={authenticated?supportPath(locale):login}><WhatsAppIcon/>{label(labels.support)}</a>
   <Link className={`${styles.control} ${styles.mobileFavorite}`} href={es?'/es/favoritos':'/en/favorites'} aria-label={es?'Favoritos':'Favorites'}><Heart aria-hidden="true"/>{label(es?'Favoritos':'Favorites')}</Link>
   {listingMarketplace&&<Link className={styles.control} href={es?'/es/deslizar':'/en/swipe'} aria-label={es?'Deslizar propiedades':'Swipe Properties'}><ArrowLeftRight aria-hidden="true"/>{label(es?'Deslizar propiedades':'Swipe Properties')}</Link>}
   {admin&&<Link data-tour-id="U05" className={styles.control} href="/admin" aria-label={labels.admin}><Shield aria-hidden="true"/>{label(labels.admin)}</Link>}
  </div>}
 </nav></>
}
