import TopBarES from '@/app/components/TopBarES'

import PaquetesInteligenciaMercado from './PaquetesInteligenciaMercado'

export default function PaquetesInteligenciaMercadoPage() {
  return (
    <main style={main}>
      <TopBarES />
      <PaquetesInteligenciaMercado />
    </main>
  )
}

const main = {
  minHeight: '100vh',
  padding: '2rem',
  background: '#0a0a0a',
  color: '#ededed'
}