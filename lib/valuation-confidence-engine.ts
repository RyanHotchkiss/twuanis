type ConfidenceInputs = {
  sampleSize: number
  hasProvince?: boolean
  hasCanton?: boolean
  hasDistrict?: boolean
  hasPropertyType?: boolean
  hasBedrooms?: boolean
  hasBathrooms?: boolean
  hasPropertyArea?: boolean
  hasConstructionArea?: boolean
  hasRecentListings?: boolean
}

export function getValuationConfidenceScore({
  sampleSize,
  hasProvince,
  hasCanton,
  hasDistrict,
  hasPropertyType,
  hasBedrooms,
  hasBathrooms,
  hasPropertyArea,
  hasConstructionArea,
  hasRecentListings
}: ConfidenceInputs) {
  let score = 0

  if (sampleSize >= 30) score += 35
  else if (sampleSize >= 15) score += 25
  else if (sampleSize >= 8) score += 15
  else if (sampleSize >= 3) score += 8
  else score += 3

  if (hasProvince) score += 5
  if (hasCanton) score += 10
  if (hasDistrict) score += 15

  if (hasPropertyType) score += 15
  if (hasBedrooms) score += 8
  if (hasBathrooms) score += 8

  if (hasPropertyArea) score += 7
  if (hasConstructionArea) score += 7

  if (hasRecentListings) score += 5

  return Math.min(score, 100)
}

export function getConfidenceLabel(
  score: number,
  language: 'en' | 'es' = 'en'
) {
  if (language === 'es') {
    if (score >= 85) return 'Confianza Alta'
    if (score >= 65) return 'Confianza Moderada'
    if (score >= 40) return 'Confianza Baja'

    return 'Confianza Muy Baja'
  }

  if (score >= 85) return 'High Confidence'
  if (score >= 65) return 'Moderate Confidence'
  if (score >= 40) return 'Low Confidence'

  return 'Very Low Confidence'
}