'use client'
import {createContext,useContext,type ReactNode} from 'react'
import type {AnalyticalUniverse} from '@/lib/analytical-universe'
const Context=createContext<AnalyticalUniverse|null>(null)
export function HubUniverseProvider({population,children}:{population:AnalyticalUniverse|null;children:ReactNode}){return <Context.Provider value={population}>{children}</Context.Provider>}
export const useHubUniverse=()=>useContext(Context)
export function priceMeaning(population:AnalyticalUniverse|null,language:'en'|'es',transaction?:string){return population==='BANK'?(language==='es'?'Precio de venta publicado por la institución (venta directa verificada)':'Institution-listed selling price (verified direct sale)'):transaction==='rent'?(language==='es'?'Precio de oferta mensual de alquiler':'Monthly rental asking price'):(language==='es'?'Precio de oferta de venta':'Sale asking price')}
