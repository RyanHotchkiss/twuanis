'use client'
import {productAction} from '@/lib/measurement/journey-client'
import type {Catalog} from '@/lib/asking-price-contract'
import type {PopulationEngineRequest} from '@/lib/population-engine-execution'
import {hubUniverse,hubUniverseUrl,universeLabels} from '@/lib/hub-universe-contract'
import {HubUniverseProvider} from './HubUniverseContext'
import BankAnalyticalWorkspace from './BankAnalyticalWorkspace'
import {selectCapability,algorithmInterest} from '@/lib/measurement/analytical'
import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import {groupHubEngines,hubPackageInvitation,hubPackageActionLabel} from '@/lib/intelligence-hub-access-contract'
import Link from 'next/link'
import ExampleViewer from './engine-examples/ExampleViewer'
import {LockKeyhole} from 'lucide-react'
import {readHubPackageAccess} from '@/lib/intelligence-hub-access'
import type {HubPackageAccess,HubPopulation} from '@/lib/intelligence-hub-access-contract'
import {supabase} from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { hubEngineUrl,hubEngineIdentity } from './intelligence-hub-navigation'
import {weightedTitle} from '@/lib/weighted-price-contract'
import {ratioTitle} from '@/lib/asking-area-ratio-contract'
import {comparablesTitle} from '@/lib/comparables-hub-contract'
import {positionHubTitle} from '@/lib/position-hub-contract'
import {crossTitle} from './price-meter-cross-dimensional/contract'
import {cohortTitle} from './price-meter-comparison/contract'
import SidebarArrowToggle from './SidebarArrowToggle'
import IntelligenceHubNavigator from './IntelligenceHubNavigator'
import styles from './market-summary/workspace.module.css'

