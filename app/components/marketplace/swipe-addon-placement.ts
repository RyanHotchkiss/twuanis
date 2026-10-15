// One presentation snapshot per Swipe load; seen/session progression remains unchanged.
export async function loadSwipeAddonPlacement<T extends {id:string}>(listings:T[],surface:'swipe-buy'|'swipe-rent'):Promise<(T&{addonFeatured?:boolean})[]>{
 try{
  const response=await fetch('/api/addon-placement',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({ids:listings.map(x=>x.id),surface}),cache:'no-store'})
  if(!response.ok)return listings
  const result=await response.json()
  if(!result.enabled||!Array.isArray(result.orderedIds)||!Array.isArray(result.featuredIds))return listings
  const byId=new Map(listings.map(x=>[x.id,x])),featured=new Set(result.featuredIds)
  if(result.orderedIds.length!==listings.length||new Set(result.orderedIds).size!==listings.length||result.orderedIds.some((id:string)=>!byId.has(id)))return listings
  return result.orderedIds.map((id:string)=>({...byId.get(id)!,addonFeatured:featured.has(id)}))
 }catch{return listings}
}
