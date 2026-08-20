import Link from 'next/link'
import TopBar from '@/app/components/TopBar'

export default function DeslizarHubPage() {
  return (
    <main style={page}>
      <TopBar />

      <section style={content}>
        <div style={eyebrow}>
          DESLIZAR
        </div>

        <h1 style={title}>
          Encuentre propiedades a su manera.
        </h1>

        <p style={description}>
          Elija el mercado que desea explorar.
        </p>

        <div style={choices}>
          <Link
            href="/es/deslizar/comprar"
            style={choice}
          >
            <span style={choiceTitle}>
              Comprar
            </span>

            <span style={choiceDescription}>
              Deslice entre propiedades en venta.
            </span>
          </Link>

          <Link
            href="/es/deslizar/alquilar"
            style={choice}
          >
            <span style={choiceTitle}>
              Alquilar / Arrendar
            </span>

            <span style={choiceDescription}>
              Deslice entre propiedades disponibles
              para alquiler o arrendamiento.
            </span>
          </Link>
        </div>
      </section>
    </main>
  )
}

const page = {
  minHeight: '100vh',
  background: '#000',
  color: '#fff',
  padding: '2rem'
}

const content = {
  width: '100%',
  maxWidth: '900px',
  margin: '8rem auto 0',
  textAlign: 'center' as const
}

const eyebrow = {
  color: '#D4AF37',
  fontSize: '.8rem',
  fontWeight: 700,
  letterSpacing: '.2em',
  marginBottom: '1rem'
}

const title = {
  margin: 0,
  fontSize: 'clamp(2.4rem, 6vw, 4.5rem)',
  lineHeight: 1.05
}

const description = {
  color: '#999',
  fontSize: '1.1rem',
  margin: '1.25rem 0 3rem'
}

const choices = {
  display: 'grid',
  gridTemplateColumns:
    'repeat(auto-fit, minmax(260px, 1fr))',
  gap: '1rem'
}

const choice = {
  minHeight: '180px',
  border: '1px solid #D4AF3760',
  borderRadius: '24px',
  background: '#111',
  padding: '2rem',
  textDecoration: 'none',
  color: '#fff',
  display: 'flex',
  flexDirection: 'column' as const,
  justifyContent: 'center',
  gap: '.75rem'
}

const choiceTitle = {
  color: '#D4AF37',
  fontSize: '1.6rem',
  fontWeight: 700
}

const choiceDescription = {
  color: '#aaa',
  lineHeight: 1.6
}