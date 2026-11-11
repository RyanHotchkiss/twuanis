import {promotionalDeadline} from './promotional-deadline'
export type HubPopulation='PRIVATE'|'BANK'
export type HubPackageAccess={engine:string;population:HubPopulation;accountId:string|null;allowed:boolean;state:'authorized'|'public'|'signed_out'|'locked'|'unavailable';checkedAt:number;recheckAt:number;expiresAt?:number;packages:Record<string,1|2|3>;offer?:HubPackageOffer}
// Presentation numbers/colors only. Capability membership always comes from the catalog.
export const HUB_PACKAGE_NUMBERS:Record<string,1|2|3>={'pkg-geographic-distribution-price-range':1,'pkg-matching-market-comparison':2,'pkg-pricing-position-relationships':3}
export function lowestHubPackages(products:readonly {id:string;capabilities:string[]}[],engines:readonly (readonly [string,string,string,string,...unknown[]])[]){
 const result:Record<string,1|2|3>={}
 for(const engine of engines){const memberships=products.filter(p=>p.capabilities.includes(engine[3])).map(p=>HUB_PACKAGE_NUMBERS[p.id]).filter(Boolean);if(!memberships.length)throw Error('Missing canonical Package membership');result[engine[0]]=Math.min(...memberships) as 1|2|3;result[engine[1]]=result[engine[0]]}
 return result
}

export type HubPackageOffer={entryNumber:1|2|3;entryEN:string;entryES:string;dailyNumber:2|3;dailyEN:string;dailyES:string;USD:number|null;CRC:number|null;term?:'month'|'day';priceSource?:string;offerEnd?:string|null;standardUSD?:number|null;standardCRC?:number|null}
export function groupHubEngines<T extends {id:string}>(engines:T[],packages:Record<string,1|2|3>={}){
 return [...engines].sort((a,b)=>(packages[a.id]??4)-(packages[b.id]??4))
}
// Canonical names remain unchanged; remove only a redundant terminal English word.
export function overlayPackageName(name:string){return name.replace(/\s+Package\.?$/i,'')}
export function hubPackageInvitation(access:HubPackageAccess|undefined,engineName:string,language:'en'|'es',now=Date.now()){
 const es=language==='es',o=access?.offer,privatePopulation=access?.population==='PRIVATE'
 const expired=o?.priceSource==='OFFER'&&!!o.offerEnd&&Date.parse(o.offerEnd)<now
 const amounts=o?{USD:expired?o.standardUSD:o.USD,CRC:expired?o.standardCRC:o.CRC}:null
 const prices=privatePopulation&&amounts?((es?['CRC','USD']:['USD','CRC']) as ('USD'|'CRC')[]).flatMap(currency=>{const amount=amounts[currency];return typeof amount==='number'&&Number.isFinite(amount)&&amount>0?[new Intl.NumberFormat(es?'es-CR':'en-US',{style:'currency',currency,currencyDisplay:'narrowSymbol',minimumFractionDigits:0,maximumFractionDigits:2}).format(amount)]:[]}):[]
 const pair=prices.length===2?`${prices[0]} (${prices[1]})`:null
 const packageWord=es?'Paquete':'Package'
 const heading=o?`${engineName} ${es?'se incluye en el':'is included in'}`:engineName
 const entry=o?{number:o.entryNumber,label:`${packageWord} ${o.entryNumber}`,name:overlayPackageName(es?o.entryES:o.entryEN)}:null
 let prefix=es?'Consulte las opciones de acceso disponibles':'View available access options',suffix='',offerPackage:null|{number:1|2|3;label:string}=null
 if(access?.population&&access.population!=='PRIVATE')prefix=es?'Acceso mediante el paquete aplicable y una ampliación mensual de Bancos/Remates':'Access requires the applicable Package and a monthly Bank/Remates upgrade'
 else if(o&&pair){
  offerPackage={number:o.entryNumber,label:`${packageWord} ${o.entryNumber}`}
  if(o.entryNumber===1&&o.term==='month'){
   const dates=o.priceSource==='OFFER'&&o.offerEnd&&!expired?promotionalDeadline(o.offerEnd,language):null
   const until=dates?.standardStartDate
   prefix=es?`${until?`Hasta el ${until}, `:''}obtén una suscripción de un mes al`:`${until?`Until ${until}, `:''}get a month-long subscription to`
   prefix=prefix.charAt(0).toUpperCase()+prefix.slice(1)
   suffix=es?` por ${pair}`:` for ${pair}`
  }else if(o.entryNumber!==1){
   // Owner-approved campaign wording only; daily prices and checkout stay server-authoritative.
   const beforeCampaignEnd=now<Date.parse('2026-12-01T06:00:00Z')
   prefix=es?'Prueba el':'Try';suffix=es?` (${o.entryNumber===2?'que incluye el Paquete 1':'que incluye el Paquete 1 y el Paquete 2'}) durante 24 horas por ${pair}${beforeCampaignEnd?' hasta el 1 de diciembre':''}`:` (${o.entryNumber===2?'which includes Package 1':'which includes Package 1 and Package 2'}) for 24 hours for ${pair}${beforeCampaignEnd?' until December 1':''}`
  }
  else {offerPackage=null;prefix=es?'La opción de acceso no está disponible actualmente':'The access option is currently unavailable'}
 }else if(o)prefix=es?'La opción de acceso no está disponible actualmente':'The access option is currently unavailable'
 return {heading,entry,prefix,offerPackage,suffix,href:es?'/es/inteligencia-de-mercado/paquetes?tab=packages&currency=CRC':'/en/market-intelligence/packages?tab=packages&currency=USD'}
}

// Display only: consume the existing catalog-derived minimum, never infer capability membership.
export function hubPackageActionLabel(access:HubPackageAccess|undefined,engine:string,language:'en'|'es'){
 const number=access?.packages[engine]??access?.offer?.entryNumber
 const names={1:{en:'Entertainment',es:'Entretenimiento'},2:{en:'Professional',es:'Profesional'},3:{en:'Corporate',es:'Corporativo'}} as const
 if(!number||!names[number])return language==='es'?'Ver Paquetes':'View Packages'
 return language==='es'?`Ver Paquete ${names[number].es}`:`View ${names[number].en} Package`
}
