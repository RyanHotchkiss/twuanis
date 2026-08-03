'use client'

import Link from 'next/link'
import {
  useEffect,
  useMemo,
  useState
} from 'react'

import {
  deleteSavedAnalysis,
  duplicateSavedAnalysis,
  getSavedAnalyses,
  renameSavedAnalysis
} from '@/lib/saved-analyses'

type Props = {
  language: 'en' | 'es'
}

type SavedAnalysis = {
  id: string
  name: string
  engine_type: string
  updated_at?: string
}

export default function MarketHubSavedAnalyses({
  language
}: Props) {
  const spanish =
    language === 'es'

  const [
    analyses,
    setAnalyses
  ] = useState<SavedAnalysis[]>([])

  const [
    loading,
    setLoading
  ] = useState(true)

  const [
    busyId,
    setBusyId
  ] = useState<string | null>(null)

  const [
    error,
    setError
  ] = useState('')

  async function loadAnalyses() {
    try {
      setLoading(true)
      setError('')

      const data =
        await getSavedAnalyses()

      setAnalyses(
        (data ?? []) as SavedAnalysis[]
      )
    } catch (loadError) {
      console.error(
        'LOAD SAVED ANALYSES ERROR:',
        loadError
      )

      setError(
        spanish
          ? 'No se pudieron cargar los análisis.'
          : 'Unable to load saved analyses.'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAnalyses()
  }, [])

  async function handleRename(
    analysis: SavedAnalysis
  ) {
    const nextName =
      window.prompt(
        spanish
          ? 'Nuevo nombre del análisis'
          : 'New analysis name',
        analysis.name
      )

    const trimmedName =
      nextName?.trim()

    if (
      !trimmedName ||
      trimmedName === analysis.name
    ) {
      return
    }

    try {
      setBusyId(analysis.id)
      setError('')

      const updated =
        await renameSavedAnalysis(
          analysis.id,
          trimmedName
        )

      setAnalyses(current =>
        current.map(item =>
          item.id === analysis.id
            ? {
                ...item,
                ...updated
              }
            : item
        )
      )
    } catch (renameError) {
      console.error(
        'RENAME SAVED ANALYSIS ERROR:',
        renameError
      )

      setError(
        spanish
          ? 'No se pudo cambiar el nombre.'
          : 'Unable to rename the analysis.'
      )
    } finally {
      setBusyId(null)
    }
  }

  async function handleDuplicate(
    analysis: SavedAnalysis
  ) {
    try {
      setBusyId(analysis.id)
      setError('')

      const duplicate =
        await duplicateSavedAnalysis(
          analysis.id
        )

      setAnalyses(current => [
        duplicate,
        ...current
      ])
    } catch (duplicateError) {
      console.error(
        'DUPLICATE SAVED ANALYSIS ERROR:',
        duplicateError
      )

      setError(
        spanish
          ? 'No se pudo duplicar el análisis.'
          : 'Unable to duplicate the analysis.'
      )
    } finally {
      setBusyId(null)
    }
  }

  async function handleDelete(
    analysis: SavedAnalysis
  ) {
    const confirmed =
      window.confirm(
        spanish
          ? `¿Eliminar "${analysis.name}"?`
          : `Delete "${analysis.name}"?`
      )

    if (!confirmed) {
      return
    }

    try {
      setBusyId(analysis.id)
      setError('')

      await deleteSavedAnalysis(
        analysis.id
      )

      setAnalyses(current =>
        current.filter(
          item =>
            item.id !== analysis.id
        )
      )
    } catch (deleteError) {
      console.error(
        'DELETE SAVED ANALYSIS ERROR:',
        deleteError
      )

      setError(
        spanish
          ? 'No se pudo eliminar el análisis.'
          : 'Unable to delete the analysis.'
      )
    } finally {
      setBusyId(null)
    }
  }

  const visibleAnalyses =
    useMemo(
      () => analyses,
      [analyses]
    )

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
              ? 'Reabre y administra tus análisis de mercado guardados.'
              : 'Reopen and manage your saved market analyses.'}
          </p>
        </div>
      </header>

      {error && (
        <div style={errorMessage}>
          {error}
        </div>
      )}

      {loading && (
        <div style={empty}>
          {spanish
            ? 'Cargando análisis...'
            : 'Loading analyses...'}
        </div>
      )}

      {!loading && (
        <div style={grid}>
          {visibleAnalyses.map(
            analysis => {
              const busy =
                busyId === analysis.id

              return (
                <article
                  key={analysis.id}
                  style={card}
                >
                  <div style={cardTop}>
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
                    </div>
                  </div>

                  <Link
                    href={
                      language === 'es'
                        ? `/es/analisis-guardado/${analysis.id}`
                        : `/en/saved-analysis/${analysis.id}`
                    }
                    style={openLink}
                  >
                    {spanish
                      ? 'Abrir análisis →'
                      : 'Open Analysis →'}
                  </Link>

                  <div style={actions}>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        handleRename(
                          analysis
                        )
                      }
                      style={actionButton}
                    >
                      {spanish
                        ? 'Renombrar'
                        : 'Rename'}
                    </button>

                    <button
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        handleDuplicate(
                          analysis
                        )
                      }
                      style={actionButton}
                    >
                      {spanish
                        ? 'Duplicar'
                        : 'Duplicate'}
                    </button>

                    <button
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        handleDelete(
                          analysis
                        )
                      }
                      style={deleteButton}
                    >
                      {busy
                        ? (
                            spanish
                              ? 'Procesando...'
                              : 'Working...'
                          )
                        : (
                            spanish
                              ? 'Eliminar'
                              : 'Delete'
                          )}
                    </button>
                  </div>
                </article>
              )
            }
          )}

          {visibleAnalyses.length ===
            0 && (
            <div style={empty}>
              {spanish
                ? 'Todavía no has guardado ningún análisis.'
                : 'You have not saved any analyses yet.'}
            </div>
          )}
        </div>
      )}
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

const errorMessage = {
  marginBottom: '1rem',
  padding: '1rem',
  border: '1px solid #5a2020',
  borderRadius: '12px',
  background: '#261010',
  color: '#ffb4b4'
}

const grid = {
  display: 'grid',
  gridTemplateColumns:
    'repeat(auto-fit,minmax(280px,1fr))',
  gap: '1rem'
}

const card = {
  display: 'flex',
  flexDirection: 'column' as const,
  minHeight: '220px',
  gap: '1rem',
  padding: '1.1rem',
  border: '1px solid #292929',
  borderRadius: '14px',
  background: '#0b0b0b'
}

const cardTop = {
  display: 'flex',
  gap: '1rem'
}

const iconWrap = {
  width: '46px',
  height: '46px',
  flexShrink: 0,
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

const openLink = {
  color: '#ddd',
  fontWeight: 700,
  textDecoration: 'none'
}

const actions = {
  display: 'flex',
  flexWrap: 'wrap' as const,
  gap: '.6rem',
  marginTop: 'auto',
  paddingTop: '1rem',
  borderTop: '1px solid #222'
}

const actionButton = {
  padding: '.55rem .8rem',
  border: '1px solid #333',
  borderRadius: '999px',
  background: '#171717',
  color: '#ddd',
  cursor: 'pointer'
}

const deleteButton = {
  ...actionButton,
  border: '1px solid #5a2020',
  color: '#ff8f8f'
}

const empty = {
  color: '#777',
  padding: '2rem'
}