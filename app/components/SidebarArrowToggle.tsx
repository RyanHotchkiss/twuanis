'use client'
import type { CSSProperties } from 'react'
// Existing Buy/Rent sidebar arrow, shared without changing its visual treatment.
export default function SidebarArrowToggle({collapsed,label,onToggle,controls,className,stretchCollapsed=false}:{collapsed:boolean;label:string;onToggle:()=>void;controls?:string;className?:string;stretchCollapsed?:boolean}) {
 const stretch=collapsed&&stretchCollapsed
 const style:CSSProperties={width:stretch?'100%':'42px',height:'42px',minHeight:'42px',alignSelf:stretch?'stretch':'flex-end',display:'flex',alignItems:'center',justifyContent:'center',padding:0,margin:stretch?0:'0 0 -8px',background:'transparent',border:'none',color:'#ff3b00',fontSize:'32px',fontWeight:700,lineHeight:1,cursor:'pointer',flexShrink:0}
 return <button type="button" data-sidebar-arrow={collapsed?'expand':'collapse'} className={className} aria-label={label} title={label} aria-expanded={!collapsed} aria-controls={controls} onClick={onToggle} style={style}>{collapsed?'›':'‹'}</button>
}
