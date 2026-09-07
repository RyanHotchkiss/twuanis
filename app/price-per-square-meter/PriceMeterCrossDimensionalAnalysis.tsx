'use client'

import {
  useState
} from 'react'

import {
  getPriceMeterCrossDimensionalQuestion,
  type PriceMeterCrossDimensionalQuestionKey
} from '@/lib/price-meter-cross-dimensional-question'

import PriceMeterCrossDimensionalResults
  from './PriceMeterCrossDimensionalResults'

import type {
  PriceMeterCrossDimensionalEvidenceSet
} from '@/lib/price-meter-cross-dimensional-evidence'

type CrossDimensionalOption = {
  questionKey:
    PriceMeterCrossDimensionalQuestionKey

  label:
    string
}


type PriceMeterCrossDimensionalCohortKey =
  | 'vacantLandLandNormalized'
  | 'improvedLandNormalized'
  | 'improvedConstructionNormalized'


type PriceMeterCrossDimensionalResponse = {
  question:
    ReturnType<
      typeof getPriceMeterCrossDimensionalQuestion
    >

  identity:
    unknown

  evidence:
    PriceMeterCrossDimensionalEvidenceSet
}


type Props = {
  options:
    readonly CrossDimensionalOption[]

  filters:
    Record<
      string,
      string | undefined
    >

  cohortKey?:
    PriceMeterCrossDimensionalCohortKey

  onResult?:
    (
      result:
        PriceMeterCrossDimensionalResponse
    ) => void

  onCollapse?:
    () => void

  children?:
    (
      result:
        PriceMeterCrossDimensionalResponse
    ) =>
      React.ReactNode
}


export default function PriceMeterCrossDimensionalAnalysis({
  options,
  filters,
  cohortKey,
  onResult,
  onCollapse,
  children
}: Props) {

  const [
    activeQuestionKey,
    setActiveQuestionKey
  ] =
    useState<
      PriceMeterCrossDimensionalQuestionKey |
      null
    >(
      null
    )


  const [
    result,
    setResult
  ] =
    useState<
      PriceMeterCrossDimensionalResponse |
      null
    >(
      null
    )


  const [
    loading,
    setLoading
  ] =
    useState(
      false
    )


  const [
    error,
    setError
  ] =
    useState<
      string |
      null
    >(
      null
    )


  async function handleSelection(
    questionKey:
      PriceMeterCrossDimensionalQuestionKey
  ) {

    /*
     * Clicking the active question again collapses the
     * Cross-Dimensional analysis.
     *
     * No replacement request is executed.
     */

    if (
      activeQuestionKey ===
        questionKey
    ) {
      setActiveQuestionKey(
        null
      )

      setResult(
        null
      )

      setError(
        null
      )

      setLoading(
        false
      )

      onCollapse?.()

      return
    }


    /*
     * -----------------------------------------------------
     * CLIENT-SIDE QUESTION AUTHORIZATION
     * -----------------------------------------------------
     *
     * The canonical server boundary performs its own
     * authorization again.
     *
     * This lookup prevents the interface from initiating a
     * request for a question outside the canonical matrix.
     */

    getPriceMeterCrossDimensionalQuestion(
      questionKey
    )


    /*
     * Selecting another question replaces the currently
     * displayed analysis.
     */

    setActiveQuestionKey(
      questionKey
    )

    setResult(
      null
    )

    setError(
      null
    )

    setLoading(
      true
    )


    try {

      /*
       * ---------------------------------------------------
       * PHASE 11 COMPUTATIONAL FIREWALL
       * ---------------------------------------------------
       *
       * This POST is the first Phase 11 analytical work
       * triggered by the interface.
       *
       * No request occurs during render.
       *
       * One click sends:
       *
       * - one authorized question
       * - the existing bounded market filters
       * - one exact owning analytical cohort where required
       */

      const response =
        await fetch(
          '/api/price-meter/cross-dimensional',
          {
            method:
              'POST',

            headers: {
              'Content-Type':
                'application/json'
            },

            body:
              JSON.stringify({
                questionKey,
                filters,
                cohortKey
              })
          }
        )


      const payload =
        await response.json()


      /*
       * Ignore a response belonging to a question that is
       * no longer active.
       *
       * This protects the presentation when users switch
       * dimensions before an earlier request completes.
       */

      if (
        activeQuestionKey !==
          null &&
        activeQuestionKey !==
          questionKey
      ) {
        return
      }


      if (
        !response.ok
      ) {
        throw new Error(
          typeof payload?.error ===
            'string'
            ? payload.error
            : 'Cross-Dimensional analysis failed.'
        )
      }


      const nextResult =
        payload as
          PriceMeterCrossDimensionalResponse


      setResult(
        nextResult
      )


      onResult?.(
        nextResult
      )
    }
    catch (
      caughtError
    ) {

      setResult(
        null
      )


      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Cross-Dimensional analysis failed.'
      )
    }
    finally {
      setLoading(
        false
      )
    }
  }


  return (
    <section style={container}>
      <div style={header}>
        <h3 style={title}>
          Cross-Dimensional Analysis
        </h3>

        <p style={description}>
          Examine this Price / m² relationship
          across one additional market dimension.
        </p>
      </div>


      <div style={selectorLabel}>
        Analyze across:
      </div>


      <div style={buttonGroup}>
        {options.map(
          option => {

            const active =
              activeQuestionKey ===
                option.questionKey


            return (
              <button
                key={
                  option.questionKey
                }
                type="button"
                aria-pressed={
                  active
                }
                disabled={
                  loading &&
                  !active
                }
                onClick={
                  () =>
                    handleSelection(
                      option.questionKey
                    )
                }
                style={{
                  ...selectorButton,

                  ...(active
                    ? activeSelectorButton
                    : {}),

                  ...(loading &&
                  !active
                    ? disabledSelectorButton
                    : {})
                }}
              >
                {option.label}
              </button>
            )
          }
        )}
      </div>


      {activeQuestionKey !==
        null && (
        <div style={analysisContainer}>

          {loading && (
            <div style={statusText}>
              Calculating Cross-Dimensional evidence…
            </div>
          )}


          {!loading &&
            error && (
            <div style={errorText}>
              {error}
            </div>
          )}


                    {!loading &&
            !error &&
            result && (
            <>
              <PriceMeterCrossDimensionalResults
                question={
                  result.question
                }
                evidence={
                  result.evidence
                }
              />

              {children?.(
                result
              )}
            </>
          )}

        </div>
      )}
    </section>
  )
}


