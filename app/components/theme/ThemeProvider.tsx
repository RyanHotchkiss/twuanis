'use client'
import {createContext,useContext,useEffect,useLayoutEffect,useState,type ReactNode,type Dispatch,type SetStateAction} from 'react'
import {THEME_KEY,themeCss,type SiteTheme} from './theme-contract'
const ThemeContext=createContext<{theme:SiteTheme;setTheme:Dispatch<SetStateAction<SiteTheme>>}|null>(null)
export function useSiteTheme(){const context=useContext(ThemeContext);if(!context)throw Error('ThemeProvider is required');return context}
export default function ThemeProvider({children}:{children:ReactNode}){
 const [theme,updateTheme]=useState<SiteTheme>('dark')
 function apply(value:SiteTheme){let style=document.getElementById('twuanis-preference-style');if(!style){style=document.createElement('style');style.id='twuanis-preference-style';document.head.appendChild(style)}style.textContent=themeCss(value);updateTheme(value)}
 useLayoutEffect(()=>{try{const saved=localStorage.getItem(THEME_KEY);apply(saved==='light'?'light':'dark')}catch{apply('dark')}},[])
 useEffect(()=>{const changed=(e:StorageEvent)=>{if(e.key===THEME_KEY)apply(e.newValue==='light'?'light':'dark')};window.addEventListener('storage',changed);return()=>window.removeEventListener('storage',changed)},[])
 const setTheme:Dispatch<SetStateAction<SiteTheme>>=value=>{const next=typeof value==='function'?value(theme):value;apply(next);try{localStorage.setItem(THEME_KEY,next)}catch{/* Session remains usable when persistence is unavailable. */}}
 return <ThemeContext.Provider value={{theme,setTheme}}>{children}</ThemeContext.Provider>
}
