import {notFound} from 'next/navigation'
import {privacyDraftVisible} from '@/lib/measurement/privacy-notice'
import PrivacyNoticeDraft from '@/app/components/PrivacyNoticeDraft'
export const metadata={robots:{index:false,follow:false}}
export default async function Page(){if(!await privacyDraftVisible())notFound();return <PrivacyNoticeDraft locale='en'/>}
