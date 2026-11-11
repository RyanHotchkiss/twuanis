'use client'
import {createContext,useContext,useEffect,useLayoutEffect,useRef,useState,type ReactNode,type Dispatch,type SetStateAction} from 'react'
import {THEME_KEY,FONT_KEY,BACKGROUND_KEY,themeCss,validFont,validBackground,type SiteTheme,type SiteFont,type SiteBackground} from './theme-contract'
const ThemeContext=createContext<{theme:SiteTheme;setTheme:Dispatch<SetStateAction<SiteTheme>>;font:SiteFont;setFont:(font:SiteFont)=>void;background:SiteBackground;setBackground:(background:SiteBackground)=>void}|null>(null)
export function useSiteTheme(){const context=useContext(ThemeContext);if(!context)throw Error('ThemeProvider is required');return context}
export default function ThemeProvider({children}:{children:ReactNode}){
 const [theme,updateTheme]=useState<SiteTheme>('dark'),[font,updateFont]=useState<SiteFont>('modern'),[background,updateBackground]=useState<SiteBackground>('nat')
 const current=useRef({theme:'dark' as SiteTheme,font:'modern' as SiteFont,background:'nat' as SiteBackground})
 function apply(theme:SiteTheme,font:SiteFont,background:SiteBackground){let style=document.getElementById('twuanis-preference-style');if(!style){style=document.createElement('style');style.id='twuanis-preference-style';document.head.appendChild(style)}style.textContent=themeCss(theme,font,background);current.current={theme,font,background};updateTheme(theme);updateFont(font);updateBackground(background)}
 useLayoutEffect(()=>{try{apply(localStorage.getItem(THEME_KEY)==='light'?'light':'dark',validFont(localStorage.getItem(FONT_KEY)),validBackground(localStorage.getItem(BACKGROUND_KEY)))}catch{apply('dark','modern','nat')}},[])
 useEffect(()=>{const changed=(e:StorageEvent)=>{if(e.key===THEME_KEY)apply(e.newValue==='light'?'light':'dark',current.current.font,current.current.background);if(e.key===FONT_KEY)apply(current.current.theme,validFont(e.newValue),current.current.background);if(e.key===BACKGROUND_KEY)apply(current.current.theme,current.current.font,validBackground(e.newValue));if(e.key===null)apply('dark','modern','nat')};window.addEventListener('storage',changed);return()=>window.removeEventListener('storage',changed)},[])
 const setTheme:Dispatch<SetStateAction<SiteTheme>>=value=>{const next=typeof value==='function'?value(current.current.theme):value;apply(next,current.current.font,current.current.background);try{localStorage.setItem(THEME_KEY,next)}catch{/* Preference still applies when storage is unavailable. */}}
 const setFont=(value:SiteFont)=>{const next=validFont(value);apply(current.current.theme,next,current.current.background);try{localStorage.setItem(FONT_KEY,next)}catch{/* Preference still applies when storage is unavailable. */}}
 const setBackground=(value:SiteBackground)=>{const next=validBackground(value);apply(current.current.theme,current.current.font,next);try{localStorage.setItem(BACKGROUND_KEY,next)}catch{/* Preference remains usable when storage is unavailable. */}}
 return <ThemeContext.Provider value={{theme,setTheme,font,setFont,background,setBackground}}>{children}</ThemeContext.Provider>
}
