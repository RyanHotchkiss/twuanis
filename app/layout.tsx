import {requestMeasurementEligibility} from '@/lib/measurement/owner-ip-exclusion'
import {getJourneyPolicy} from './measurement/journey-actions'
import {journeyCollectionEnabled,journeyMaintenanceEnabled} from '@/lib/measurement/journey-enabled'
import {privacyDraftVisible} from '@/lib/measurement/privacy-notice'
import {productionPersistenceEnabled,productionBasicMeasurementEnabled} from '@/lib/measurement/durable-outcomes'
import MeasurementProvider from './components/MeasurementProvider'
import type { Metadata } from 'next'
import {headers} from 'next/headers'
import { Suspense } from 'react'
import RematesDocumentLanguage from './components/remates/RematesDocumentLanguage'
import { Cinzel } from 'next/font/google'
import './globals.css'
import ThemeProvider from './components/theme/ThemeProvider'
import {themeBootstrap} from './components/theme/theme-contract'
import HomepageEntranceProvider from './components/HomepageEntrance'
import CampaignPlacements from './components/CampaignPlacements'
import GlobalUtilityMenu from './components/GlobalUtilityMenu'
import IntroductoryTour from './components/intro-tour/IntroductoryTour'
import QuestionsTicker from './components/home-marketplace/QuestionsTicker'

const cinzel = Cinzel({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-cinzel'
})

export const metadata: Metadata = {
  title: 'Twuanis',
  description: 'Property Marketing and Discovery',
  icons: {
    icon: [
      ...[16, 32, 48, 192, 512].map(size => ({ url: `/favicon-20s-v1-${size}.png`, type: 'image/png', sizes: `${size}x${size}` })),
      { url: '/favicon-20s-v1.svg', type: 'image/svg+xml', sizes: 'any', media: '(prefers-color-scheme: light)' },
      { url: '/favicon-20s-v1-dark.svg', type: 'image/svg+xml', sizes: 'any', media: '(prefers-color-scheme: dark)' }
    ],
    apple: [{ url: '/favicon-20s-v1-180.png', sizes: '180x180', type: 'image/png' }]
  }
}

export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {

  const language=(await headers()).get('x-twuanis-document-language')==='es'?'es':'en'
  const noticeVisible=await privacyDraftVisible()
  const [journeyPolicy,sourceEligibility]=await Promise.all([getJourneyPolicy(),requestMeasurementEligibility()])
  const basicMeasurement=noticeVisible&&productionBasicMeasurementEnabled()
  return (

    <html lang={language}>

      <head><script dangerouslySetInnerHTML={{__html:themeBootstrap}} /></head>

      <body
        className={`${cinzel.variable} antialiased`}
      >

        <ThemeProvider>
          <HomepageEntranceProvider>
          <div id="intro-tour-site" style={{display:"contents"}}>
          <QuestionsTicker />
          <Suspense fallback={null}><GlobalUtilityMenu /></Suspense>
          <Suspense fallback={null}><RematesDocumentLanguage /></Suspense>
          {children}
          <CampaignPlacements />
          <MeasurementProvider sourceExcluded={sourceEligibility==='excluded'} journeyEnabled={journeyCollectionEnabled()} journeyPolicy={journeyPolicy} journeyRightsEnabled={journeyMaintenanceEnabled()} privacyDraftVisible={noticeVisible} profile={basicMeasurement?'basic':'full'} mode={process.env.TWUANIS_MEASUREMENT_LOCAL==='1'?'local':basicMeasurement||productionPersistenceEnabled()?'google':'off'} />
          </div>
          <Suspense fallback={null}><IntroductoryTour /></Suspense>
          </HomepageEntranceProvider>
        </ThemeProvider>

      </body>

    </html>

  )

}