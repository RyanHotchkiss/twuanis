'use client'

import {
  useEffect,
  useState
} from 'react'

import { useRouter } from 'next/navigation'

import type {
  User
} from '@supabase/supabase-js'

import { supabase } from '@/lib/supabase'

import {CommercialCatalog} from './CustomerCommercial'
import EmailAuthModal from '@/app/components/EmailAuthModal'

type AuthenticatedListingPublisherProps = {
  token: string
}

type PublishResponse = {
  prepared?: boolean
  success: boolean
  redirectTo?: string
  error?: string
  listingId?: string
  mediaStatus?: string
  warning?: string
}

export default function AuthenticatedListingPublisher({
  token
}: AuthenticatedListingPublisherProps) {
  const router = useRouter()
  const [stage,setStage]=useState<'prepare'|'choice'|'publish'>('prepare')
  const language=typeof window!=='undefined'&&new URLSearchParams(window.location.search).get('lang')==='es'?'es':'en'
  const [attempt, setAttempt] = useState(0)
  const [draftId, setDraftId] = useState<string | null>(null)

  const [user, setUser] =
    useState<User | null>(null)

  const [checkingAuth, setCheckingAuth] =
    useState(true)

  const [publishing, setPublishing] =
    useState(false)

  const [errorMessage, setErrorMessage] =
    useState('')

  useEffect(() => {
    let mounted = true

    async function loadUser() {
      const {
        data: {
          user
        },
        error
      } = await supabase.auth.getUser()

      if (!mounted) {
        return
      }

      if (error) {
        console.error(
          'AUTH USER ERROR:',
          error
        )
      }

      setUser(user ?? null)
      setCheckingAuth(false)
    }

    loadUser()

    const {
      data: {
        subscription
      }
    } =
      supabase.auth.onAuthStateChange(
        (_event, session) => {
          if (!mounted) {
            return
          }

          setUser(
            session?.user ?? null
          )

          setCheckingAuth(false)
        }
      )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (
      stage==='choice' || checkingAuth ||
      !user ||
      publishing || errorMessage
    ) {
      return
    }

    let cancelled = false

    async function publishListing() {
      try {
        setPublishing(true)
        setErrorMessage('')

        const {
          data: {
            session
          },
          error: sessionError
        } =
          await supabase.auth.getSession()

        if (
          sessionError ||
          !session
        ) {
          throw new Error(
            'Your session could not be verified.'
          )
        }

        const response =
          await fetch(
            '/api/publish-listing',
            {
              method: 'POST',
              headers: {
                'Content-Type':
                  'application/json',
                Authorization:
                  `Bearer ${session.access_token}`
              },
              body: JSON.stringify({
                token, phase:stage
              })
            }
          )

        const data =
          await response.json() as PublishResponse

        if (data.listingId) setDraftId(data.listingId)

        if (
          !response.ok ||
          !data.success
        ) {
          throw new Error(
            data.error ||
            'Your listing could not be published.'
          )
        }

        if (cancelled) {
          return
        }

        if(data.prepared){setStage('choice');setPublishing(false);return}

        if (!data.redirectTo) {
          throw new Error(
            'The listing was published, but no redirect destination was returned.'
          )
        }

        router.replace(
          data.redirectTo
        )

        router.refresh()
      } catch (error) {
        console.error(
          'PUBLISH LISTING ERROR:',
          error
        )

        if (!cancelled) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : 'Your listing could not be published.'
          )

          setPublishing(false)
        }
      }
    }

    publishListing()

    return () => {
      cancelled = true
    }
  }, [
    checkingAuth,
    stage,
    attempt,
    router,
    token,
    user
  ])

  if(stage==='choice'&&draftId)return <section><CommercialCatalog language={language} listing={draftId}/><button onClick={()=>{setStage('publish');setErrorMessage('');setPublishing(false)}}>{language==='es'?'Continuar a la publicación — sin comprar o pagar':'Continue to publication — no purchase or payment required'}</button></section>

  if (checkingAuth) {
    return (
      <main style={page}>
        <div style={card}>
          <h1 style={heading}>
            {language==='es'?'Verificando su cuenta':'Verifying your account'}
          </h1>

          <p style={message}>
            {language==='es'?'Espere mientras verificamos su inicio de sesión.':'Please wait while we verify your secure sign-in.'}
          </p>
        </div>
      </main>
    )
  }

  if (!user) {
    return (
      <EmailAuthModal
        redirectTo={
          `/publish-listing/${token}?lang=${language}`
        }
      />
    )
  }

  if (errorMessage) {
    return (
      <main style={page}>
        <div style={card}>
          <h1 style={heading}>
            {language==='es'?'Error de publicación':'Publishing error'}
          </h1>

          <p style={errorText}>
            {errorMessage}
            {draftId && <span> Listing ID: {draftId}</span>}
          </p>

          <button
            type="button"
            onClick={() => {
              setErrorMessage('')
              setPublishing(false)
              setAttempt(value => value + 1)
            }}
            style={retryButton}
          >
            {language==='es'?'Reintentar':'Try again'}
          </button>
        </div>
      </main>
    )
  }

  return (
    <main style={page}>
      <div style={card}>
        <h1 style={heading}>
          {language==='es'?'Preparando su anuncio':'Preparing your listing'}
        </h1>

        <p style={message}>
          {language==='es'?'Estamos preparando su anuncio con su identidad verificada.':'We are preparing your listing with your verified identity.'}
        </p>
      </div>
    </main>
  )
}

const page = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '2rem',
  background: '#0a0a0a',
  color: '#fff'
}

const card = {
  width: '100%',
  maxWidth: '34rem',
  padding: '2rem',
  border: '1px solid #222',
  borderRadius: '2rem',
  background: '#111',
  textAlign: 'center' as const
}

const heading = {
  margin: 0,
  color: '#D4AF37',
  fontSize: '2rem'
}

const message = {
  margin: '1rem 0 0',
  color: '#aaa',
  lineHeight: 1.7
}

const errorText = {
  margin: '1rem 0 0',
  color: '#ff8b8b',
  lineHeight: 1.7
}

const retryButton = {
  marginTop: '1.5rem',
  padding: '.9rem 1.5rem',
  border: 'none',
  borderRadius: '999px',
  background: '#D4AF37',
  color: '#000',
  fontWeight: 700,
  cursor: 'pointer'
}