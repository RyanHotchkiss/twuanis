import Link from 'next/link'
import TopBar from '@/app/components/TopBar'

export default function SwipeHubPage() {
  return (
    <main style={page}>
      <TopBar />

      <section style={content}>
        <div style={eyebrow}>
          SWIPE
        </div>

        <h1 style={title}>
          Find properties your way.
        </h1>

        <p style={description}>
          Choose the market you want to explore.
        </p>

        <div style={choices}>
          <Link
            href="/en/swipe/buy"
            style={choice}
          >
            <span style={choiceTitle}>
              Buy
            </span>

            <span style={choiceDescription}>
              Swipe through properties for sale.
            </span>
          </Link>

          <Link
            href="/en/swipe/rent-lease"
            style={choice}
          >
            <span style={choiceTitle}>
              Rent / Lease
            </span>

            <span style={choiceDescription}>
              Swipe through properties available
              for rent or lease.
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