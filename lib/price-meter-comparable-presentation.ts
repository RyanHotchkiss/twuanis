import 'server-only'

import type {
  PriceMeterObservation
} from '@/lib/price-meter-observation-builder'

import type {
  PriceMeterComparableSubjectIdentity
} from '@/lib/price-meter-comparable-subject-identity'

import {
  PRICE_METER_COMPARABLE_DIMENSION_ORDER,
  isPriceMeterComparableOntologyDimension,
  type PriceMeterComparableDimension
} from '@/lib/price-meter-comparable-dimensions'

import {
  getPriceMeterComparableGeographyOptions,
  type PriceMeterComparableGeographyLevel
} from '@/lib/price-meter-comparable-geography'

import {
  resolvePriceMeterConstructionLandIdentity
} from '@/lib/price-meter-construction-land'

import {
  resolvePriceMeterConstructionLandCohort
} from '@/lib/price-meter-construction-land-cohorts'

import {
  resolvePriceMeterComparableSubjectIdentity
} from '@/lib/price-meter-comparable-subject-identity'

import type {
  PriceMeterCharacteristicIdentity
} from '@/lib/price-meter-characteristic-identity'

export type PriceMeterComparablePresentationText = {
  en:
    string

  es:
    string
}


export type PriceMeterComparablePresentationGeography = {
  level:
    PriceMeterComparableGeographyLevel

  label:
    PriceMeterComparablePresentationText
}


export type PriceMeterComparablePresentationNormalization = {
  basis:
    'land' | 'construction'

  label:
    PriceMeterComparablePresentationText
}


export type PriceMeterComparablePresentationDimension = {
  dimension:
    PriceMeterComparableDimension

  label:
    PriceMeterComparablePresentationText

  value:
    PriceMeterComparablePresentationText
}


export type PriceMeterComparablePresentation = {
  listingId:
    string

  transactionType:
    'sale' | 'rent'

  propertyBasis:
    'land_only' | 'improved_property'

  geographyOptions:
    PriceMeterComparablePresentationGeography[]

  normalizationOptions:
    PriceMeterComparablePresentationNormalization[]

  baseCohort:
    {
      propertyType:
        PriceMeterComparablePresentationText

      propertyAreaRange:
        string

      constructionAreaRange:
        string | null
    }

  optionalDimensions:
    PriceMeterComparablePresentationDimension[]
}


const DIMENSION_LABELS:
  Record<
    PriceMeterComparableDimension,
    PriceMeterComparablePresentationText
  > = {
    bedrooms: {
      en: 'Bedrooms',
      es: 'Habitaciones'
    },

    bathrooms: {
      en: 'Bathrooms',
      es: 'Baños'
    },

    parking: {
      en: 'Parking',
      es: 'Estacionamiento'
    },

    year_built: {
      en: 'Year Built',
      es: 'Año de Construcción'
    },

    construction_land: {
      en: 'Construction-to-Land',
      es: 'Construcción a Terreno'
    },

    environment: {
      en: 'Environment',
      es: 'Entorno'
    },

    terrain: {
      en: 'Terrain',
      es: 'Terreno'
    },

    utility: {
      en: 'Utilities',
      es: 'Servicios'
    },

    accessibility: {
      en: 'Accessibility',
      es: 'Accesibilidad'
    },

    legal_status: {
      en: 'Legal Status',
      es: 'Estado Legal'
    }
  }


function bilingualCharacteristic(
  characteristic:
    PriceMeterComparableSubjectIdentity[
      'characteristics'
    ][number]
): PriceMeterComparablePresentationText {

  return {
    en:
      characteristic.termNameEn ??
      characteristic.termName,

    es:
      characteristic.termNameEs ??
      characteristic.termName
  }
}


function resolveOntologyDimensionValue({
  subject,
  dimension
}: {
  subject:
    PriceMeterComparableSubjectIdentity

  dimension:
    Exclude<
      PriceMeterComparableDimension,
      'year_built' |
      'construction_land'
    >
}): PriceMeterComparablePresentationText | null {

  const matches =
    subject.characteristics.filter(
      characteristic =>
        characteristic.termType ===
          dimension
    )


  /*
   * Optional comparable dimensions represent one
   * deterministic subject identity.
   *
   * Zero identities means the dimension is unavailable.
   * Multiple identities are not collapsed into a hidden
   * browser-side interpretation.
   */

  if (
    matches.length !==
      1
  ) {
    return null
  }


  return bilingualCharacteristic(
    matches[0]
  )
}


function resolveDimensionValue({
  subject,
  observation,
  dimension
}: {
  subject:
    PriceMeterComparableSubjectIdentity

  observation:
    PriceMeterObservation

  dimension:
    PriceMeterComparableDimension
}): PriceMeterComparablePresentationText | null {

  if (
    dimension ===
      'year_built'
  ) {
    if (
      subject.yearBuiltCohort ===
        null
    ) {
      return null
    }


    return {
      en:
        subject.yearBuiltCohort.labelEn,

      es:
        subject.yearBuiltCohort.labelEs
    }
  }


  if (
    dimension ===
      'construction_land'
  ) {
    const identity =
      resolvePriceMeterConstructionLandIdentity(
        observation.analyticalIdentity
      )


    if (!identity) {
      return null
    }


    const cohort =
      resolvePriceMeterConstructionLandCohort(
        identity.constructionToLandRatio
      )


    if (!cohort) {
      return null
    }


    return {
      en:
        cohort.label,

      es:
        cohort.label
    }
  }


  if (
    !isPriceMeterComparableOntologyDimension(
      dimension
    )
  ) {
    return null
  }


  return resolveOntologyDimensionValue({
    subject,
    dimension
  })
}


