'use client'
import {useEffect,useState} from 'react'
import Link from 'next/link'
import {listingHref} from '@/lib/listing-route'
import type {AddonHomepageItem} from '@/lib/addon-homepage-contract'
export default function AddonHomepageCarousel({items,language}:{items:AddonHomepageItem[];language:'en'|'es'}){
 const [index,setIndex]=useState(0),[paused,setPaused]=useState(false)
 useEffect(()=>{if(matchMedia('(prefers-reduced-motion: reduce)').matches)setPaused(true)},[])
 useEffect(()=>{if(paused||items.length<2)return;const timer=setInterval(()=>setIndex(i=>(i+1)%items.length),2500);return()=>clearInterval(timer)},[paused,items.length])
 if(!items.length)return null
 const item=items[index%items.length],es=language==='es'
 return <section aria-label={es?'Propiedades en portada':'Homepage properties'}>
  <div aria-hidden="true" style={{position:'absolute',inset:'0 0 auto',height:'100vh',minHeight:760,pointerEvents:'none',background:item.image?undefined:'linear-gradient(135deg,#262626,#555)'}}>
   {item.image&&<img src={item.image} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>}
  </div>
  <div style={{position:'relative',zIndex:5,margin:'85px 16px 12px',padding:12,borderRadius:12,background:'rgba(0,0,0,.78)',color:'#fff',maxWidth:430,display:'flex',gap:10,flexWrap:'wrap',alignItems:'center'}}>
   <span style={{width:'100%'}}>{item.title|| (es?'Propiedad':'Property')}{!item.image&&` · ${es?'Sin imagen':'No image'}`}</span>
   <button type="button" aria-label={es?'Anterior':'Previous'} onClick={()=>setIndex(i=>(i-1+items.length)%items.length)}>←</button>
   <span>{index%items.length+1} / {items.length}</span>
   <button type="button" aria-label={es?'Siguiente':'Next'} onClick={()=>setIndex(i=>(i+1)%items.length)}>→</button>
   <button type="button" onClick={()=>setPaused(p=>!p)}>{paused?(es?'Reanudar':'Resume'):(es?'Pausar':'Pause')}</button>
   <Link style={{color:'#fff',textDecoration:'underline'}} href={listingHref(item.id,item.transaction,language)}>{es?'Ver propiedad':'View listing'}</Link>
  </div>
 </section>
}
