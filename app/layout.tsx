import type { Metadata } from 'next'
import { Cinzel } from 'next/font/google'
import './globals.css'

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

      <body
        className={`${cinzel.variable} antialiased`}
      >

        {children}

      </body>

    </html>

  )

}