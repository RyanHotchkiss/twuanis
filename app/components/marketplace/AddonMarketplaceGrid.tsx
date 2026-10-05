'use client'
import type {ComponentProps} from 'react'
import MarketplaceListingGrid from './MarketplaceListingGrid'
import {useAddonPlacement} from './useAddonPlacement'
export default function AddonMarketplaceGrid(props:ComponentProps<typeof MarketplaceListingGrid>&{province?:string;propertyType?:string}){
 const {province,propertyType,...grid}=props
 const placement=useAddonPlacement(grid.listings,grid.transactionType,province,propertyType)
 const es=grid.language==='es'
 return <>
  {placement.featured.length>0&&<section aria-label={es?'Propiedades destacadas':'Featured properties'} style={{marginBottom:28}}>
   <h2>{es?'Propiedades destacadas':'Featured properties'}</h2>
   <MarketplaceListingGrid {...grid} listings={placement.featured}/>
  </section>}
  {placement.featured.length>0&&<h2>{es?'Todas las propiedades':'All properties'}</h2>}
  <MarketplaceListingGrid {...grid} listings={placement.listings}/>
 </>
}