const container = {
  marginTop:
    '2rem',

  padding:
    '1.25rem',

  background:
    '#111',

  border:
    '1px solid #222',

  borderRadius:
    '1rem'
}


const header = {
  marginBottom:
    '1.25rem'
}


const title = {
  margin:
    0,

  fontSize:
    '1.15rem'
}


const description = {
  margin:
    '.45rem 0 0',

  maxWidth:
    '680px',

  color:
    '#888',

  fontSize:
    '.9rem',

  lineHeight:
    1.6
}


const selectorLabel = {
  marginBottom:
    '.75rem',

  color:
    '#aaa',

  fontSize:
    '.85rem',

  fontWeight:
    600
}


const buttonGroup = {
  display:
    'flex',

  gap:
    '.75rem',

  flexWrap:
    'wrap' as const
}


const selectorButton = {
  appearance:
    'none' as const,

  padding:
    '.7rem 1rem',

  background:
    '#161616',

  border:
    '1px solid #333',

  borderRadius:
    '.65rem',

  color:
    '#ccc',

  fontSize:
    '.88rem',

  fontWeight:
    600,

  cursor:
    'pointer'
}


const activeSelectorButton = {
  border:
    '1px solid #ff3b00',

  color:
    '#ff3b00'
}


const disabledSelectorButton = {
  opacity:
    0.45,

  cursor:
    'not-allowed'
}


const analysisContainer = {
  marginTop:
    '1.5rem',

  paddingTop:
    '1.5rem',

  borderTop:
    '1px solid #222'
}


const statusText = {
  color:
    '#888',

  fontSize:
    '.9rem'
}


const errorText = {
  color:
    '#ff6b4a',

  fontSize:
    '.9rem',

  lineHeight:
    1.6
}