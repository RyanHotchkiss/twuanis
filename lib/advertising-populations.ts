import type {AddonHomepageItem} from './addon-homepage-contract'
// Bounded, real published page rows only; this creates no commercial records.
export function advertisingPopulations(listings:any[],paidSpotlight:AddonHomepageItem[],paidFeatured:AddonHomepageItem[],market:'sale'|'rent',ready:boolean){
 const eligible=listings.filter(l=>l.canonical_domain_version===1&&l.transaction_type===market&&typeof l.title==='string'&&l.title.trim()&&Array.isArray(l.images)&&/^https?:\/\//i.test(l.images[0]??'')&&['USD','CRC'].includes(l.marketplace_original_currency)&&Number(l.marketplace_original_price)>0)
 const unique=(items:AddonHomepageItem[])=>items.filter((x,i)=>x.transaction===market&&x.listing?.transaction_type===market&&x.listing?.id===x.id&&items.findIndex(y=>y.id===x.id)===i)
 const paidS=unique(paidSpotlight).slice(0,5),paidF=unique(paidFeatured).slice(0,12)
 const asExample=(l:any):AddonHomepageItem=>({id:l.id,title:l.title,transaction:market,image:l.images[0],listing:l,demonstration:true})
 const spotlightCandidates=[...eligible.filter(l=>!paidF.some(p=>p.id===l.id)),...eligible.filter(l=>paidF.some(p=>p.id===l.id))].filter(l=>!paidS.some(p=>p.id===l.id))
 const spotlight=ready?[...paidS,...spotlightCandidates.slice(0,5-paidS.length).map(asExample)]:paidS
 const featuredCandidates=[...eligible.filter(l=>!spotlight.some(p=>p.id===l.id)),...eligible.filter(l=>spotlight.some(p=>p.id===l.id))].filter(l=>!paidF.some(p=>p.id===l.id))
 const featured=ready?[...paidF,...featuredCandidates.slice(0,12-paidF.length).map(asExample)]:paidF
 return {spotlight,featured}
}
