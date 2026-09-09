export type PriceMeterConfidenceLanguage =
  | 'en'
  | 'es'


export type PriceMeterConfidenceScore =
  90 | 75 | 60 | 35


export type PriceMeterConfidence = {
  score:
    PriceMeterConfidenceScore

  label:
    string
}


/*
 * ---------------------------------------------------------
 * CANONICAL CONFIDENCE SCORE
 * ---------------------------------------------------------
 *
 * Confidence describes Twuanis's confidence in the
 * analytical result.
 *
 * It does not classify:
 *
 * - the property
 * - the market
 * - the Price / m² position
 *
 * Phase 12 preserves this score as canonical analytical
 * evidence without introducing presentation language.
 */

export function getPriceMeterConfidenceScore(
  sampleSize:
    number
): PriceMeterConfidenceScore {

  if (
    !Number.isInteger(sampleSize) ||
    sampleSize < 0
  ) {
    throw new Error(
      'Price / m² confidence requires a non-negative integer sample size.'
    )
  }


  if (sampleSize >= 25) {
    return 90
  }


  if (sampleSize >= 15) {
    return 75
  }


  if (sampleSize >= 8) {
    return 60
  }


  return 35
}


/*
 * ---------------------------------------------------------
 * LOCALIZED CONFIDENCE PRESENTATION
 * ---------------------------------------------------------
 *
 * Presentation language is resolved separately from the
 * canonical confidence score.
 */

export function getPriceMeterConfidence(
  sampleSize:
    number,

  language:
    PriceMeterConfidenceLanguage
): PriceMeterConfidence {

  const score =
    getPriceMeterConfidenceScore(
      sampleSize
    )


  if (score === 90) {
    return {
      score,

      label:
        language === 'es'
          ? 'Confianza Alta'
          : 'High Confidence'
    }
  }


  if (score === 75) {
    return {
      score,

      label:
        language === 'es'
          ? 'Confianza Moderada'
          : 'Moderate Confidence'
    }
  }


  if (score === 60) {
    return {
      score,

      label:
        language === 'es'
          ? 'Confianza Baja'
          : 'Low Confidence'
    }
  }


  return {
    score,

    label:
      language === 'es'
        ? 'Confianza Muy Baja'
        : 'Very Low Confidence'
  }
}