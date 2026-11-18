
'use client'

import { useEffect, useState } from 'react'
import { triviaQuestions, type TriviaCategory } from '@/lib/trivia/questions'

type Props = {
  language: 'en' | 'es'
  theme: 'dark' | 'light'
}

const categoryLabels: Record<TriviaCategory, { en: string; es: string }> = {
  'wait-seriously': { en: 'Wait... Seriously?!', es: '¿Qué? ¿En serio?' },
  'weird-animals': { en: 'Weird & Wonderful Animals', es: 'Animales raros y maravillosos' },
  'pura-vida': { en: 'Costa Rica: Pura Vida', es: 'Costa Rica: Pura Vida' },
  'around-the-world': { en: 'Around the World', es: 'Por el mundo' },
  'pop-culture': { en: 'Movies, Music & Pop Culture', es: 'Cine, música y cultura pop' },
  'food-and-drinks': { en: 'Food, Drinks & Delicious Nonsense', es: 'Comidas, bebidas y disparates deliciosos' },
}

export default function MarketplaceLoadingTrivia({ language, theme }: Props) {
  const [questionIndex, setQuestionIndex] = useState<number | null>(null)
const [showAnswer, setShowAnswer] = useState(false)

useEffect(() => {
  setQuestionIndex(Math.floor(Math.random() * triviaQuestions.length))

  const timeout = window.setTimeout(() => {
    setShowAnswer(true)
  }, 1000)

  return () => window.clearTimeout(timeout)
}, [])

  if (questionIndex === null) return null

const question = triviaQuestions[questionIndex]
if (!question) return null

  const content = question[language]
  const dark = theme === 'dark'

  return (
    <div
      aria-live="polite"
      style={{
        width: '100%',
        minHeight: 210,
        boxSizing: 'border-box',
        padding: '28px 24px',
        borderRadius: 22,
        border: dark ? '1px solid #292929' : '1px solid #e5e5e5',
        background: dark ? '#181818' : '#fff',
        color: dark ? '#fff' : '#111',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: dark ? '#aaa' : '#666',
          marginBottom: 14,
        }}
      >
        {categoryLabels[question.category][language]}
      </div>

      <div style={{ fontSize: 20, fontWeight: 700, lineHeight: 1.4 }}>
        {content.question}
      </div>

      <div style={{ minHeight: 80, marginTop: 16 }}>
        {showAnswer && (
          <>
            <div style={{ fontSize: 18, fontWeight: 700 }}>
              {content.answer}
            </div>
            <div
              style={{
                marginTop: 8,
                fontSize: 14,
                lineHeight: 1.5,
                color: dark ? '#bbb' : '#555',
              }}
            >
              {content.comment}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
