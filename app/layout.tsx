import type { Metadata } from 'next'
import { Cinzel } from 'next/font/google'
import './globals.css'
import ThemeProvider from './components/theme/ThemeProvider'
import ThemeToggle from './components/theme/ThemeToggle'
import {themeBootstrap} from './components/theme/theme-contract'
import HomepageEntranceProvider from './components/HomepageEntrance'
import CampaignPlacements from './components/CampaignPlacements'
import FloatingHomeMark from './components/FloatingHomeMark'

const cinzel = Cinzel({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-cinzel'
})

export const metadata: Metadata = {
  title: 'Twuanis',
  description: 'Property Marketing and Discovery'
}

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {

  return (

    <html lang="en">

      <head><script dangerouslySetInnerHTML={{__html:themeBootstrap}} /></head>

      <body
        className={`${cinzel.variable} antialiased`}
      >

        <ThemeProvider>
          <HomepageEntranceProvider>
          <FloatingHomeMark />
          {children}
          <CampaignPlacements />
          <ThemeToggle fallback />
          </HomepageEntranceProvider>
        </ThemeProvider>

      </body>

    </html>

  )

}