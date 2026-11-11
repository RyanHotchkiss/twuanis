'use client'
import {useEffect,useState} from 'react'
import {readBuyBankPage} from '@/app/actions/remates-buy'
import {resolveListingImages} from '@/app/utils/resolveListingImages'
import {createListingId} from '@/lib/createListingId'
export function useMarketplacePage(market:'sale'|'rent'|'bank',language:'en'|'es',filters:Record<string,unknown>,enabled=true){
 const [pageSize,setSize]=useState(100),[position,setPosition]=useState({key:'',page:1})
 const key=JSON.stringify({market,filters,pageSize}),page=position.key===key?position.page:1
 const requestKey=JSON.stringify({key,page})
 const [result,setResult]=useState<{key:string;listings:any[];count:number;error:boolean}>({key:'',listings:[],count:0,error:false})
 useEffect(()=>{
  if(!enabled)return
  const controller=new AbortController();let cancelled=false
  async function load(){try{
   let listings:any[],count:number
   if(market==='bank'){const data=await readBuyBankPage(page-1,language,{size:pageSize,filters});if(!data.ok)throw new Error('Unavailable');listings=data.data.items;count=data.data.count}
   else{const query=new URLSearchParams({transaction:market,page:String(page),size:String(pageSize),filters:JSON.stringify(filters)});const response=await fetch('/api/public-listings?'+query,{cache:'no-store',signal:controller.signal});if(!response.ok)throw new Error('Unavailable');const data=await response.json();listings=data.listings;count=data.count}
   if(!Array.isArray(listings)||listings.length>pageSize||!Number.isSafeInteger(count)||count<0)throw new Error('Invalid page')
   if(page>Math.max(1,Math.ceil(count/pageSize))){if(!cancelled)setPosition({key,page:Math.max(1,Math.ceil(count/pageSize))});return}
   if(!cancelled)setResult({key:requestKey,listings:listings.map(l=>market==='bank'?l:{...l,id:createListingId(l),images:resolveListingImages(l.images)}),count,error:false})
  }catch{if(!cancelled)setResult({key:requestKey,listings:[],count:0,error:true})}}
  void load();return()=>{cancelled=true;controller.abort()}
 },[requestKey,language,enabled])
 const current=result.key===requestKey
 return {page,pageSize,setPage:(page:number)=>setPosition({key,page}),setPageSize:(size:number)=>{setSize(size);setPosition({key:'',page:1})},listings:current?result.listings:[],count:current?result.count:0,loading:!current,error:current&&result.error}
}
