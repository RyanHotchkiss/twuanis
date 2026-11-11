import Ingestion from './Ingestion'
export default async function Page({searchParams}:{searchParams:Promise<{lang?:string}>}){return <Ingestion language={(await searchParams).lang==='es'?'es':'en'}/>}
