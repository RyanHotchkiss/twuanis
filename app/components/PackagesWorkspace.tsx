'use client'
import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from 'react'
import {useSearchParams} from 'next/navigation'
import IntelligenceHubNavigator from './IntelligenceHubNavigator'
import SidebarArrowToggle from './SidebarArrowToggle'
import {AlgorithmExampleOverlayProvider} from './AlgorithmExampleOverlayContext'
import hub from './market-summary/workspace.module.css'
import './packages-workspace.css'

export default function PackagesWorkspace({language,intelligence,addOns,founding}:{language:'en'|'es';intelligence:ReactNode;addOns:ReactNode;founding:ReactNode}) {
  const search=useSearchParams(),tab=search.get('tab')
  const selected=tab==='addons'||tab==='founder'?tab:'packages'
  const [active,setActive]=useState(selected)
  const [sidebarCollapsed,setSidebarCollapsed]=useState(false)
  const priorSidebarState=useRef<boolean|null>(null)
  const sidebarId=useId()
  useEffect(()=>{setActive(selected)},[selected])
  const setExampleOpen=useCallback((open:boolean)=>{
    if(open){
      if(typeof window==='undefined'||!window.matchMedia('(min-width: 761px)').matches)return
      if(priorSidebarState.current===null)priorSidebarState.current=sidebarCollapsed
      setSidebarCollapsed(true)
      return
    }
    if(priorSidebarState.current!==null){
      setSidebarCollapsed(priorSidebarState.current)
      priorSidebarState.current=null
    }
  },[sidebarCollapsed])
  const es=language==='es'
  const tabs=[{id:'packages',label:es?'Paquetes de Algoritmos':'Algorithm Packages'},{id:'addons',label:es?'Complementos para anuncios':'Listing Add Ons'},{id:'founder',label:es?'Membresía de fundador':'Founding Membership'}]
  const base=es?'/es/inteligencia-de-mercado/paquetes':'/en/market-intelligence/packages'
  return <AlgorithmExampleOverlayProvider value={setExampleOpen}><div className={`packages-workspace ${hub.hub}`} data-collapsed={sidebarCollapsed}>
    <span className={hub.sidebarArrowPosition}><SidebarArrowToggle collapsed={sidebarCollapsed} label={sidebarCollapsed?(es?'Expandir secciones':'Expand sections'):(es?'Contraer secciones':'Collapse sections')} controls={sidebarId} onToggle={()=>setSidebarCollapsed(value=>!value)}/></span>
    <aside id={sidebarId} className={hub.sidebarRegion}>
      <IntelligenceHubNavigator tabs={tabs} activeTab={active} basePath={base} query="" language={language} presentation={{label:es?'Secciones de paquetes':'Package sections',mobileLabel:es?'Paquetes':'Packages',questions:{},hrefForTab:(tab)=>base+'?tab='+tab,onSelect:setActive}}/>
    </aside>
    <div className={hub.workspace}>
      <div hidden={active!=='packages'} className="packages-panel">{intelligence}</div>
      <div hidden={active!=='addons'} className="packages-panel">{addOns}</div>
      <div hidden={active!=='founder'} className="packages-panel">{founding}</div>
    </div>
  </div></AlgorithmExampleOverlayProvider>
}
