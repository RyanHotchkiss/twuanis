'use client'
import PromotionRevealLink from './PromotionRevealLink'
import advertisingStyles from './AddonHomepageCarousel.module.css'
import type {ComponentProps} from 'react'
import Link from 'next/link'
import MarketplaceListingGrid from './MarketplaceListingGrid'
import PropertyCard from './PropertyCard'
import AddonHomepageCarousel from './AddonHomepageCarousel'
import type {AddonHomepageItem} from '@/lib/addon-homepage-contract'
import {useAddonPlacement} from './useAddonPlacement'
import {resolveListingImages} from '@/app/utils/resolveListingImages'
import {advertisingPopulations} from '@/lib/advertising-populations'
import FeaturedPlacementCarousel from './FeaturedPlacementCarousel'
export default function AddonMarketplaceGrid(props:ComponentProps<typeof MarketplaceListingGrid>&{province?:string;propertyType?:string;homepage?:boolean;homepageItems?:AddonHomepageItem[]}){
 const {province,propertyType,homepage=false,homepageItems=[],...grid}=props
 const bank=grid.listings.some(listing=>listing.market==='remates')
 const placement=useAddonPlacement(bank?[]:grid.listings,grid.transactionType,province,propertyType,!homepage)
 const es=grid.language==='es'
 const paidItems=homepage&&!bank?homepageItems.filter(item=>item.listing&&item.transaction===(grid.transactionType==='buy'?'sale':'rent')).map(item=>({...item,listing:{...item.listing,images:resolveListingImages(item.listing?.images)}})):[]
 const market=grid.transactionType==='buy'?'sale':'rent'
 const normalize=(item:AddonHomepageItem)=>({...item,listing:{...item.listing,images:resolveListingImages(item.listing?.images)}})
 const paidSpotlight=(placement.advertising?.spotlight??paidItems.filter(item=>!item.behavior||item.behavior==='homepage_carousel')).map(normalize)
 const paidFeatured=(placement.advertising?.featured??(homepage?paidItems.filter(item=>item.behavior==='featured_collection'):placement.featured.map(listing=>({id:listing.id,title:listing.title,transaction:market,image:null,listing})))).map(normalize)
 const populations=advertisingPopulations(grid.listings,paidSpotlight,paidFeatured,market,placement.ready&&!bank)
 const items=bank?[]:populations.spotlight
 const homepageIsExample=items.every(item=>item.demonstration)
 const featured=populations.featured.map(item=>({...item.listing,id:item.id,demonstration:item.demonstration,advertisingPlacementKind:item.demonstration?'demonstration':'paid'}))
 const featuredIsExample=featured.every(item=>item.demonstration)
 const grids=(spotlightId?:string)=>{
  // An example may not displace a paid Featured Listing, even when only one listing is available.
  const visibleFeatured=featured
  const remaining=(bank?grid.listings:placement.listings.filter(l=>!featured.some(f=>f.id===l.id))).filter(p=>!items.some(item=>item.id===p.id))
  return <>
   {!bank&&visibleFeatured.length>0&&<section data-featured-listings data-placement-kind={featuredIsExample?'demonstration':featured.some(item=>item.demonstration)?'mixed':'paid'} aria-label={es?'Propiedades destacadas de Twuanis':'Twuanis Featured Properties'} style={{marginBottom:28}}>
    <div style={{display:'flex',gap:12,alignItems:'center',justifyContent:'space-between',padding:'0 1.25rem',marginBottom:12,boxSizing:'border-box',color:grid.theme==='light'?'#000000':'var(--foreground)'}}><h2 style={{minWidth:0,maxWidth:'60%',fontSize:'clamp(14px, 2vw, 20px)'}}>{es?'Propiedades destacadas de Twuanis':'Twuanis Featured Properties'}</h2>
    <PromotionRevealLink data-featured-promotion className={`listing-advertising-action ${advertisingStyles.promotion}`} style={{marginLeft:'auto',maxWidth:'40%',textAlign:'center',background:grid.theme==='dark'?'#000000':'#ffffff',color:'inherit',fontSize:'clamp(12px, 1.4vw, 16px)'}} href={es?'/es/inteligencia-de-mercado/paquetes?tab=addons':'/en/market-intelligence/packages?tab=addons'}>{es?'Destaque sus anuncios':'Feature Your Listing(s)'}</PromotionRevealLink></div>
    <FeaturedPlacementCarousel {...grid} homepage={homepage} prefetchListings={false} imageLoading="lazy" listings={visibleFeatured}/>
   </section>}
   {!bank&&featured.length>0&&remaining.length>0&&<h2 data-all-properties>{es?'Todas las propiedades':'All properties'}</h2>}
   {(remaining.length>0||!spotlightId&&!visibleFeatured.length)&&<MarketplaceListingGrid {...grid} prefetchListings={false} listings={remaining}/>}
  </>
 }
 if(!items.length)return grids()
 return <><AddonHomepageCarousel homepage={homepage} items={items} language={grid.language??'en'} demonstration={homepageIsExample}>{(item,contactHref)=>
  <div data-homepage-exposure-card style={{width:'100%',minWidth:0}}><PropertyCard key={item.id} spotlight spotlightContactHref={contactHref} placementKind={item.demonstration?'demonstration':'paid'} prefetchListing={false} imageLoading={items[0]?.id===item.id?'eager':'lazy'} property={item.listing} theme={grid.theme} transactionType={grid.transactionType} language={grid.language}
   isFavorite={grid.favoriteIds.includes(item.id)} isSelected={grid.isSelected(item.id)} compareDisabled={!grid.isSelected(item.id)&&grid.selectedPropertyIds.length>=grid.maximumProperties}
   onToggleFavorite={()=>grid.onToggleFavorite(item.listing)} onToggleCompare={()=>grid.onToggleCompare(item.id)}/></div>
 }</AddonHomepageCarousel><div>{grids()}</div></>
}
