import Evidence from './Evidence'
export default async function EvidencePage({searchParams}:{searchParams:Promise<{lang?:string}>}){return <Evidence language={(await searchParams).lang==='es'?'es':'en'}/>}
