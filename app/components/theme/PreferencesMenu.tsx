'use client'
import {useLayoutEffect,useId,useRef,useState,type CSSProperties} from 'react'
import {createPortal} from 'react-dom'
import {supabase} from '@/lib/supabase'
import {Settings} from 'lucide-react'
import {useSiteTheme} from './ThemeProvider'
import type {SiteFont,SiteTheme,SiteBackground} from './theme-contract'
export default function PreferencesMenu({authenticated=false,languageUrls,language,iconSize,buttonStyle,labelStyle,showLabel,onMouseEnter,onMouseLeave}:{authenticated?:boolean;languageUrls:{en:string;es:string};language:'en'|'es';iconSize:number;buttonStyle:CSSProperties;labelStyle:CSSProperties;showLabel:boolean;onMouseEnter:()=>void;onMouseLeave:()=>void}){
 const {theme,setTheme,font,setFont,background,setBackground}=useSiteTheme(),es=language==='es',title=es?'Preferencias':'Preferences',id=useId()
 const [open,setOpen]=useState(false),[position,setPosition]=useState({top:0,left:0,maxHeight:400})
 const [signingOut,setSigningOut]=useState(false),[signoutError,setSignoutError]=useState('')
 const signoutLock=useRef(false)
 async function signout(){
  if(!authenticated||signoutLock.current)return
  signoutLock.current=true;setSigningOut(true);setSignoutError('')
  try{
   const {error}=await supabase.auth.signOut({scope:'global'})
   if(error)throw error
   window.location.replace(es?'/es':'/en')
  }catch{setSignoutError(es?'No se pudo cerrar la sesión. Inténtelo de nuevo.':'Sign out could not be confirmed. Please try again.')}
  finally{signoutLock.current=false;setSigningOut(false)}
 }
 const trigger=useRef<HTMLButtonElement>(null),panel=useRef<HTMLDivElement>(null)
 useLayoutEffect(()=>{
  if(!open)return
  const place=()=>{const rect=trigger.current?.getBoundingClientRect();if(!rect)return;const width=Math.min(288,window.innerWidth-24),top=rect.bottom+8;setPosition({top,left:Math.max(12,Math.min(rect.right-width,window.innerWidth-width-12)),maxHeight:Math.max(0,window.innerHeight-top-12)})}
  const outside=(event:PointerEvent)=>{const node=event.target as Node;if(!trigger.current?.contains(node)&&!panel.current?.contains(node))setOpen(false)}
  const escape=(event:KeyboardEvent)=>{if(event.key==='Escape'){event.preventDefault();setOpen(false);trigger.current?.focus()}}
  place();panel.current?.querySelector<HTMLInputElement>('input:checked')?.focus()
  document.addEventListener('pointerdown',outside);document.addEventListener('keydown',escape);window.addEventListener('resize',place);window.addEventListener('scroll',place,true)
  return()=>{document.removeEventListener('pointerdown',outside);document.removeEventListener('keydown',escape);window.removeEventListener('resize',place);window.removeEventListener('scroll',place,true)}
 },[open])
 return <><button data-tour-id="N10" ref={trigger} type="button" data-theme-control="true" aria-label={title} title={title} aria-haspopup="dialog" aria-expanded={open} aria-controls={open?id:undefined} onClick={()=>setOpen(value=>!value)} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave} style={buttonStyle}>
  <span className="topbar-theme-icon preferences-gear" aria-hidden="true"><Settings size={iconSize} strokeWidth={1.2}/></span>
  {showLabel&&<span className="topbar-desktop-label" style={labelStyle}>{title}</span>}
 </button>{open&&createPortal(<div ref={panel} id={id} className="site-preferences" role="dialog" aria-label={title} style={position}>
  <h2>{title}</h2>
  <fieldset className="preferences-language"><legend>{es?'Idioma':'Language'}</legend>{([{value:'en',label:'English'},{value:'es',label:'Español'}] as const).map(choice=><label key={choice.value}><input type="radio" name={id+'-language'} value={choice.value} checked={language===choice.value} onChange={()=>{if(language!==choice.value)window.location.assign(languageUrls[choice.value])}}/><span>{choice.label}</span></label>)}</fieldset>
  <fieldset><legend>{es?'Apariencia':'Appearance'}</legend><div className="preferences-appearance">{(['light','dark'] as SiteTheme[]).map(value=><label key={value}><input type="radio" name={id+'-appearance'} value={value} checked={theme===value} onChange={()=>setTheme(value)}/><span>{value==='light'?(es?'Claro':'Light'):(es?'Oscuro':'Dark')}</span></label>)}</div></fieldset>
  <fieldset><legend>{es?'Fuente':'Font'}</legend>{([{value:'original',en:'Original (Cinzel)',es:'Original (Cinzel)'},{value:'modern',en:'Modern (System Sans-serif)',es:'Moderna (Sans-serif del sistema)'},{value:'classic',en:'Classic (System Serif)',es:'Clásica (Serif del sistema)'}] as {value:SiteFont;en:string;es:string}[]).map(choice=><label key={choice.value}><input type="radio" name={id+'-font'} value={choice.value} checked={font===choice.value} onChange={()=>setFont(choice.value)}/><span data-preference-font={choice.value}>{es?choice.es:choice.en}</span></label>)}</fieldset>
  <fieldset><legend>{es?'Fondo':'Background'}</legend>{([{value:'topo',en:'Topography',es:'Topografía'},{value:'arch',en:'Architecture',es:'Arquitectura'},{value:'nat',en:'Nature',es:'Naturaleza'},{value:'none',en:'None',es:'Ninguno'}] as {value:SiteBackground;en:string;es:string}[]).map(choice=><label key={choice.value}><input type="radio" name={id+'-background'} value={choice.value} checked={background===choice.value} onChange={()=>setBackground(choice.value)}/><span>{es?choice.es:choice.en}</span></label>)}</fieldset>
  <button type="button" className="preferences-privacy" onClick={()=>{setOpen(false);window.dispatchEvent(new Event('tw-measurement-open'))}}>{es?'Privacidad':'Privacy'}</button>
  {authenticated&&<><button type="button" className="preferences-signout" disabled={signingOut} onClick={()=>void signout()}>{signingOut?(es?'Cerrando sesión…':'Signing out…'):(es?'Cerrar sesión':'Sign Out')}</button>{signoutError&&<p role="alert">{signoutError}</p>}</>}
 </div>,document.body)}</>
}
