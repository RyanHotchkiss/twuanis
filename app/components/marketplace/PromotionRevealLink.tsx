"use client"
import Link from 'next/link'
import {useEffect,useRef,useState,type ComponentProps} from 'react'

// Preserve the existing fade while navigating on the first activation.
export default function PromotionRevealLink(props:ComponentProps<typeof Link>){
 const anchor=useRef<HTMLAnchorElement>(null)
 const [revealed,setRevealed]=useState(false),[faded,setFaded]=useState(false)
 useEffect(()=>{
  setRevealed(false);setFaded(false)
  const element=anchor.current
  if(!element||typeof IntersectionObserver==='undefined')return
  // Each invitation earns five seconds of actual viewport exposure independently.
  let remaining=5000,started:number|null=null,timer:ReturnType<typeof setTimeout>|null=null,inView=false
  const pause=()=>{
   if(timer!==null){clearTimeout(timer);timer=null}
   if(started!==null){remaining=Math.max(0,remaining-(performance.now()-started));started=null}
  }
  const update=()=>{
   pause()
   if(!inView||document.hidden||remaining<=0)return
   started=performance.now()
   timer=setTimeout(()=>{timer=null;started=null;remaining=0;setFaded(true)},remaining)
  }
  const observer=new IntersectionObserver(entries=>{
   const entry=entries.find(item=>item.target===element)
   if(!entry)return
   inView=entry.isIntersecting&&entry.intersectionRatio>=.01
   update()
  },{threshold:.01})
  observer.observe(element)
  document.addEventListener('visibilitychange',update)
  return()=>{pause();observer.disconnect();document.removeEventListener('visibilitychange',update)}
 },[props.href])
 return <Link data-measure-control={'data-spotlight-promotion' in props?'spotlight_property':'feature_listing'} {...props} ref={anchor} data-promotion-faded={faded} data-promotion-revealed={revealed} onClick={event=>{
  setRevealed(true)
  props.onClick?.(event)
 }}/>
}
