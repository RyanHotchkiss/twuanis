import 'server-only'

import type {
  CanonicalGeographyTerm
} from '@/lib/geography/canonical-geography'

import type {
  PriceMeterObservation
} from '@/lib/price-meter-observation-builder'

import type {
  PriceMeterComparableSubjectIdentity
} from '@/lib/price-meter-comparable-subject-identity'

import { matchesStructuralComparableBase } from '@/lib/structural-comparable-population'


export type PriceMeterComparableMembership = {
  listingId:
    string

  ontologyTermIds:
    number[]
}


export type PriceMeterComparableBaseCohort = {
  geography:
    CanonicalGeographyTerm

  propertyTypeOntologyTermId:
    number

  propertyAreaRange:
    string

  constructionAreaRange:
    string | null

  observations:
    PriceMeterObservation[]

  sampleSize:
    number
}


export function buildPriceMeterComparableBaseCohort({
  subject,
  geography,
  observations,
  memberships
}: {
  subject:
    PriceMeterComparableSubjectIdentity

  geography:
    CanonicalGeographyTerm

  observations:
    PriceMeterObservation[]

  memberships:
    PriceMeterComparableMembership[]
}): PriceMeterComparableBaseCohort {

  const membershipsByListingId =
    new Map(
      memberships.map(
        membership => [
          membership.listingId,
          new Set(
            membership.ontologyTermIds
          )
        ]
      )
    )


  const subjectPosition =
    subject.positionIdentity


  const matchingObservations =
    observations.filter(
      observation => {

        if (
          observation.listingId ===
            null
        ) {
          return false
        }


        // Monetary/observation eligibility remains owned by Phase 12A.
        if (!observation.analyticalIdentity.eligibility.eligible) return false

        return matchesStructuralComparableBase({
          question: {
            transactionType: subjectPosition.transactionType,
            propertyBasis: subjectPosition.propertyBasis,
            normalizationBasis: subjectPosition.normalizationBasis,
            geography,
            propertyTypeOntologyTermId: subject.propertyType.ontologyTermId,
            propertyAreaRange: subject.propertyAreaRange,
            constructionAreaRange: subject.constructionAreaRange
          },
          candidate: {
            transactionType: observation.transactionType,
            propertyBasis: observation.propertyBasis,
            normalizationBasis: observation.normalizationBasis,
            geography: observation.geography,
            propertyAreaM2: observation.analyticalIdentity.propertyAreaM2,
            constructionAreaM2: observation.analyticalIdentity.constructionAreaM2,
            memberships: membershipsByListingId.get(observation.listingId)
          }
        })
      }
    )


  return {
    geography,

    propertyTypeOntologyTermId:
      subject
        .propertyType
        .ontologyTermId,

    propertyAreaRange:
      subject.propertyAreaRange,

    constructionAreaRange:
      subject.constructionAreaRange,

    observations:
      matchingObservations,

    sampleSize:
      matchingObservations.length
  }
}