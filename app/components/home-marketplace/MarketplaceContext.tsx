"use client"
import {createContext, useContext, useState, type Dispatch, type SetStateAction, type ReactNode} from 'react'
export type MarketplaceFilters = Record<string, string | string[]>
export type HomeMarketplaceState = {
  filters: MarketplaceFilters
  setFilters: Dispatch<SetStateAction<MarketplaceFilters>>
  orienting: boolean
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
export function MarketplaceContextHeading({language, mode, filters, count, loading, onFilters, children}: {
  language: 'en' | 'es'; mode: 'sale' | 'rent'; filters: MarketplaceFilters; count: number;
  loading: boolean; onFilters: () => void; children: ReactNode
}) {
  const es = language === 'es'
  const transaction = mode === 'sale' ? (es ? 'EN VENTA' : 'FOR SALE') : (es ? 'EN ALQUILER / ARRENDAMIENTO' : 'FOR RENT / LEASE')
  const geography = [filters.district, filters.canton, filters.province].filter(Boolean).join(' / ') || 'Costa Rica'
  return <header style={{display:'flex',gap:12,flexWrap:'wrap',alignItems:'center',marginBottom:20}}>
    <div style={{flex:'1 1 260px'}}>
      <h2 style={{margin:'0 0 8px',fontSize:'1.1rem'}}>{transaction} → {geography}</h2>
      <p aria-live="polite" data-marketplace-count style={{margin:0}}>{loading ? (es ? 'Cargando propiedades…' : 'Loading listings…') : `${count.toLocaleString(es ? 'es-CR' : 'en-US')} ${mode === 'sale' ? (es ? 'Propiedades en Venta' : 'Sale Listings') : (es ? 'Propiedades en Alquiler' : 'Rental Listings')}`}</p>
    </div>
    <button type="button" onClick={onFilters} style={{border:'1px solid var(--border)',borderRadius:999,padding:'12px 20px',background:'var(--surface)',color:'var(--foreground)',cursor:'pointer'}}>{es ? 'Filtros' : 'Filters'}</button>
    {children}
  </header>
}
