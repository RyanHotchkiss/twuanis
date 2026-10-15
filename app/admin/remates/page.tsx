import {resolveAdministrativeAuthority} from '@/lib/administrative-control'
import Operations from './Operations'
export default async function RematesRegistryPage({searchParams}:{searchParams:Promise<{lang?:string}>}){
 const language=(await searchParams).lang==='es'?'es':'en'
 try{const authority=await resolveAdministrativeAuthority();if(authority.owner||authority.permissions.includes('remates.sources.manage')||authority.permissions.includes('remates.moderation.manage'))return <Operations language={language}/> }catch{}
 return <main><h1>{language==='es'?'Administración de Remates':'Bank Properties administration'}</h1><p role="alert">{language==='es'?'Se requiere autoridad administrativa explícita de Remates.':'Explicit Bank Properties administrative authority is required.'}</p></main>
}
