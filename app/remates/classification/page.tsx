import Classification from './Classification'
export default async function ClassificationPage({searchParams}:{searchParams:Promise<{lang?:string}>}){return <Classification language={(await searchParams).lang==='es'?'es':'en'}/>}
