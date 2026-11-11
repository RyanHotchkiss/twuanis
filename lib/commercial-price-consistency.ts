import {convertCrcToUsd,convertUsdToCrc} from './currency-conversion'
type Quote={standardPrice?:string|number;effectivePrice?:string|number;founderProtected?:boolean;fx?:{source?:string;rate?:string|number}|null}
// Verify already-resolved canonical quotes; this does not establish prices or FX.
// Professional can be read safely before AND after its approved CRC-anchor cutover.
export function commercialQuoteCurrencyMatches(kind:string,product:string,key:'standardPrice'|'effectivePrice',crc:Quote,usd:Quote,rate:number){
 if(!Number.isFinite(rate)||rate<=0)return false
 const c=Number(crc[key]),u=Number(usd[key]);if(!Number.isFinite(c)||!Number.isFinite(u)||c<0||u<0)return false
 const crcToUsd=u===Math.round(convertCrcToUsd(c,rate)*100)/100
 const usdToCrc=c===Math.round(convertUsdToCrc(u,rate))
 if(kind==='package'&&product==='pkg-geographic-distribution-price-range')return crcToUsd
 if(kind==='package'&&(product==='pkg-matching-market-comparison'||product==='pkg-pricing-position-relationships')&&usd.fx?.source==='BCCR'){
  if(Number(usd.fx.rate)!==rate)return false
  // Protected historical quotes retain their original authoritative currency.
  // Only the authenticated canonical RPC can supply both protected flags.
  if(key==='effectivePrice'&&crc.founderProtected===true&&usd.founderProtected===true)return crcToUsd||usdToCrc
  return crcToUsd
 }
 return usdToCrc
}
