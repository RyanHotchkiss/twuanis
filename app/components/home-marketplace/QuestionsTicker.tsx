"use client"
import {useEffect, useRef} from 'react'
import {usePathname} from 'next/navigation'
import {runningQuestions} from './questions'
import styles from './home.module.css'

// Share the existing questions and animation across the three workspaces.
export default function QuestionsTicker() {
  const path = usePathname()
  const knowledgePage = path==='/en/knowledge'||path.startsWith('/en/knowledge/')||path==='/es/conocimiento'||path.startsWith('/es/conocimiento/')
  const visible = knowledgePage || ['/en','/es','/en/market-hub','/es/centro-de-mercado','/en/market-intelligence','/es/inteligencia-de-mercado'].includes(path)
  const language = path.startsWith('/es') ? 'es' : 'en'
  const ticker = useRef<HTMLElement>(null)
  useEffect(() => {
    if (!visible || !ticker.current) return
    const update = () => document.documentElement.style.setProperty('--question-ticker-height', `${ticker.current?.getBoundingClientRect().height ?? 0}px`)
    update()
    const observer = new ResizeObserver(update)
    observer.observe(ticker.current)
    return () => {observer.disconnect(); document.documentElement.style.removeProperty('--question-ticker-height')}
  }, [visible])
  if (!visible) return null
  return <aside ref={ticker} data-questions-ticker className={styles.banner} aria-label={language === 'es' ? 'Preguntas sobre el mercado' : 'Market questions'}>
    <div className={styles.marquee}>{[0,1].map(copy => <div className={styles.questions} key={copy} aria-hidden={copy === 1}>{runningQuestions[language].map(question => <span key={question}>{question}</span>)}</div>)}</div>
  </aside>
}
