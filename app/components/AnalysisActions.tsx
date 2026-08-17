'use client'

import Link from 'next/link'
import {
  useState
} from 'react'

import {
  getSavedAnalysesByEngine,
  saveAnalysis,
  updateSavedAnalysis,
  type SavedAnalysisEngine,
  type SavedAnalysisLanguage
} from '@/lib/saved-analyses'

type Props = {
  engineType: SavedAnalysisEngine
  language: SavedAnalysisLanguage
  filters: unknown
  result: unknown
  defaultName: string
}

type SavedAnalysis = {
  id: string
  name: string
  engine_type: string
  updated_at?: string
}

export default function AnalysisActions({
  engineType,
  language,
  filters,
  result,
  defaultName
}: Props) {
  const spanish =
    language === 'es'

  const [
    currentSavedId,
    setCurrentSavedId
  ] = useState<string | null>(null)

  const [
    currentName,
    setCurrentName
  ] = useState(defaultName)

  const [
    savedAnalyses,
    setSavedAnalyses
  ] = useState<SavedAnalysis[]>([])

  const [
    showSaved,
    setShowSaved
  ] = useState(false)

  const [
    busy,
    setBusy
  ] = useState(false)

  const [
    loadingSaved,
    setLoadingSaved
  ] = useState(false)

  const [
    message,
    setMessage
  ] = useState('')

  const [
    error,
    setError
  ] = useState('')

  function clearStatus() {
    setMessage('')
    setError('')
  }

  async function handleSave() {
    clearStatus()

    try {
      setBusy(true)

      if (currentSavedId) {
        const updated =
          await updateSavedAnalysis(
            currentSavedId,
            {
              name: currentName
            }
          )

        setCurrentName(
          updated.name ?? currentName
        )

        setMessage(
          spanish
            ? 'Nombre del análisis actualizado.'
            : 'Analysis name updated.'
        )

        return
      }

      const requestedName =
        window.prompt(
          spanish
            ? 'Nombre del análisis'
            : 'Analysis name',
          currentName
        )

      const name =
        requestedName?.trim()

      if (!name) {
        return
      }

      const saved =
        await saveAnalysis({
          engineType,
          language,
          name,
          filters,
          result
        })

      setCurrentSavedId(saved.id)
      setCurrentName(saved.name)

      setMessage(
        spanish
          ? 'Análisis guardado.'
          : 'Analysis saved.'
      )
    } catch (saveError) {
      console.error(
        'SAVE ANALYSIS ERROR:',
        saveError
      )

      setError(
        spanish
          ? 'No se pudo guardar el análisis.'
          : 'Unable to save the analysis.'
      )
    } finally {
      setBusy(false)
    }
  }

  async function handleSaveAs() {
    clearStatus()

    const requestedName =
      window.prompt(
        spanish
          ? 'Guardar análisis como'
          : 'Save analysis as',
        currentName
      )

    const name =
      requestedName?.trim()

    if (!name) {
      return
    }

    try {
      setBusy(true)

      const saved =
        await saveAnalysis({
          engineType,
          language,
          name,
          filters,
          result
        })

      setCurrentSavedId(saved.id)
      setCurrentName(saved.name)

      setMessage(
        spanish
          ? 'Nueva copia guardada.'
          : 'New copy saved.'
      )
    } catch (saveError) {
      console.error(
        'SAVE ANALYSIS AS ERROR:',
        saveError
      )

      setError(
        spanish
          ? 'No se pudo guardar la copia.'
          : 'Unable to save the copy.'
      )
    } finally {
      setBusy(false)
    }
  }

  async function handleOpenSaved() {
    clearStatus()

    if (showSaved) {
      setShowSaved(false)
      return
    }

    try {
      setLoadingSaved(true)

      const data =
        await getSavedAnalysesByEngine(
          engineType
        )

      setSavedAnalyses(
        (data ?? []) as SavedAnalysis[]
      )

      setShowSaved(true)
    } catch (loadError) {
      console.error(
        'LOAD SAVED ANALYSES ERROR:',
        loadError
      )

      setError(
        spanish
          ? 'No se pudieron cargar los análisis guardados.'
          : 'Unable to load saved analyses.'
      )
    } finally {
      setLoadingSaved(false)
    }
  }

  return (
    <section style={container}>
      <div style={toolbar}>
        <div>
          <p style={eyebrow}>
            {spanish
              ? 'Análisis actual'
              : 'Current Analysis'}
          </p>

          <p style={analysisName}>
            {currentName}
          </p>
        </div>

        <div style={actions}>
          <button
            type="button"
            onClick={handleSave}
            disabled={busy}
            style={primaryButton}
          >
            {busy
              ? (
                  spanish
                    ? 'Guardando...'
                    : 'Saving...'
                )
              : currentSavedId
                ? (
                    spanish
                      ? 'Guardar cambios'
                      : 'Save Changes'
                  )
                : (
                    spanish
                      ? 'Guardar análisis'
                      : 'Save Analysis'
                  )}
          </button>

          <button
            type="button"
            onClick={handleSaveAs}
            disabled={busy}
            style={secondaryButton}
          >
            {spanish
              ? 'Guardar como...'
              : 'Save As...'}
          </button>

          <button
            type="button"
            onClick={handleOpenSaved}
            disabled={loadingSaved}
            style={secondaryButton}
          >
            {loadingSaved
              ? (
                  spanish
                    ? 'Cargando...'
                    : 'Loading...'
                )
              : (
                  spanish
                    ? 'Abrir guardados'
                    : 'Open Saved'
                )}
          </button>
        </div>
      </div>

      {message && (
        <div style={successMessage}>
          {message}
        </div>
      )}

      {error && (
        <div style={errorMessage}>
          {error}
        </div>
      )}

      {showSaved && (
        <div style={savedPanel}>
          <div style={savedHeader}>
            <h3 style={savedHeading}>
              {spanish
                ? 'Análisis guardados'
                : 'Saved Analyses'}
            </h3>

            <button
              type="button"
              onClick={() =>
                setShowSaved(false)
              }
              style={closeButton}
              aria-label={
                spanish
                  ? 'Cerrar'
                  : 'Close'
              }
            >
              ×
            </button>
          </div>

          {savedAnalyses.length > 0 ? (
            <div style={savedList}>
              {savedAnalyses.map(
                analysis => (
                  <Link
                    key={analysis.id}
                    href={
                      spanish
                        ? `/es/analisis-guardado/${analysis.id}`
                        : `/en/saved-analysis/${analysis.id}`
                    }
                    style={savedLink}
                  >
                    <span style={savedName}>
                      {analysis.name}
                    </span>

                    <span style={openLabel}>
                      {spanish
                        ? 'Abrir →'
                        : 'Open →'}
                    </span>
                  </Link>
                )
              )}
            </div>
          ) : (
            <p style={emptyMessage}>
              {spanish
                ? 'No hay análisis guardados para este motor.'
                : 'There are no saved analyses for this engine.'}
            </p>
          )}
        </div>
      )}
    </section>
  )
}

