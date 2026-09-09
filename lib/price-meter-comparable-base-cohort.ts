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

import {
  matchesPriceMeterComparableGeography
} from '@/lib/price-meter-comparable-geography'

import {
  matchesPropertyAreaConstraint,
  matchesConstructionAreaConstraint
} from '@/lib/market-intelligence-area-ranges'


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


        if (
          observation.transactionType !==
            subjectPosition.transactionType ||
          observation.propertyBasis !==
            subjectPosition.propertyBasis ||
          observation.normalizationBasis !==
            subjectPosition.normalizationBasis
        ) {
          return false
        }


        if (
          !observation
            .analyticalIdentity
            .eligibility
            .eligible
        ) {
          return false
        }


        if (
          !matchesPriceMeterComparableGeography({
            observation,
            geography
          })
        ) {
          return false
        }


        const membership =
          membershipsByListingId.get(
            observation.listingId
          )


        if (
          !membership ||
          !membership.has(
            subject
              .propertyType
              .ontologyTermId
          )
        ) {
          return false
        }


        if (
          !matchesPropertyAreaConstraint(
            observation
              .analyticalIdentity
              .propertyAreaM2,

            subject.propertyAreaRange
          )
        ) {
          return false
        }


        if (
          subjectPosition.propertyBasis ===
            'improved_property'
        ) {
          if (
            subject.constructionAreaRange ===
              null
          ) {
            throw new Error(
              'Improved Property Phase 12A base cohort requires canonical Construction Area range.'
            )
          }


          if (
            !matchesConstructionAreaConstraint(
              observation
                .analyticalIdentity
                .constructionAreaM2,

              subject
                .constructionAreaRange
            )
          ) {
            return false
          }
        }


        return true
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