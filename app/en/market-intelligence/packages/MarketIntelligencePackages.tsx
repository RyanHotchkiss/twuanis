'use client'
import {CommercialCatalog} from '@/app/components/CustomerCommercial'
export default function MarketIntelligencePackages({inventory}:{inventory:{sale:number|null;rent:number|null}}){return <><CommercialCatalog language="en" inventory={inventory} packagePresentation entertainmentPresentation/></>}
