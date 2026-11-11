import 'server-only'
import {bathroomDecimal,compareBathroomDecimals} from './bathroom-selection'

import type { CanonicalGeographyTerm } from '@/lib/geography/canonical-geography'
import {
  matchesPropertyAreaConstraint,
  matchesConstructionAreaConstraint
} from '@/lib/market-intelligence-area-ranges'

// Structural authority has no price, FX, or analytical-observation requirement.
// Branches retain their own eligibility and subject-exclusion accounting.
export type StructuralComparableQuestion = {
  transactionType: string
  propertyBasis: string
  normalizationBasis: string
  geography: CanonicalGeographyTerm
  propertyTypeOntologyTermId: number
  propertyAreaRange: string
  constructionAreaRange: string | null
}

export type StructuralComparableCandidate = {
  transactionType: string
  propertyBasis: string
  normalizationBasis: string
  geography: {
    province: CanonicalGeographyTerm | null
    canton: CanonicalGeographyTerm | null
    district: CanonicalGeographyTerm | null
  }
  propertyAreaM2: number | null
  constructionAreaM2: number | null
  memberships: ReadonlySet<number> | undefined
}

export function matchesStructuralComparableBase({ question, candidate }: {
  question: StructuralComparableQuestion
  candidate: StructuralComparableCandidate
}): boolean {
  if (candidate.transactionType !== question.transactionType ||
      candidate.propertyBasis !== question.propertyBasis ||
      candidate.normalizationBasis !== question.normalizationBasis) return false
  const level = question.geography.term_type
  if (level !== 'province' && level !== 'canton' && level !== 'district') return false
  if (candidate.geography[level]?.id !== question.geography.id) return false
  if (!candidate.memberships?.has(question.propertyTypeOntologyTermId)) return false
  if (!matchesPropertyAreaConstraint(candidate.propertyAreaM2, question.propertyAreaRange)) return false
  if (question.propertyBasis === 'improved_property') {
    if (question.constructionAreaRange === null) {
      throw new Error('Improved Property Phase 12A base cohort requires canonical Construction Area range.')
    }
    if (!matchesConstructionAreaConstraint(candidate.constructionAreaM2, question.constructionAreaRange)) return false
  }
  return true
}

import { PRICE_METER_COMPARABLE_DIMENSION_ORDER, type PriceMeterComparableDimension } from './price-meter-comparable-dimensions'
import type { PriceMeterCharacteristicIdentity } from './price-meter-characteristic-identity'
import { resolvePriceMeterConstructionLandCohort } from './price-meter-construction-land-cohorts'
export type StructuralComparableSubject = {
  bathroomExact?:string
  characteristics: PriceMeterCharacteristicIdentity[]
  constructionToLandIdentity: { constructionToLandRatio: number } | null
}
export type PriceMeterComparableActiveDimension = {
  bathroomExact?:string
  dimension: PriceMeterComparableDimension
  characteristic: PriceMeterCharacteristicIdentity | null
  characteristics?: PriceMeterCharacteristicIdentity[]
  constructionLandCohortKey: string | null
}
function getSubjectCharacteristic({
  subject,
  dimension
}: {
  subject:
    StructuralComparableSubject

  dimension:
    PriceMeterComparableDimension
}): PriceMeterCharacteristicIdentity | null {

  if (
    dimension ===
      'construction_land'
  ) {
    return null
  }


  const matches =
    subject.characteristics.filter(
      characteristic =>
        characteristic.termType ===
          dimension
    )


  if (
    matches.length >
      1
  ) {
    throw new Error(
      `Phase 12A subject contains multiple canonical ${dimension} identities.`
    )
  }


  return (
    matches[0] ??
    null
  )
}


