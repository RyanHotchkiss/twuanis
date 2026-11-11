'use client'
import controls from '../home-carousel-controls.module.css'
import {HOMEPAGE_ROTATION_MS} from '@/lib/homepage-presentation-timing'
import {useEffect,useRef,useState,type ComponentProps} from 'react'
import MarketplaceListingGrid from './MarketplaceListingGrid'
import StableCarouselFrame from './StableCarouselFrame'
import {usePlacementRotation,usePlacementMobile} from './usePlacementRotation'
export default function FeaturedPlacementCarousel(props:ComponentProps<typeof MarketplaceListingGrid>&{homepage?:boolean}){
 const host=useRef<HTMLDivElement>(null),[size,setSize]=useState(1)
 useEffect(()=>{const update=()=>{const grid=host.current?.querySelector('[data-carousel-slide] > div');const gap=grid?parseFloat(getComputedStyle(grid).columnGap)||20:20;setSize(Math.max(1,Math.floor(((host.current?.clientWidth??220)+gap)/(220+gap))))};update();const observer=new ResizeObserver(update);if(host.current)observer.observe(host.current);return()=>observer.disconnect()},[])
 const mobile=usePlacementMobile()
 const visibleSize=mobile?1:size,es=props.language==='es'
 const groups=Math.ceil(props.listings.length/visibleSize),[index,setIndex]=usePlacementRotation(groups,props.homepage?HOMEPAGE_ROTATION_MS:4000,mobile)
 return <>{mobile&&groups>1&&<div data-featured-controls style={{display:'flex',alignItems:'center',justifyContent:'center',width:'100%',gap:12,marginBottom:12,color:props.theme==='light'?'#000000':'#ffffff'}}>
  <button type="button" className={props.homepage?controls.touchTarget:undefined} aria-label={es?'Propiedad destacada anterior':'Previous featured property'} onClick={()=>setIndex(i=>(i-1+groups)%groups)}>{props.homepage?<span className={`${controls.control} ${controls.half} ${controls.thin} ${controls.chevron}`} aria-hidden="true"><span>‹</span></span>:'‹'}</button>
  <span aria-live="polite">{index+1} - {groups}</span>
  <button type="button" className={props.homepage?controls.touchTarget:undefined} aria-label={es?'Siguiente propiedad destacada':'Next featured property'} onClick={()=>setIndex(i=>(i+1)%groups)}>{props.homepage?<span className={`${controls.control} ${controls.half} ${controls.thin} ${controls.chevron}`} aria-hidden="true"><span>›</span></span>:'›'}</button>
 </div>}<div ref={host} data-featured-group={index} data-featured-group-size={visibleSize}><StableCarouselFrame active={index} slides={Array.from({length:groups},(_,i)=>({id:props.listings[i*visibleSize].id,content:<MarketplaceListingGrid {...props} listings={props.listings.slice(i*visibleSize,i*visibleSize+visibleSize)}/>}))}/></div></>
}
