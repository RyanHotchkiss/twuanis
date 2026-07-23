import type {
  ReactNode
} from 'react'

import ComparisonTabs from './ComparisonTabs'

import type {
  ComparisonKind,
  ComparisonLanguage
} from '@/lib/comparisons/types'

type ComparisonShellProps = {
  language: ComparisonLanguage
  activeKind: ComparisonKind
  title: string
  description: string
  children: ReactNode
}

export default function ComparisonShell({
  language,
  activeKind,
  title,
  description,
  children
}: ComparisonShellProps) {
  return (
    <section style={shell}>
      <header style={header}>
        <div>
          <p style={eyebrow}>
            {language === 'es'
              ? 'Sistema de Comparaciones'
              : 'Comparison System'}
          </p>

          <h1 style={heading}>
            {title}
          </h1>

          <p style={descriptionStyle}>
            {description}
          </p>
        </div>
      </header>

      <ComparisonTabs
        language={language}
        activeKind={activeKind}
      />

      <div style={content}>
        {children}
      </div>
    </section>
  )
}

const shell = {
  width: '100%',
  maxWidth: '1200px',
  margin: '0 auto',
  padding: '2rem'
}

const header = {
  marginBottom: '1.5rem'
}

const eyebrow = {
  margin: '0 0 0.5rem',
  color: '#888',
  fontSize: '0.75rem',
  fontWeight: 700,
  letterSpacing: '0.12em',
  textTransform: 'uppercase' as const
}

const heading = {
  margin: 0,
  color: '#fff',
  fontSize: 'clamp(2rem, 5vw, 3.5rem)'
}

const descriptionStyle = {
  maxWidth: '760px',
  margin: '0.75rem 0 0',
  color: '#aaa',
  fontSize: '1rem',
  lineHeight: 1.6
}

const content = {
  marginTop: '1.5rem'
}