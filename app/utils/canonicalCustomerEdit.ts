import type { SupabaseClient } from '@supabase/supabase-js'
export async function submitCanonicalCustomerEdit(supabase:SupabaseClient,listing:Record<string,any>,initial:Record<string,unknown>,current:Record<string,unknown>,measurementClears:Record<string,boolean>={}) {
 if(listing.canonical_domain_version!==1||typeof listing.canonical_revision!=='string')throw new Error('Refresh to load a confirmed canonical revision.')
 const keys=['province','canton','district','property_type','bedrooms','bathrooms','parking','year_built_range','construction_area','property_area','utility','environment','accessibility','distance_to_paved_road_range','terrain','legal_status','currency','whatsapp','title','description','priceMillions','monthly_price']
 const changes:Record<string,unknown>={}
 for(const key of keys)if(JSON.stringify(initial[key])!==JSON.stringify(current[key]))changes[key==='priceMillions'?'current_price':key]=current[key]
 for(const dim of ['property_area','construction_area']) {
   if(measurementClears[dim]===true)changes[dim]={kind:'clear'}
   else if(dim in changes) {
     const value=changes[dim]
     if((typeof value!=='string'&&typeof value!=='number')||!/^\d+(\.\d+)?$/.test(String(value))||!Number.isFinite(Number(value))||Number(value)<=0)throw new Error('Enter a positive measurement or explicitly choose Clear measurement.')
     changes[dim]={kind:'set',value:String(value)}
   }
 }
 if(['province','canton','district'].some(k=>k in changes))for(const key of ['province','canton','district'])changes[key]=current[key]
 if('current_price'in changes||'monthly_price'in changes||'currency'in changes){
   const key=listing.transaction_type==='sale'?'current_price':'monthly_price'
   changes[key]=current[key==='current_price'?'priceMillions':'monthly_price'];changes.currency=current.currency
 }
 if(!Object.keys(changes).length)return
 const {data:{user},error}=await supabase.auth.getUser()
 const {data:{session}}=await supabase.auth.getSession()
 if(error||!user||!session)throw new Error('Authentication required.')
 const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(changes)))
 const signature=Array.from(new Uint8Array(digest),n=>n.toString(16).padStart(2,'0')).join('')
 const key=`twuanis:edit:${user.id}:${listing.id}:${listing.canonical_revision}:${signature}`
 const requestId=localStorage.getItem(key)||crypto.randomUUID();localStorage.setItem(key,requestId)
 const response=await fetch('/api/edit-canonical-listing',{method:'POST',headers:{Authorization:`Bearer ${session.access_token}`,'Content-Type':'application/json'},body:JSON.stringify({listingId:listing.id,expectedRevision:listing.canonical_revision,requestId,changes})})
 const body=await response.json();if(!response.ok||!body.success)throw new Error(body.error||'Edit failed.')
 localStorage.removeItem(key)
}
