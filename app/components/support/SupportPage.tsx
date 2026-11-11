import {redirect} from 'next/navigation'
import TopBar from '@/app/components/TopBar'
import {readSupportIdentity} from '@/lib/support/identity'
import {supportPath,type SupportLocale} from '@/lib/support/contract'
import SupportIntake from './SupportIntake'
export default async function SupportPage({language}:{language:SupportLocale}){
 const actor=await readSupportIdentity()
 if(!actor.ok)redirect('/login?'+new URLSearchParams({lang:language,next:supportPath(language)}))
 return <><TopBar/><SupportIntake language={language} customerId={actor.userId}/></>
}
