'use client'
import type {ComponentProps} from 'react'
import MarketplaceListingGrid from './MarketplaceListingGrid'
import {useAddonPlacement} from './useAddonPlacement'
export default function AddonMarketplaceGrid(props:ComponentProps<typeof MarketplaceListingGrid>&{province?:string;propertyType?:string}){
 const {province,propertyType,...grid}=props
 const bank=grid.listings.some(listing=>listing.market==='remates')
 const placement=useAddonPlacement(bank?[]:grid.listings,grid.transactionType,province,propertyType)
 const es=grid.language==='es'
 return <>
  {!bank&&placement.featured.length>0&&<section aria-label={es?'Propiedades destacadas':'Featured properties'} style={{marginBottom:28}}>
   <h2>{es?'Propiedades destacadas':'Featured properties'}</h2>
   <MarketplaceListingGrid {...grid} listings={placement.featured}/>
  </section>}
  {!bank&&placement.featured.length>0&&<h2>{es?'Todas las propiedades':'All properties'}</h2>}
  <MarketplaceListingGrid {...grid} listings={bank?grid.listings:placement.listings}/>
 </>
}