const container = {
  width: '100%',
  marginBottom: '2rem',
  padding: '1rem',
  border: '1px solid #262626',
  borderRadius: '14px',
  background: '#111'
}

const toolbar = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  flexWrap: 'wrap' as const,
  gap: '1rem'
}

const eyebrow = {
  margin: '0 0 .3rem',
  color: '#777',
  fontSize: '.72rem',
  fontWeight: 700,
  letterSpacing: '.1em',
  textTransform: 'uppercase' as const
}

const analysisName = {
  margin: 0,
  color: '#fff',
  fontSize: '1rem',
  fontWeight: 700
}

const actions = {
  display: 'flex',
  flexWrap: 'wrap' as const,
  gap: '.65rem'
}

const baseButton = {
  padding: '.7rem 1rem',
  borderRadius: '999px',
  fontWeight: 700,
  cursor: 'pointer'
}

const primaryButton = {
  ...baseButton,
  border: '1px solid #ff3b00',
  background: '#ff3b00',
  color: '#fff'
}

const secondaryButton = {
  ...baseButton,
  border: '1px solid #333',
  background: '#171717',
  color: '#ddd'
}

const successMessage = {
  marginTop: '1rem',
  padding: '.8rem 1rem',
  border: '1px solid #28543a',
  borderRadius: '10px',
  background: '#102419',
  color: '#9fe0b7'
}

const errorMessage = {
  marginTop: '1rem',
  padding: '.8rem 1rem',
  border: '1px solid #5a2020',
  borderRadius: '10px',
  background: '#261010',
  color: '#ffb4b4'
}

const savedPanel = {
  marginTop: '1rem',
  paddingTop: '1rem',
  borderTop: '1px solid #262626'
}

const savedHeader = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '1rem',
  marginBottom: '.75rem'
}

const savedHeading = {
  margin: 0,
  color: '#fff',
  fontSize: '1rem'
}

const closeButton = {
  width: '34px',
  height: '34px',
  border: '1px solid #333',
  borderRadius: '999px',
  background: '#171717',
  color: '#ddd',
  cursor: 'pointer',
  fontSize: '1.25rem'
}

const savedList = {
  display: 'grid',
  gap: '.65rem'
}

const savedLink = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '1rem',
  padding: '.85rem 1rem',
  border: '1px solid #292929',
  borderRadius: '10px',
  background: '#0b0b0b',
  textDecoration: 'none'
}

const savedName = {
  color: '#fff',
  fontWeight: 700
}

const openLabel = {
  color: '#aaa',
  whiteSpace: 'nowrap' as const
}

const emptyMessage = {
  margin: 0,
  padding: '1rem',
  color: '#777'
}