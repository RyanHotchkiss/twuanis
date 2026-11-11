'use client'
import {useEffect,useState} from 'react'
import {supabase} from '@/lib/supabase'
import {listingReviewMessage} from '@/lib/listing-duplicate-review'
export default function ListingReviewStatus({listingIds,language}:{listingIds:string[];language:'en'|'es'}){
 const [items,setItems]=useState<{id:string;status:string}[]>([]),key=listingIds.join(',')
 useEffect(()=>{let active=true;void Promise.all(key.split(',').filter(Boolean).map(async id=>{const r=await supabase.rpc('read_customer_listing_review',{p_listing:id});return r.error||!r.data?null:{id,status:String(r.data.status)}})).then(rows=>{if(active)setItems(rows.filter((r):r is {id:string;status:string}=>r!==null))});return()=>{active=false}},[key])
 return <div aria-live="polite">{items.map(item=><p key={item.id}>{(item.status==='DIFFERENT_PROPERTIES'||item.status==='NO_MATCH_AFTER_REVISION')?(language==='es'?'La revisión ya no bloquea la publicación. Consulte su estado.':'Review cleared; check publication status.'):listingReviewMessage(item.status==='AUTOMATIC_REJECTION'||item.status==='CONFIRM_DUPLICATE'?'AUTOMATIC_REJECTION':'REVIEW_REQUIRED',language)} <span>{item.id}</span></p>)}</div>
}