function geographyLabel(
  geography:
    ReturnType<
      typeof getPriceMeterComparableGeographyOptions
    >[number]['geography']
): PriceMeterComparablePresentationText {

  /*
   * Canonical geography currently exposes the canonical
   * term name through its geography identity.
   *
   * Geography names are proper names rather than translated
   * analytical labels, so the same canonical name is safe
   * for EN and ES presentation.
   */

  return {
    en:
      geography.term_name,

    es:
      geography.term_name
  }
}

export function buildPriceMeterComparableConfigurationPresentation({
  observations,
  characteristics,
  yearBuiltRange
}: {
  observations:
    PriceMeterObservation[]

  characteristics:
    PriceMeterCharacteristicIdentity[]

  yearBuiltRange:
    unknown
}): PriceMeterComparablePresentation {

  if (
    observations.length ===
      0
  ) {
    throw new Error(
      'Phase 12A configuration requires at least one canonical subject observation.'
    )
  }


  const resolved =
    observations.map(
      observation => ({
        observation,

        subject:
          resolvePriceMeterComparableSubjectIdentity({
            observation,

            characteristics,

            yearBuiltRange
          })
      })
    )


  const anchor =
    resolved[0]


  for (
    const candidate of
      resolved.slice(1)
  ) {
    if (
      candidate.subject
        .positionIdentity
        .listingId !==
        anchor.subject
          .positionIdentity
          .listingId ||

      candidate.subject
        .positionIdentity
        .transactionType !==
        anchor.subject
          .positionIdentity
          .transactionType ||

      candidate.subject
        .positionIdentity
        .propertyBasis !==
        anchor.subject
          .positionIdentity
          .propertyBasis ||

      candidate.subject
        .propertyAreaRange !==
        anchor.subject
          .propertyAreaRange ||

      candidate.subject
        .constructionAreaRange !==
        anchor.subject
          .constructionAreaRange
    ) {
      throw new Error(
        'Phase 12A configuration subject observations disagree on canonical non-normalization identity.'
      )
    }
  }


  /*
   * The anchor does NOT select the analytical
   * Normalization Basis.
   *
   * It supplies normalization-invariant subject metadata
   * for presentation only.
   *
   * The browser must still explicitly choose one of the
   * canonical normalizationOptions returned below before
   * Phase 12A execution.
   */

  return buildPriceMeterComparablePresentation({
    subject:
      anchor.subject,

    observation:
      anchor.observation
  })
}

export function buildPriceMeterComparablePresentation({
  subject,
  observation
}: {
  subject:
    PriceMeterComparableSubjectIdentity

  observation:
    PriceMeterObservation
}): PriceMeterComparablePresentation {

  const position =
    subject.positionIdentity


  const geographyOptions =
    getPriceMeterComparableGeographyOptions(
      observation
    ).map(
      option => ({
        level:
          option.level,

        label:
          geographyLabel(
            option.geography
          )
      })
    )


  if (
    geographyOptions.length ===
      0
  ) {
    throw new Error(
      'Phase 12A presentation requires at least one canonical geography option.'
    )
  }


  const normalizationOptions:
    PriceMeterComparablePresentationNormalization[] =
      observation
        .analyticalIdentity
        .availableNormalizationBases
        .filter(
          (
            basis
          ): basis is
            'land' |
            'construction' =>
              basis ===
                'land' ||
              basis ===
                'construction'
        )
        .map(
          basis => ({
            basis,

            label:
              basis ===
                'land'
                ? {
                    en:
                      'Land-normalized Price / m²',
                    es:
                      'Precio / m² normalizado por terreno'
                  }
                : {
                    en:
                      'Construction-normalized Price / m²',
                    es:
                      'Precio / m² normalizado por construcción'
                  }
          })
        )


  if (
    normalizationOptions.length ===
      0
  ) {
    throw new Error(
      'Phase 12A presentation requires at least one canonical normalization basis.'
    )
  }


  const optionalDimensions:
    PriceMeterComparablePresentationDimension[] =
      []


  for (
    const dimension of
      PRICE_METER_COMPARABLE_DIMENSION_ORDER
  ) {
    const value =
      resolveDimensionValue({
        subject,
        observation,
        dimension
      })


    if (!value) {
      continue
    }


    optionalDimensions.push({
      dimension,

      label:
        DIMENSION_LABELS[
          dimension
        ],

      value
    })
  }


  return {
    listingId:
      position.listingId,

    transactionType:
      position.transactionType,

    propertyBasis:
      position.propertyBasis,

    geographyOptions,

    normalizationOptions,

    baseCohort: {
      propertyType:
        bilingualCharacteristic(
          subject.propertyType
        ),

      propertyAreaRange:
        subject.propertyAreaRange,

      constructionAreaRange:
        subject.constructionAreaRange
    },

    optionalDimensions
  }
}