import type { Metadata } from 'next'
import {headers} from 'next/headers'
import { Suspense } from 'react'
import RematesDocumentLanguage from './components/remates/RematesDocumentLanguage'
import { Cinzel } from 'next/font/google'
import './globals.css'
import ThemeProvider from './components/theme/ThemeProvider'
import ThemeToggle from './components/theme/ThemeToggle'
import {themeBootstrap} from './components/theme/theme-contract'
import HomepageEntranceProvider from './components/HomepageEntrance'
import CampaignPlacements from './components/CampaignPlacements'
import FloatingHomeMark from './components/FloatingHomeMark'
import QuestionsTicker from './components/home-marketplace/QuestionsTicker'

const cinzel = Cinzel({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-cinzel'
})

export const metadata: Metadata = {
  title: 'Twuanis',
  description: 'Property Marketing and Discovery'
}

export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {

  const language=(await headers()).get('x-twuanis-document-language')==='es'?'es':'en'
  return (

    <html lang={language}>

      <head><script dangerouslySetInnerHTML={{__html:themeBootstrap}} /></head>

      <body
        className={`${cinzel.variable} antialiased`}
      >

        <ThemeProvider>
          <HomepageEntranceProvider>
          <QuestionsTicker />
          <FloatingHomeMark />
          <Suspense fallback={null}><RematesDocumentLanguage /></Suspense>
          {children}
          <CampaignPlacements />
          <ThemeToggle fallback />
          </HomepageEntranceProvider>
        </ThemeProvider>

      </body>

    </html>

  )

}