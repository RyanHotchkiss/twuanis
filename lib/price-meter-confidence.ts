export type PriceMeterConfidenceLanguage =
  | 'en'
  | 'es'


export type PriceMeterConfidence = {
  score:
    number

  label:
    string
}


export function getPriceMeterConfidence(
  sampleSize:
    number,

  language:
    PriceMeterConfidenceLanguage
): PriceMeterConfidence {

  if (sampleSize >= 25) {
    return {
      score: 90,

      label:
        language === 'es'
          ? 'Confianza Alta'
          : 'High Confidence'
    }
  }


  if (sampleSize >= 15) {
    return {
      score: 75,

      label:
        language === 'es'
          ? 'Confianza Moderada'
          : 'Moderate Confidence'
    }
  }


  if (sampleSize >= 8) {
    return {
      score: 60,

      label:
        language === 'es'
          ? 'Confianza Baja'
          : 'Low Confidence'
    }
  }


  return {
    score: 35,

    label:
      language === 'es'
        ? 'Confianza Muy Baja'
        : 'Very Low Confidence'
  }
}