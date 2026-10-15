'use client'
import {useLayoutEffect, useRef, useState, type CSSProperties} from 'react'
import {usePathname} from 'next/navigation'
import {useHomepageEntrance} from './HomepageEntrance'
type ArrowPosition = {left:number;top:number;width:number;height:number}
// Keep the same viewport anchor when the collapsed control is remounted after closing its drawer.
const viewportAnchors = new WeakMap<Element, ArrowPosition>()
// Existing Buy/Rent sidebar arrow, shared without changing its visual treatment.
export default function SidebarArrowToggle({collapsed,label,onToggle,controls,className,stretchCollapsed=false}:{collapsed:boolean;label:string;onToggle:()=>void;controls?:string;className?:string;stretchCollapsed?:boolean}) {
 const pathname = usePathname()
 const entrance = useHomepageEntrance()
 const homepage = pathname === '/en' || pathname === '/es'
 const anchor = useRef<HTMLSpanElement>(null)
 const [floating,setFloating] = useState<ArrowPosition|null>(null)
 useLayoutEffect(() => {
  if (!collapsed || !homepage) {setFloating(null);return}
  if (entrance !== 'complete' || !anchor.current) return
  const element = anchor.current
  const owner = element.parentElement
  const previous = owner && viewportAnchors.get(owner)
  if (previous) {setFloating(previous);return}
  // Capture its existing, untransformed layout position only once it is visible.
  const observer = new IntersectionObserver(entries => {
   if (!entries.some(entry => entry.isIntersecting && entry.intersectionRatio === 1)) return
   const rect = element.getBoundingClientRect()
   const position = {left:rect.left,top:rect.top,width:rect.width,height:rect.height}
   if (owner) viewportAnchors.set(owner,position)
   setFloating(position)
   observer.disconnect()
  }, {threshold:1})
  observer.observe(element)
  return () => observer.disconnect()
 }, [collapsed,homepage,entrance])
 const stretch=collapsed&&stretchCollapsed
 const style:CSSProperties={width:stretch?'100%':'42px',height:'42px',minHeight:'42px',alignSelf:stretch?'stretch':'flex-end',display:'flex',alignItems:'center',justifyContent:'center',padding:0,margin:stretch?0:'0 0 -8px',background:'transparent',border:'none',color:'#ff3b00',fontSize:'32px',fontWeight:700,lineHeight:1,cursor:'pointer',flexShrink:0}
 const pinned = collapsed && homepage
 const button = <button type="button" data-sidebar-arrow={collapsed?'expand':'collapse'} className={className} aria-label={label} title={label} aria-expanded={!collapsed} aria-controls={controls} onClick={onToggle} style={pinned ? {...style,margin:0,...(floating ? {position:'fixed',left:floating.left,top:floating.top,width:floating.width,height:floating.height,zIndex:1500} : {})} : style}>{collapsed?'›':'‹'}</button>
 // Retain the original flow space; only the collapsed arrow's positioning changes.
 return pinned ? <span ref={anchor} style={{display:'flex',width:style.width,height:style.height,minHeight:style.minHeight,alignSelf:style.alignSelf,margin:style.margin,flexShrink:0}}>{button}</span> : button
}
