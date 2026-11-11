'use client'
import {CommercialCatalog} from '@/app/components/CustomerCommercial'
export default function PaquetesInteligenciaMercado({inventory}:{inventory:{sale:number|null;rent:number|null}}){return <><CommercialCatalog language="es" inventory={inventory} packagePresentation entertainmentPresentation/></>}
