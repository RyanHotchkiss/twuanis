import PropertyPriceValuation from '@/app/components/PropertyPriceValuation'
export default async function Page({searchParams}:{searchParams:Promise<{listingId?:string}>}){
 const {listingId}=await searchParams
 return <PropertyPriceValuation lang="en" listingId={typeof listingId==='string'?listingId:undefined}/>
}
