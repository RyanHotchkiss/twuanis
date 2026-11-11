// Presentation only: canonical identities, never translated names or Package position.
export function commercialTheme(product:string){
 return ({'pkg-geographic-distribution-price-range':'blue','pkg-matching-market-comparison':'professional','pkg-pricing-position-relationships':'gold'} as Record<string,string>)[product]??'neutral'
}
