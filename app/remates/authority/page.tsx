import Authority from './Authority'
export default async function InstitutionalAuthorityPage({searchParams}:{searchParams:Promise<{lang?:string}>}){return <Authority language={(await searchParams).lang==='es'?'es':'en'}/>}
