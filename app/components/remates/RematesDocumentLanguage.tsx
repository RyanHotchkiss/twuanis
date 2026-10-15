'use client'

import {documentLanguage} from '@/lib/document-language'
import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

/** Keep the server-selected EN/ES language correct during client navigation. */
export default function RematesDocumentLanguage() {
  const pathname = usePathname()
  const query = useSearchParams()
  const language=documentLanguage(pathname,query.get('lang'))

  useEffect(() => {
    if (!language) return
    const previous = document.documentElement.lang
    document.documentElement.lang = language
    return () => { document.documentElement.lang = previous }
  }, [language])

  return null
}
