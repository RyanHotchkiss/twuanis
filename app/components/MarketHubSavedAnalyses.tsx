'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { getSavedAnalyses } from '@/lib/saved-analyses'

type Props = {
  language: 'en' | 'es'
}

export default function MarketHubSavedAnalyses({
  language
}: Props) {
  const spanish =
    language === 'es'

  const [
    analyses,
    setAnalyses
  ] = useState<any[]>([])

  useEffect(() => {
    getSavedAnalyses().then(
      setAnalyses
    )
  }, [])

  return (
    <section style={section}>
      <header style={header}>
        <div>
          <p style={eyebrow}>
            {spanish
              ? 'Análisis Guardados'
              : 'Saved Analyses'}
          </p>

          <h2 style={heading}>
            {spanish
              ? 'Tus Análisis'
              : 'Your Analyses'}
          </h2>

          <p style={description}>
            {spanish
              ? 'Reabre cualquier análisis de mercado previamente guardado.'
              : 'Reopen any previously saved market analysis.'}
          </p>
        </div>
      </header>

      <div style={grid}>
        {analyses.map(
          analysis => (
            <Link
              key={analysis.id}
              href={
                language === 'es'
                  ? `/es/analisis-guardado/${analysis.id}`
                  : `/en/saved-analysis/${analysis.id}`
              }
              style={card}
            >
              <div style={iconWrap}>
                📊
              </div>

              <div style={cardContent}>
                <h3 style={cardTitle}>
                  {analysis.name}
                </h3>

                <p style={cardDescription}>
                  {analysis.engine_type}
                </p>

                <span style={action}>
                  {spanish
                    ? 'Abrir análisis →'
                    : 'Open Analysis →'}
                </span>
              </div>
            </Link>
          )
        )}

        {analyses.length === 0 && (
          <div style={empty}>
            {spanish
              ? 'Todavía no has guardado ningún análisis.'
              : 'You have not saved any analyses yet.'}
          </div>
        )}
      </div>
    </section>
  )
}

const section = {
  width: '100%',
  maxWidth: '1200px',
  margin: '0 auto',
  padding: '1.5rem',
  border: '1px solid #262626',
  borderRadius: '18px',
  background: '#111'
}

const header = {
  display: 'flex',
  marginBottom: '1.25rem'
}

const eyebrow = {
  margin: '0 0 .45rem',
  color: '#777',
  fontSize: '.72rem',
  fontWeight: 700,
  letterSpacing: '.12em',
  textTransform: 'uppercase' as const
}

const heading = {
  margin: 0,
  color: '#fff',
  fontSize: '1.5rem'
}

const description = {
  margin: '.65rem 0 0',
  color: '#999',
  lineHeight: 1.6
}

const grid = {
  display: 'grid',
  gridTemplateColumns:
    'repeat(auto-fit,minmax(250px,1fr))',
  gap: '1rem'
}

const card = {
  display: 'flex',
  minHeight: '180px',
  gap: '1rem',
  padding: '1.1rem',
  border: '1px solid #292929',
  borderRadius: '14px',
  background: '#0b0b0b',
  color: 'inherit',
  textDecoration: 'none'
}

const iconWrap = {
  width: '46px',
  height: '46px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: '1px solid #303030',
  borderRadius: '12px',
  background: '#171717',
  fontSize: '22px'
}

const cardContent = {
  display: 'flex',
  flexDirection: 'column' as const,
  flex: 1
}

const cardTitle = {
  margin: 0,
  color: '#fff',
  fontSize: '1.05rem'
}

const cardDescription = {
  margin: '.65rem 0 0',
  color: '#888',
  fontSize: '.9rem'
}

const action = {
  marginTop: 'auto',
  paddingTop: '1rem',
  color: '#ddd',
  fontWeight: 700
}

const empty = {
  color: '#777',
  padding: '2rem'
}