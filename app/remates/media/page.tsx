import Media from './Media'
export default async function MediaPage({searchParams}:{searchParams:Promise<{lang?:string}>}){return <Media language={(await searchParams).lang==='es'?'es':'en'}/>}
