import type { Metadata } from 'next'
export const metadata: Metadata = { robots: { index: false, follow: false } }
import TopBar from '@/app/components/TopBar'
import OrchestratorHub from '@/app/components/OrchestratorHub'

export default function OrchestratorsPage() {
  return (
    <main className="mobile-page-fit" style={main}>
      <TopBar mobileFit />
      <section style={hero}><h1 style={heading}>Área de trabajo de los orquestadores</h1></section>
      <OrchestratorHub language="es" />
    </main>
  )
}

const main = {
  minHeight:
    '100vh',
  padding:
    'clamp(1rem, 3vw, 2rem)',

  backgroundColor:
    'var(--background)',

  backgroundImage:
    'var(--ih-background-image)',

  backgroundSize:
    'cover',

  backgroundPosition:
    'center top',

  backgroundRepeat:
    'no-repeat',

  backgroundAttachment:
    'fixed',

  color:
    'var(--foreground)'
}


const hero = {
  textAlign:
    'center' as const,

  marginBottom:
    '2rem'
}


const heading = {
  fontSize:
    'clamp(1.6rem, 4vw, 3rem)',

  marginBottom:
    '.75rem'
}


