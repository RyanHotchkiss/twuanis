'use client'
import {usePathname} from 'next/navigation'
import {useSiteTheme} from './ThemeProvider'
export default function ThemeToggle({fallback=false}:{fallback?:boolean}){const{theme,setTheme}=useSiteTheme(),es=usePathname().startsWith('/es');return <button type="button" data-theme-control={!fallback?'true':undefined} className={fallback?'site-theme-fallback':'site-theme-toggle'} aria-label={theme==='dark'?(es?'Cambiar a modo claro':'Switch to light mode'):(es?'Cambiar a modo oscuro':'Switch to dark mode')} aria-pressed={theme==='light'} onClick={()=>setTheme(t=>t==='dark'?'light':'dark')}><span aria-hidden="true">◐</span><span>{theme==='dark'?(es?'Modo claro':'Light mode'):(es?'Modo oscuro':'Dark mode')}</span></button>}
