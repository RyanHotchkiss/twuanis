import Financial from './Financial'
export default async function FinancialPage({searchParams}:{searchParams:Promise<{lang?:string}>}){return <Financial language={(await searchParams).lang==='es'?'es':'en'}/>}
