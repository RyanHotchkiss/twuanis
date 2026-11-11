import InstitutionInventory from '@/app/components/remates/InstitutionInventory'
export default async function Page({searchParams}:{searchParams:Promise<{lang?:string}>}){return <InstitutionInventory language={(await searchParams).lang==='es'?'es':'en'}/>}