function overlayReferences(text:string){
 return text.split(/((?:Package|Paquete) #[123]|₡)/g).map((part,index)=>part==='₡'?<span key={index} className={styles.colonSymbol}>{part}</span>:/^(?:Package|Paquete) #[123]$/.test(part)?<span key={index} className={styles.packageColor} data-package-number={part.slice(-1)}>{part}</span>:part)
}

export default function IntelligenceHubShell({tabs,activeTab,query,basePath,language,embedded,children,preview,packageAccess,options,catalog}:{options?:any;catalog?:Catalog;preview?:ReactNode;packageAccess?:HubPackageAccess;tabs:readonly {id:string;label:string;disabled?:boolean}[];activeTab:string;query:string;basePath:string;language:'en'|'es';embedded:boolean;children:ReactNode}) {
 const [collapsed,setCollapsed]=useState(false),id=useId(),router=useRouter()
 const es=language==='es',population=hubUniverse(new URLSearchParams(query))
 const [switching,setSwitching]=useState(false)
 useEffect(()=>setSwitching(false),[query])
 const engines=groupHubEngines(tabs.filter(tab=>!tab.disabled && tab.id!=='valuation' && tab.id!=='pricing').flatMap(tab=>tab.id==='explorer'?[{...tab,label:es?'Resumen del mercado':'Market Summary'},{id:'composition',label:es?'Composición del mercado':'Market Composition'},{id:'asking-price',label:es?'Distribución de precios de oferta del mercado':'Market Asking Price Distribution'}]:tab.id==='price-meter'?[tab,{id:'geography',label:es?'Comparación geográfica del precio por m²':'Geographic Price / m² Comparison'},{id:'size',label:es?'Tamaño → Precio por m²':'Size → Price / m²'},{id:'construction-land',label:es?'Construcción/terreno → Precio por m²':'Construction-to-Land → Price / m²'},{id:'cohort-comparison',label:cohortTitle[language]},{id:'cross-dimensional',label:crossTitle[language]},{id:'discovery',label:language==='es'?'Descubrimiento comparativo de precio / m²':'Comparative Price / m² Discovery'},{id:'position',label:positionHubTitle[language]},{id:'comparables',label:comparablesTitle[language]},{id:'asking-area-ratio',label:ratioTitle[language]},{id:'weighted-price',label:weightedTitle[language]}]:[tab]),packageAccess?.packages)
 const question=new URLSearchParams(query).get('analysis_question')
 const activeEngine=hubEngineIdentity(activeTab,question)
 const bankEngine=({explorer:'summary','price-meter':'distribution',scarcity:'configuration','asking-price':'market-asking-price-distribution'} as Record<string,string>)[activeEngine]??activeEngine
 const bankTitle=engines.find(e=>e.id===activeEngine)?.label??activeEngine
 const validBank=!['valuation','pricing','buyer-demand'].includes(activeTab)
 const content=population==='BANK'?(validBank?<BankAnalyticalWorkspace engine={bankEngine as PopulationEngineRequest['engine']} title={bankTitle} language={language} catalog={catalog??{state:'unavailable'}} query={query}/>:<p>{es?'Selecciona un algoritmo del catálogo.':'Select a catalog algorithm.'}</p>):children
 const lock=!population?<p role="alert">{es?'La población de esta dirección es ambigua o incompatible. Selecciona Venta, Alquiler o Bancos para definir una nueva pregunta.':'This URL has an ambiguous or conflicting population. Select Sale, Rent or Bank to define a new question.'}</p>:switching?<p role="status">{es?'Cambiando población…':'Changing population…'}</p>:<HubUniverseProvider key={`${population}:${activeEngine}:${language}`} population={population}>{['valuation','pricing','buyer-demand'].includes(activeTab)&&population!=='BANK'?content:<HubWorkspaceLock key={`${population}:${activeEngine}`} population={population==='BANK'?'BANK':'PRIVATE'} engine={activeEngine} engineName={bankTitle} language={language} initial={packageAccess} preview={population==='BANK'?<p>{es?'Análisis independiente de bancos/remates.':'Independent Bank / Remates analysis.'}</p>:preview}>{content}</HubWorkspaceLock>}</HubUniverseProvider>
 if(embedded)return lock
 return <div className={styles.hub} data-collapsed={collapsed}>
  <span className={styles.sidebarArrowPosition}><SidebarArrowToggle collapsed={collapsed} label={collapsed?(es?'Expandir algoritmos':'Expand algorithms'):(es?'Contraer algoritmos':'Collapse algorithms')} controls={id} onToggle={()=>setCollapsed(v=>!v)}/></span>
  <div id={id} className={styles.sidebarRegion}><IntelligenceHubNavigator tabs={engines} activeTab={activeEngine} basePath={basePath} query={query} language={language} packages={packageAccess?.packages}/></div>
  <div className={styles.workspace}>
   <div className={styles.hubControls}>
    <label className={styles.selector}>{es?'Población':'Population'} <select aria-label={es?'Población analítica':'Analytical population'} value={population??''} onChange={e=>{productAction('population_'+e.target.value.toLowerCase(),'population');setSwitching(true);router.push(hubUniverseUrl(basePath,query,e.target.value as 'SALE'|'RENT'|'BANK'))}}>{!population&&<option value="" disabled>{es?'Seleccionar':'Select'}</option>}{(['SALE','RENT','BANK'] as const).map(p=><option key={p} value={p}>{universeLabels[language][p]}</option>)}</select></label>


    <label className={styles.selector}>{es?'Análisis':'Analysis'} <select aria-label={es?'Análisis':'Analysis'} value={activeEngine} onChange={e=>{selectCapability(e.target.value,language);router.push(hubEngineUrl(basePath,query,e.target.value))}}>{engines.map(engine=><option key={engine.id} value={engine.id} disabled={engine.disabled}>{engine.label}</option>)}</select></label>
   </div>
   {lock}
  </div>
 </div>
}

// One presentation boundary; execution authorization remains in every existing action.
function HubWorkspaceLock({engine,engineName,language,initial,preview,children,population='PRIVATE'}:{engine:string;engineName:string;language:'en'|'es';initial?:HubPackageAccess;preview?:ReactNode;children:ReactNode;population?:HubPopulation}){
 const [access,setAccess]=useState(initial),[seen,setSeen]=useState(initial?.checkedAt)
 const generation=useRef(0),current=useRef(access),content=useRef<HTMLDivElement>(null),height=useRef(0)
 if(initial?.checkedAt!==seen){setSeen(initial?.checkedAt);setAccess(initial)}
 current.current=access
 const valid=access?.engine===engine&&access.population===population
 const allowed=valid&&access.allowed
 const identity=`${engine}:${population}:${access?.accountId??'anonymous'}:${allowed?'authorized':'preview'}`
 useEffect(()=>{if(!content.current)return;const observer=new ResizeObserver(()=>{if(allowed&&content.current)height.current=content.current.getBoundingClientRect().height});observer.observe(content.current);return()=>observer.disconnect()},[allowed,identity])
 useEffect(()=>{
  let alive=true,timer:ReturnType<typeof setTimeout>|undefined
  async function refresh(hide=false){const ticket=++generation.current;if(hide)setAccess(undefined);try{const next=await readHubPackageAccess(engine,population);if(alive&&ticket===generation.current)setAccess(next)}catch{if(alive&&ticket===generation.current)setAccess(undefined)}}
  const resume=()=>{if(document.visibilityState==='visible'){clearTimeout(timer);timer=setTimeout(()=>void refresh(),0)}}
  if(!initial||initial.engine!==engine||initial.population!==population)void refresh()
  const subscription=supabase.auth.onAuthStateChange((_event,session)=>{if((session?.user.id??null)!==(current.current?.accountId??null))queueMicrotask(()=>void refresh(true))})
  window.addEventListener('focus',resume);window.addEventListener('pageshow',resume);window.addEventListener('popstate',resume);document.addEventListener('visibilitychange',resume)
  const interval=setInterval(()=>{if(document.visibilityState==='visible')void refresh()},30000)
  return()=>{alive=false;generation.current++;clearTimeout(timer);clearInterval(interval);subscription.data.subscription.unsubscribe();window.removeEventListener('focus',resume);window.removeEventListener('pageshow',resume);window.removeEventListener('popstate',resume);document.removeEventListener('visibilitychange',resume)}
 },[engine,population])
 useEffect(()=>{if(!allowed||!access?.expiresAt)return;const timer=setTimeout(()=>{const ticket=++generation.current;setAccess(undefined);void readHubPackageAccess(engine,population).then(next=>{if(ticket===generation.current)setAccess(next)}).catch(()=>{})},Math.min(2147483647,Math.max(0,access.expiresAt-Date.now())));return()=>clearTimeout(timer)},[access,allowed,engine,population])
 const invitation=hubPackageInvitation(valid?access:undefined,engineName,language)
 return <div className={styles.accessBoundary} data-hub-access={allowed?'authorized':'locked'}>
  <div ref={content} key={identity} className={styles.accessContent} inert={!allowed} aria-hidden={!allowed||undefined} style={{opacity:allowed?1:0.25,...!allowed&&height.current?{height:height.current,overflow:'hidden'}:{}}}>{allowed?children:preview}</div>
  {!allowed&&<div className={`${styles.accessOverlay} ${styles.packageColor}`} data-package-number={access?.packages[engine]}>
   <Link className={styles.accessPurchase} onClick={()=>algorithmInterest(engine,language,'locked_card_packages')} href={invitation.href} prefetch={false}>
   <LockKeyhole className={styles.accessLock} size={22} aria-hidden="true"/>
   <h2>{overlayReferences(invitation.heading)}{invitation.entry&&<> <span className={styles.packageColor} data-package-number={invitation.entry.number}>{invitation.entry.label}</span> - {overlayReferences(invitation.entry.name)}.</>}</h2>
   <p>{overlayReferences(invitation.prefix)}{invitation.offerPackage&&<> <span className={styles.packageColor} data-package-number={invitation.offerPackage.number}>{invitation.offerPackage.label}</span>{overlayReferences(invitation.suffix)}</>}.</p>
   </Link>
   <div className={styles.accessActions}>
    <ExampleViewer engine={engine} engineName={engineName} language={language} compactLabel/>
    <Link className={styles.accessPackageButton} onClick={()=>algorithmInterest(engine,language,'view_package')} href={invitation.href} prefetch={false}>{hubPackageActionLabel(valid?access:undefined,engine,language)}</Link>
   </div>
  </div>}
 </div>
}
