'use client'
import {useEffect,useState} from 'react'

// Presentation ordering only. No analytical machinery or commercial authority.
export function useAddonPlacement<T extends {id:string}>(listings:T[],surface:'buy'|'rent'|'swipe-buy'|'swipe-rent',province='',propertyType=''){
 const key=JSON.stringify({ids:listings.map(x=>x.id),surface,province,propertyType})
 const [result,setResult]=useState<{key:string;orderedIds:string[];featuredIds:string[]}|null>(null)
 useEffect(()=>{
  const controller=new AbortController()
  if(JSON.parse(key).ids.length===0)return ()=>controller.abort()
  void fetch('/api/addon-placement',{method:'POST',headers:{'Content-Type':'application/json'},body:key,signal:controller.signal,cache:'no-store'})
   .then(r=>r.ok?r.json():null).then(r=>{if(!controller.signal.aborted)setResult(r?.enabled&&Array.isArray(r.orderedIds)&&Array.isArray(r.featuredIds)?{key,orderedIds:r.orderedIds,featuredIds:r.featuredIds}:null)})
   .catch(()=>{if(!controller.signal.aborted)setResult(null)})
  return ()=>controller.abort()
 },[key])
 const map=new Map(listings.map(x=>[x.id,x]))
 const current=result?.key===key&&result.orderedIds.length===listings.length&&new Set(result.orderedIds).size===listings.length&&result.orderedIds.every(id=>map.has(id))&&result.featuredIds.every(id=>map.has(id))?result:null
 return {listings:current?current.orderedIds.map(id=>map.get(id)).filter((x):x is T=>!!x):listings,featured:current?current.featuredIds.map(id=>map.get(id)).filter((x):x is T=>!!x):[]}
}
