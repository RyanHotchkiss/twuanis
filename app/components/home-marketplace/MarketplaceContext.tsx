"use client"
import {createContext, useContext, useState, useLayoutEffect, type Dispatch, type SetStateAction, type ReactNode} from 'react'
import {createPortal} from 'react-dom'
import SidebarArrowToggle from '../SidebarArrowToggle'
import styles from './home.module.css'
import {useSiteTheme} from '../theme/ThemeProvider'
export type MarketplaceFilters = Record<string, string | string[]>
export type HomeMarketplaceState = {
  filters: MarketplaceFilters
  setFilters: Dispatch<SetStateAction<MarketplaceFilters>>
  orienting: boolean
  arrowOrientation?: 'idle'|'collapse'|'expand'
  interact: () => void
}
export const MarketplaceContext = createContext<HomeMarketplaceState | null>(null)
export const useHomeMarketplace = () => useContext(MarketplaceContext)
// The two price dimensions are transaction-specific. All other fields have identical
// semantics in each language's existing Sale and Rent sidebars.
export function sharedMarketplaceFilters(filters: MarketplaceFilters): MarketplaceFilters {
  const {price_range, monthly_price, ...shared} = filters
  return shared
}
export function useMarketplaceFilters<T extends MarketplaceFilters>(defaults: T): [T, Dispatch<SetStateAction<T>>] {
  const home = useHomeMarketplace()
  const local = useState(defaults)
  if (!home) return local
  const current = {...defaults, ...home.filters} as T
  return [current, action => home.setFilters(previous => {
    const value = {...defaults, ...previous} as T
    return typeof action === 'function' ? action(value) : action
  })]
}
export function MarketplaceContextHeading({language, mode, count, loading, onFilters, children}: {
  language: 'en' | 'es'; mode: 'sale' | 'rent'; filters: MarketplaceFilters; count: number;
  loading: boolean; onFilters: () => void; children: ReactNode
}) {
  const es = language === 'es'
  return <header style={{display:'flex',gap:12,flexWrap:'wrap',alignItems:'center',marginBottom:20}}>
    <div style={{flex:'1 1 260px'}}>
      <p aria-live="polite" data-marketplace-count style={{margin:0}}>{loading ? (es ? 'Cargando propiedades…' : 'Loading listings…') : `${count.toLocaleString(es ? 'es-CR' : 'en-US')} ${mode === 'sale' ? (es ? 'Propiedades en Venta' : 'For Sale Listings') : (es ? 'Propiedades en Alquiler / Arrendamiento' : 'For Rent / For Lease Listings')}`}</p>
    </div>
    <button type="button" onClick={onFilters} style={{border:'1px solid var(--border)',borderRadius:999,padding:'12px 20px',background:'var(--surface)',color:'var(--foreground)',cursor:'pointer'}}>{es ? 'Filtros' : 'Filters'}</button>
    {children}
  </header>
}

// Lift only the embedded mobile sidebar out of marketplace stacking contexts.
// The existing sidebar owns all drawer/filter behavior.
export function HomeSidebarLayer({isMobile, open, onOpen, onClose, language, children}: {
  isMobile: boolean; open: boolean; onOpen: () => void; onClose: () => void; language: 'en' | 'es'; children: ReactNode
}) {
  const home = useHomeMarketplace()
  const {theme} = useSiteTheme()
  const [expandTop,setExpandTop] = useState(0)
  const embedded = home !== null
  useLayoutEffect(() => {
    if (!embedded || !isMobile || open) return
    const position = () => setExpandTop(window.innerHeight * .5)
    position()
    window.addEventListener('resize',position)
    return () => {window.removeEventListener('resize',position)}
  },[embedded,isMobile,open])
  if (!home || !isMobile) return children
  return createPortal(<div data-home-sidebar-layer className={styles.sidebarLayer} data-arrow-theme={theme} data-arrow-orientation={home.arrowOrientation} style={{position:'fixed',inset:0,zIndex:4000,pointerEvents:'none'}} onPointerDownCapture={home.interact} onKeyDownCapture={home.interact} onWheelCapture={home.interact}>
    <div style={{pointerEvents:'auto'}}>{children}</div>
    {<div style={{position:'fixed',left:open?'calc(85vw - 42px)':0,top:open?'50%':expandTop,transform:'translateY(-50%)',pointerEvents:'auto',zIndex:10000}}>
      <SidebarArrowToggle collapsed={!open} label={open ? (language === 'es' ? 'Contraer filtros' : 'Collapse filters') : (language === 'es' ? 'Expandir filtros' : 'Expand filters')} onToggle={open ? onClose : onOpen}/>
    </div>}
  </div>, document.body)
}
