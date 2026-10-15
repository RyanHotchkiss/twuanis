'use client'
import HomeEngineCards from '@/app/components/home-engine-cards/HomeEngineCards'
import {CommercialCatalog} from '@/app/components/CustomerCommercial'
export default function PaquetesInteligenciaMercado({inventory}:{inventory:{sale:number|null;rent:number|null}}){return <><HomeEngineCards language="es" categoryPaging intelligence/><CommercialCatalog language="es" inventory={inventory}/></>}
