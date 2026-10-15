import Identity from './Identity'
export default async function IdentityPage({searchParams}:{searchParams:Promise<{lang?:string}>}){return <Identity language={(await searchParams).lang==='es'?'es':'en'}/>}
