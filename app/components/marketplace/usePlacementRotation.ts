
'use client'
import {useEffect,useState} from 'react'
// Presentation clock only: transitions never acquire data or commercial rights.
export function usePlacementRotation(length:number,interval:number,paused=false){
 const [index,setIndex]=useState(0)
 useEffect(()=>{if(length<2||paused)return;const media=matchMedia('(prefers-reduced-motion: reduce)');let timer:ReturnType<typeof setInterval>|undefined;const update=()=>{if(timer)clearInterval(timer);timer=undefined;if(!document.hidden&&!media.matches)timer=setInterval(()=>setIndex(i=>(i+1)%length),interval)};update();document.addEventListener('visibilitychange',update);media.addEventListener('change',update);return()=>{if(timer)clearInterval(timer);document.removeEventListener('visibilitychange',update);media.removeEventListener('change',update)}},[length,interval,paused])
 return [length?index%length:0,setIndex] as const
}

// The same breakpoint used by the existing marketplace mobile layout.
export function usePlacementMobile(){
 const [mobile,setMobile]=useState(true)
 useEffect(()=>{const media=matchMedia('(max-width: 768px)');const update=()=>setMobile(media.matches);update();media.addEventListener('change',update);return()=>media.removeEventListener('change',update)},[])
 return mobile
}
