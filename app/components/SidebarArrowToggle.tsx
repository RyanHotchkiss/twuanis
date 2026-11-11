'use client'
import {useLayoutEffect,useRef,useState} from 'react'
import {createPortal} from 'react-dom'
import {ChevronLeft,ChevronRight} from 'lucide-react'
import {useSiteTheme} from './theme/ThemeProvider'
// Keep the resting toggle inside the existing homepage listings boundary.
export function useListingsTogglePosition(enabled:boolean){
 const [position,setPosition]=useState<{top:number;visible:boolean}>({top:24,visible:false})
 useLayoutEffect(()=>{if(!enabled)return;let frame=0
  const update=()=>{
   const boundary=document.querySelector('[data-home-listings-boundary]')
   const rect=boundary?.getBoundingClientRect()
   const heading=boundary?.querySelector('[data-marketplace-count]')?.closest('header')?.getBoundingClientRect()
   // Follow the count heading into view, then remain in the sidebar gutter.
   const bannerBottom=document.querySelector('[data-questions-ticker]')?.getBoundingClientRect().bottom??0
   const navigationBottom=window.innerWidth<=768?(document.querySelector('[data-homepage-expand]')??document.querySelector('.homepage-navigation-row'))?.getBoundingClientRect().bottom??0:0
   let top=Math.max(24,bannerBottom+12,navigationBottom+12,(heading?.bottom??rect?.top??0)+16)
   for(const promotion of boundary?.querySelectorAll('[data-spotlight-promotion],[data-featured-promotion],[data-all-properties]')??[]){
    const header=(promotion.hasAttribute('data-all-properties')?promotion:promotion.parentElement)?.getBoundingClientRect()
    if(header&&header.top<top+44&&header.bottom>top)top=header.bottom+12
   }
   setPosition(rect?{top,visible:rect.top<=0&&top+44<window.innerHeight&&rect.bottom>top+44}:{top:window.innerHeight/2-22,visible:true})
  }
  const schedule=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(update)}
  update();window.addEventListener('scroll',schedule,{passive:true});window.addEventListener('resize',schedule)
  const observer=new ResizeObserver(schedule);observer.observe(document.body)
  const navigation=document.querySelector('.homepage-navigation-row');if(navigation)observer.observe(navigation)
  return()=>{cancelAnimationFrame(frame);observer.disconnect();window.removeEventListener('scroll',schedule);window.removeEventListener('resize',schedule)}
 },[enabled])
 return position
}
export default function SidebarArrowToggle({collapsed,label,onToggle,controls,className,stretchCollapsed=false}:{collapsed:boolean;label:string;onToggle:()=>void;controls?:string;className?:string;stretchCollapsed?:boolean}) {
 const position=useListingsTogglePosition(collapsed&&stretchCollapsed)
 const {theme}=useSiteTheme()
 const anchor=useRef<HTMLSpanElement>(null)
 const [left,setLeft]=useState<number|null>(null)
 useLayoutEffect(()=>{if(!collapsed||!stretchCollapsed)return;const update=()=>setLeft(anchor.current?.getBoundingClientRect().left??0);update();window.addEventListener('resize',update);return()=>window.removeEventListener('resize',update)},[collapsed,stretchCollapsed])
 const button = <button type="button" data-sidebar-arrow={collapsed?'expand':'collapse'} className={className} aria-label={label} title={label} aria-expanded={!collapsed} aria-controls={controls} onClick={onToggle} style={{width:'var(--sidebar-toggle-width, 44px)',height:44,minHeight:44,boxSizing:'border-box',display:'flex',alignItems:'center',justifyContent:'center',padding:0,margin:0,background:theme==='light'?'#faf6e9':'#161616',border:'1px solid #b99a46',borderRadius:14,color:'#ff3b00',cursor:'pointer',flexShrink:0,boxShadow:'0 3px 10px #0002'}}>{collapsed?<ChevronRight size={18}/>:<ChevronLeft size={18}/>}</button>
 if(collapsed&&stretchCollapsed)return <span ref={anchor} style={{display:'block',width:44,height:44}}>{left!==null&&position.visible&&createPortal(<div style={{position:'fixed',left,top:position.top,zIndex:1501}}>{button}</div>,document.body)}</span>
 return button
}