export function resolveStructuralComparableDimensions({
  subject,
  activeDimensions
}: {
  subject:
    StructuralComparableSubject

  activeDimensions:
    PriceMeterComparableDimension[]
}): PriceMeterComparableActiveDimension[] {

  const requested =
    new Set(
      activeDimensions
    )


  if (
    requested.size !==
      activeDimensions.length
  ) {
    throw new Error(
      'Phase 12A active dimensions contain duplicates.'
    )
  }


  const ordered =
    PRICE_METER_COMPARABLE_DIMENSION_ORDER
      .filter(
        dimension =>
          requested.has(
            dimension
          )
      )


  if (
    ordered.length !==
      activeDimensions.length
  ) {
    throw new Error(
      'Phase 12A active dimensions contain an unsupported dimension.'
    )
  }


  return ordered.map(
    dimension => {
      if(dimension==='bathrooms'&&subject.bathroomExact!==undefined)return {dimension,bathroomExact:bathroomDecimal(subject.bathroomExact),characteristic:null,constructionLandCohortKey:null}

      if (
        dimension ===
          'construction_land'
      ) {
        const identity =
          subject
            .constructionToLandIdentity


        if (
          identity ===
            null
        ) {
          throw new Error(
            'Construction-to-Land cannot constrain this Phase 12A subject.'
          )
        }


        const cohort =
          resolvePriceMeterConstructionLandCohort(
            identity
              .constructionToLandRatio
          )


        if (
          cohort ===
            null
        ) {
          throw new Error(
            'Subject Construction-to-Land ratio does not resolve to a canonical cohort.'
          )
        }


        return {
          dimension,

          characteristic:
            null,

          constructionLandCohortKey:
            cohort.key
        }
      }


      // Utilities are canonical multi-value memberships. A selected utility
      // dimension requires every evidenced subject utility, not an arbitrary first.
      if (dimension === 'utility') {
        const characteristics = subject.characteristics
          .filter(term => term.termType === 'utility')
          .sort((a, b) => a.ontologyTermId - b.ontologyTermId)
        if (characteristics.length === 0) {
          throw new Error('Phase 12A cannot activate utility because the subject has no canonical value for that dimension.')
        }
        if (new Set(characteristics.map(term => term.ontologyTermId)).size !== characteristics.length) {
          throw new Error('Duplicate canonical subject utility identity.')
        }
        return { dimension, characteristic: characteristics.length === 1 ? characteristics[0] : null,
          characteristics, constructionLandCohortKey: null }
      }

      const characteristic =
        getSubjectCharacteristic({
          subject,
          dimension
        })


      if (
        !characteristic
      ) {
        throw new Error(
          `Phase 12A cannot activate ${dimension} because the subject has no canonical value for that dimension.`
        )
      }


      return {
        dimension,

        characteristic,

        constructionLandCohortKey:
          null
      }
    }
  )
}

export function matchesStructuralComparableDimension(
  memberships: ReadonlySet<number> | undefined,
  constructionToLandRatio: number | null,
  selected: PriceMeterComparableActiveDimension,
  candidateBathroomExact?:string
): boolean {
  if(selected.dimension==='bathrooms'&&selected.bathroomExact!==undefined)return candidateBathroomExact!==undefined&&compareBathroomDecimals(candidateBathroomExact,selected.bathroomExact)===0
  if (selected.dimension === 'construction_land') {
    if (selected.constructionLandCohortKey === null || constructionToLandRatio === null) return false
    return resolvePriceMeterConstructionLandCohort(constructionToLandRatio)?.key === selected.constructionLandCohortKey
  }
  if (selected.dimension === 'utility' && selected.characteristics) {
    return selected.characteristics.length > 0 &&
      selected.characteristics.every(term => memberships?.has(term.ontologyTermId) ?? false)
  }
  const term = selected.characteristic?.ontologyTermId
  return term !== undefined && (memberships?.has(term) ?? false)
}

// One ordered intersection and subject-exclusion authority for both branches.
export function intersectStructuralComparables<T>({rows,subjectId,listingId,dimensions,matches}: {
  rows:T[];subjectId:string|null;listingId:(row:T)=>string;
  dimensions:PriceMeterComparableActiveDimension[];
  matches:(row:T,dimension:PriceMeterComparableActiveDimension)=>boolean
}): {rows:T[];baseCount:number;steps:Array<{dimension:PriceMeterComparableDimension;beforeCount:number;afterCount:number}>} {
  const seen=new Set<string>()
  for(const row of rows){const id=listingId(row);if(!id||seen.has(id))throw new Error('Duplicate or missing structural comparable identity.');seen.add(id)}
  let current=rows.filter(row=>listingId(row)!==subjectId)
  const baseCount=current.length,steps:Array<{dimension:PriceMeterComparableDimension;beforeCount:number;afterCount:number}>=[]
  for(const dimension of dimensions){const beforeCount=current.length;current=current.filter(row=>matches(row,dimension));steps.push({dimension:dimension.dimension,beforeCount,afterCount:current.length})}
  return {rows:current,baseCount,steps}
}
