'use client'
import HomeEngineCards from '@/app/components/home-engine-cards/HomeEngineCards'
import {CommercialCatalog} from '@/app/components/CustomerCommercial'
export default function MarketIntelligencePackages({inventory}:{inventory:{sale:number|null;rent:number|null}}){return <><HomeEngineCards language="en" categoryPaging intelligence/><CommercialCatalog language="en" inventory={inventory}/></>}
