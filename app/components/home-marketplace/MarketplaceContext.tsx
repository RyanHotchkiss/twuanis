"use client"
import Link from 'next/link'
import {createContext, useContext, useState, useLayoutEffect, type Dispatch, type SetStateAction, type ReactNode} from 'react'
import {createPortal} from 'react-dom'
import SidebarArrowToggle from '../SidebarArrowToggle'
import styles from './home.module.css'
import {useSiteTheme} from '../theme/ThemeProvider'
export type MarketplaceFilters = Record<string, string | string[]>
export type HomeMarketplaceState = {
  filters: MarketplaceFilters
  setFilters: Dispatch<SetStateAction<MarketplaceFilters>>
  showNavigationLabels?: boolean
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
  language: 'en' | 'es'; mode: 'sale' | 'rent' | 'bank'; filters: MarketplaceFilters; count: number;
  loading: boolean; onFilters: () => void; children: ReactNode
}) {
  const es = language === 'es'
  const {theme} = useSiteTheme()
  const swipeLabel = es ? 'Deslizar Properties' : 'Swipe Properties'
  return <header className={styles.marketplaceActions} style={{display:'flex',gap:12,flexWrap:'wrap',alignItems:'center',marginBottom:20}}>
    <div style={{flex:'1 1 260px'}}>
      <p aria-live="polite" data-marketplace-count style={{margin:0}}>{loading ? (es ? 'Cargando propiedades…' : 'Loading listings…') : `${count.toLocaleString(es ? 'es-CR' : 'en-US')} ${mode === 'bank' ? (es ? 'Propiedades Bancarias y Remates' : 'Bank Properties & Remates') : mode === 'sale' ? (es ? 'Propiedades en Venta' : 'For Sale Listings') : (es ? 'Propiedades en Alquiler / Arrendamiento' : 'For Rent / For Lease Listings')}`}</p>
    </div>
    <button type="button" onClick={onFilters} style={{border:'2px solid var(--border)',borderRadius:999,padding:'12px 20px',background:'var(--surface)',color:'var(--foreground)',cursor:'pointer'}}>{es ? 'Filtros' : 'Filters'}</button>
    <Link href={es?'/es/deslizar':'/en/swipe'} aria-label={swipeLabel} data-home-swipe
      style={{border:'1px solid #ff3b00',borderRadius:999,padding:'12px 20px',background:theme==='dark'?'#ffffff':'#000000',color:'#ff3b00',cursor:'pointer',font:'inherit',fontWeight:'bold',textDecoration:'none'}}>
      <span data-swipe-text style={{opacity:1,transition:'opacity .2s ease'}}>{swipeLabel}</span>
    </Link>
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
  const [arrowHost,setArrowHost] = useState<HTMLElement|null>(null)
  const embedded = home !== null
  useLayoutEffect(() => {
    setArrowHost(embedded && isMobile ? document.getElementById('home-mobile-filter-arrow') : null)
  },[embedded,isMobile,open])
  if (!home) return children
  if (!isMobile) return <div className={styles.filterCategories} data-filter-theme={theme} style={{display:'contents'}}>{children}</div>
  return <>{createPortal(<div data-home-sidebar-layer className={styles.sidebarLayer} data-arrow-theme={theme} data-arrow-orientation={home.arrowOrientation} style={{position:'fixed',inset:0,zIndex:4000,pointerEvents:'none'}} onPointerDownCapture={home.interact} onKeyDownCapture={home.interact} onWheelCapture={home.interact}>
    <div className={styles.filterCategories} data-filter-theme={theme} style={{pointerEvents:'auto'}}>{children}</div>
    {open && <div style={{position:'fixed',left:'calc(85vw - 42px)',top:'50%',transform:'translateY(-50%)',pointerEvents:'auto',zIndex:10000}}>
      <SidebarArrowToggle collapsed={!open} label={open ? (language === 'es' ? 'Contraer filtros' : 'Collapse filters') : (language === 'es' ? 'Expandir filtros' : 'Expand filters')} onToggle={open ? onClose : onOpen}/>
    </div>}
  </div>, document.body)}
  {!open && arrowHost && createPortal(<SidebarArrowToggle collapsed label={language === 'es' ? 'Expandir filtros' : 'Expand filters'} onToggle={onOpen}/>, arrowHost)}</>
}
