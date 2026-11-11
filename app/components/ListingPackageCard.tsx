'use client'
import {useEffect,useState} from 'react'
import EntertainmentPackageCard from './EntertainmentPackageCard'
import ProfessionalPackageCard from './ProfessionalPackageCard'
import CorporatePackageCard from './CorporatePackageCard'
import {loadListingPackage} from '@/app/checkout/overlay-actions'
import type {CheckoutSelection} from '@/lib/checkout-selection'
import type {Lang,Lens} from '@/lib/lpi-contract'
import './customer-commercial.css'
import './ListingPackageCard.css'
type Loaded=Extract<Awaited<ReturnType<typeof loadListingPackage>>,{state:'ready'}>
export default function ListingPackageCard({lens,language,onPurchase}:{lens:Lens;language:Lang;onPurchase:(selection:CheckoutSelection,account:string|null,updateSelection:(selection:CheckoutSelection)=>void)=>void}){
 const[storedCurrency,setCurrency]=useState<'USD'|'CRC'>(language==='es'?'CRC':'USD'),[bank,setBank]=useState(false),[duration,setDuration]=useState<'day'|'month'>('month'),[loaded,setLoaded]=useState<Loaded|null>(null),[failed,setFailed]=useState(false)
 const currency:'USD'|'CRC'=language==='es'?'CRC':'USD'
 useEffect(()=>{let live=true;setLoaded(null);setFailed(false);loadListingPackage(lens,language,currency).then(r=>{if(live){if(r.state==='ready')setLoaded(r);else setFailed(true)}}).catch(()=>{if(live)setFailed(true)});return()=>{live=false}},[lens,language,currency])
 if(!loaded)return <p role={failed?'alert':'status'}>{language==='es'?(failed?'No se pudo cargar la opción de acceso. Ejecute de nuevo para reintentar.':'Cargando precios oficiales…'):(failed?'Access option could not be loaded. Run again to retry.':'Loading authoritative prices…')}</p>
 const p=loaded.product,onBuy=(provider:'existing'|'stripe')=>loaded.purchaseEnabled&&onPurchase({kind:'package',product:p.id,provider:provider==='stripe'?'stripe':'sinpe',currency:provider==='stripe'?'USD':'CRC',displayCurrency:currency,lang:language,duration,bank:duration==='month'&&bank,quantity:2},loaded.account,next=>{setBank(next.bank);setDuration(next.duration);setCurrency(language==='es'?'CRC':'USD')})
 const props={inListingCheckout:true,showStripeOption:true,instanceId:`lpi-${lens}-`,product:p,language,currency,bankSelected:bank,onBankChange:setBank,onPurchase:onBuy,busy:false,sinpeAvailable:loaded.sinpe,stripeAvailable:loaded.stripe}
 return <div className="customer-commercial package-presentation" data-lpi-package={p.id}>{p.id==='pkg-geographic-distribution-price-range'?<EntertainmentPackageCard {...props}/>:p.id==='pkg-matching-market-comparison'?<ProfessionalPackageCard {...props} duration={duration} onDurationChange={setDuration}/>:<CorporatePackageCard {...props} duration={duration} onDurationChange={setDuration}/>}</div>
}
