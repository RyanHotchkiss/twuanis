import Adapters from './Adapters'
export default async function Page({searchParams}:{searchParams:Promise<{lang?:string}>}){return <Adapters language={(await searchParams).lang==='es'?'es':'en'}/>}
