import type {
  PriceMeterPropertyPositionIdentity,
} from './price-meter-property-position-identity'

import type {
  PriceMeterConstructionLandIdentity,
} from './price-meter-construction-land'

export type PriceMeterPropertyPositionConstructionLandContext = {
  listingId: string

  propertyAreaM2: number
  constructionAreaM2: number
  constructionToLandRatio: number

  constructionToLandIdentity: PriceMeterConstructionLandIdentity
}

/**
 * Preserves canonical Construction-to-Land identity as contextual
 * evidence for an Improved Property's Phase 12 position analysis.
 *
 * Construction-to-Land context describes the physical relationship:
 *
 *   exact Construction Area / exact Property Area
 *
 * This context does NOT independently redefine the Phase 12
 * comparison population.
 *
 * A canonical Construction-to-Land cohort may constrain the
 * comparison population only when that constraint is explicitly
 * selected as part of the analytical question.
 *
 * This function:
 * - consumes an already-resolved canonical property-position identity
 * - reuses the canonical Phase 9 Construction-to-Land identity
 * - does not recalculate Construction-to-Land identity
 * - does not construct a Construction-to-Land cohort
 * - does not modify the comparison population
 * - does not calculate Price / m² statistics
 */
export function buildPriceMeterPropertyPositionConstructionLandContext({
  subject,
}: {
  subject: PriceMeterPropertyPositionIdentity
}): PriceMeterPropertyPositionConstructionLandContext | null {
  const constructionToLandIdentity =
    subject.constructionToLandIdentity

  if (constructionToLandIdentity === null) {
    return null
  }

  const propertyAreaM2 =
    constructionToLandIdentity.propertyAreaM2

  const constructionAreaM2 =
    constructionToLandIdentity.constructionAreaM2

  const constructionToLandRatio =
    constructionToLandIdentity.constructionToLandRatio

  if (
    !Number.isFinite(propertyAreaM2) ||
    propertyAreaM2 <= 0 ||
    !Number.isFinite(constructionAreaM2) ||
    constructionAreaM2 <= 0 ||
    !Number.isFinite(constructionToLandRatio) ||
    constructionToLandRatio <= 0
  ) {
    throw new Error(
      'Property Price / m² Construction-to-Land context contains invalid canonical measurements.',
    )
  }

  return {
    listingId: subject.listingId,

    propertyAreaM2,
    constructionAreaM2,
    constructionToLandRatio,

    constructionToLandIdentity,
  }
}