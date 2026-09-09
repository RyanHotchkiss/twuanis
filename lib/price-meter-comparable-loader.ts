import 'server-only'

import {
  supabaseAdmin
} from '@/lib/supabase-admin'

import {
  getCurrentAnalyticalDate
} from '@/lib/analysis-date'

import {
  getHistoricalUsdToCrcRate
} from '@/lib/fx/fx-service'

import {
  loadCanonicalGeographyTerms
} from '@/lib/geography/resolve-listing-geography'

import {
  resolveCanonicalGeography,
  type CanonicalGeographyTerm
} from '@/lib/geography/canonical-geography'

import {
  resolvePriceMeterAnalyticalIdentity,
  type PriceMeterFxIdentity,
  type PriceMeterNormalizationBasis
} from '@/lib/price-meter-identity'

import {
  buildPriceMeterObservations,
  type PriceMeterObservation
} from '@/lib/price-meter-observation-builder'

import {
  resolvePriceMeterComparableSubjectIdentity,
  type PriceMeterComparableSubjectIdentity
} from '@/lib/price-meter-comparable-subject-identity'

import {
  resolvePriceMeterComparableGeography,
  type PriceMeterComparableGeographyLevel
} from '@/lib/price-meter-comparable-geography'

import {
  resolvePropertyAreaConstraint,
  resolveConstructionAreaConstraint
} from '@/lib/market-intelligence-area-ranges'

import {
  isPriceMeterCharacteristicType,
  type PriceMeterCharacteristicIdentity
} from '@/lib/price-meter-characteristic-identity'

import type {
  PriceMeterComparableMembership
} from '@/lib/price-meter-comparable-base-cohort'


/*
 * ---------------------------------------------------------
 * PRICE / M² USER-DEFINED COMPARABLE SERVER LOADER
 * ---------------------------------------------------------
 *
 * Phase 12A
 *
 * Purpose:
 *
 * Load one subject property and one SQL-bounded candidate
 * population for one authorized comparable-cohort question.
 *
 * BOUND FIRST.
 * FETCH SECOND.
 * CALCULATE THIRD.
 *
 * This loader DOES NOT:
 *
 * - authorize the user
 * - expose raw rows to the browser
 * - discover an unbounded market
 * - use getMarketStatistics()
 * - precompute combinations
 * - broaden geography
 * - relax area ranges
 * - infer ontology membership
 * - calculate Phase 12A evidence
 */


const LISTING_SELECT = `
  id,
  title,
  transaction_type,
  listing_status,
  province,
  canton,
  district,
  property_type,
  property_area,
  construction_area,
  bedrooms,
  bathrooms,
  parking,
  year_built_range,
  terrain,
  utilities,
  environment,
  accessibility,
  legal_status,
  current_price,
  price_millions,
  monthly_price,
  currency
`


type PriceMeterComparableRawListing = {
  id:
    string

  title?:
    string | null

  transaction_type?:
    string | null

  listing_status?:
    string | null

  province?:
    string | null

  canton?:
    string | null

  district?:
    string | null

  property_type?:
    string | null

  property_area?:
    number | null

  construction_area?:
    number | null

  bedrooms?:
    number | string | null

  bathrooms?:
    number | string | null

  parking?:
    number | string | null

  year_built_range?:
    string | null

  terrain?:
    string[] | null

  utilities?:
    string[] | null

  environment?:
    string | null

  accessibility?:
    string[] | null

  legal_status?:
    string | null

  current_price?:
    number | null

  price_millions?:
    number | null

  monthly_price?:
    number | null

  currency?:
    string | null
}


type ListingOntologyAssignmentRow = {
  listing_id:
    string

  ontology_terms:
    | {
        id:
          number

        term_name:
          string

        term_name_en:
          string | null

        term_name_es:
          string | null

        term_type:
          string

        slug:
          string

        slug_en:
          string | null

        slug_es:
          string | null
      }
    | Array<{
        id:
          number

        term_name:
          string

        term_name_en:
          string | null

        term_name_es:
          string | null

        term_type:
          string

        slug:
          string

        slug_en:
          string | null

        slug_es:
          string | null
      }>
    | null
}

export type PriceMeterComparableSubjectConfigurationLoad = {
  analyticalDate:
    string

  fxIdentity:
    PriceMeterFxIdentity | null

  canonicalGeographyTerms:
    CanonicalGeographyTerm[]

  listing:
    PriceMeterComparableRawListing

  observations:
    PriceMeterObservation[]

  characteristics:
    PriceMeterCharacteristicIdentity[]

  yearBuiltRange:
    unknown
}

export type PriceMeterComparableLoadedSubject = {
  listing:
    PriceMeterComparableRawListing

  observation:
    PriceMeterObservation

  characteristics:
    PriceMeterCharacteristicIdentity[]

  yearBuiltRange:
    unknown

  identity:
    PriceMeterComparableSubjectIdentity
}


export type PriceMeterComparableBoundedLoadResult = {
  analyticalDate:
    string

  fxIdentity:
    PriceMeterFxIdentity | null

  subject:
    PriceMeterComparableLoadedSubject

  geography:
    CanonicalGeographyTerm

  observations:
    PriceMeterObservation[]

  memberships:
    PriceMeterComparableMembership[]
}


function resolveOntologyTerm(
  row:
    ListingOntologyAssignmentRow
) {

  if (
    Array.isArray(
      row.ontology_terms
    )
  ) {
    return (
      row.ontology_terms[0] ??
      null
    )
  }


  return row.ontology_terms
}


async function loadMembershipDetails(
  listingIds:
    string[]
): Promise<
  Array<{
    listingId:
      string

    characteristics:
      PriceMeterCharacteristicIdentity[]

    ontologyTermIds:
      number[]
  }>
> {

  const uniqueListingIds =
    Array.from(
      new Set(
        listingIds.filter(Boolean)
      )
    )


  if (
    uniqueListingIds.length ===
      0
  ) {
    return []
  }


  const {
    data,
    error
  } =
    await supabaseAdmin
      .from(
        'listings_ontology_terms'
      )
      .select(`
        listing_id,
        ontology_terms (
          id,
          term_name,
          term_name_en,
          term_name_es,
          term_type,
          slug,
          slug_en,
          slug_es
        )
      `)
      .in(
        'listing_id',
        uniqueListingIds
      )


  if (error) {
    throw error
  }


  const membershipMap =
    new Map<
      string,
      Map<
        number,
        PriceMeterCharacteristicIdentity
      >
    >()


  for (
    const listingId of
      uniqueListingIds
  ) {
    membershipMap.set(
      listingId,
      new Map()
    )
  }


  for (
    const rawRow of
      data ??
      []
  ) {
    const row =
      rawRow as
        ListingOntologyAssignmentRow


    const term =
      resolveOntologyTerm(
        row
      )


    if (
      !term ||
      !isPriceMeterCharacteristicType(
        term.term_type
      )
    ) {
      continue
    }


    const listingMembership =
      membershipMap.get(
        row.listing_id
      )


    if (!listingMembership) {
      throw new Error(
        'Phase 12A ontology query returned membership outside the bounded listing population.'
      )
    }


    listingMembership.set(
      term.id,
      {
        ontologyTermId:
          term.id,

        termType:
          term.term_type,

        termName:
          term.term_name,

        termNameEn:
          term.term_name_en,

        termNameEs:
          term.term_name_es,

        slug:
          term.slug,

        slugEn:
          term.slug_en,

        slugEs:
          term.slug_es
      }
    )
  }


  return uniqueListingIds.map(
    listingId => {

      const characteristics =
        Array.from(
          membershipMap
            .get(
              listingId
            )
            ?.values() ??
          []
        )


      return {
        listingId,

        characteristics,

        ontologyTermIds:
          characteristics.map(
            characteristic =>
              characteristic
                .ontologyTermId
          )
      }
    }
  )
}


async function resolveFxIdentity({
  listings,
  analyticalDate
}: {
  listings:
    PriceMeterComparableRawListing[]

  analyticalDate:
    string
}): Promise<
  PriceMeterFxIdentity | null
> {

  const containsUsd =
    listings.some(
      listing =>
        String(
          listing.currency ??
          ''
        )
          .trim()
          .toUpperCase() ===
        'USD'
    )


  if (!containsUsd) {
    return null
  }


  const resolvedFx =
    await getHistoricalUsdToCrcRate(
      analyticalDate
    )


  return {
    conversionApplied:
      true,

    analyticalDate:
      resolvedFx.analyticalDate,

    baseCurrency:
      'USD',

    quoteCurrency:
      'CRC',

    rate:
      resolvedFx.rate,

    rateType:
      'reference_sale',

    effectiveDate:
      resolvedFx.effectiveDate,

    source:
      'BCCR',

    resolutionMode:
      resolvedFx.resolutionMode
  }
}


function decorateListings({
  listings,
  canonicalGeographyTerms,
  analyticalDate,
  fxIdentity
}: {
  listings:
    PriceMeterComparableRawListing[]

  canonicalGeographyTerms:
    CanonicalGeographyTerm[]

  analyticalDate:
    string

  fxIdentity:
    PriceMeterFxIdentity | null
}) {

  return listings.map(
    listing => {

      const canonicalGeography =
        resolveCanonicalGeography({
          province:
            listing.province,

          canton:
            listing.canton,

          district:
            listing.district,

          terms:
            canonicalGeographyTerms
        })


      const analyticalIdentity =
        resolvePriceMeterAnalyticalIdentity(
          {
            ...listing,

            canonicalGeography
          },
          {
            analyticalDate,
            fxIdentity
          }
        )


      return {
        ...listing,

        canonicalGeography,

        analyticalIdentity
      }
    }
  )
}


function selectSubjectObservation({
  observations,
  normalizationBasis
}: {
  observations:
    PriceMeterObservation[]

  normalizationBasis:
    PriceMeterNormalizationBasis
}): PriceMeterObservation {

  const matchingObservations =
    observations.filter(
      observation =>
        observation.normalizationBasis ===
          normalizationBasis
    )


  if (
    matchingObservations.length !==
      1
  ) {
    throw new Error(
      'Phase 12A subject must resolve to exactly one observation for the requested Normalization Basis.'
    )
  }


  return matchingObservations[0]
}


async function loadSubjectListing(
  subjectListingId:
    string
): Promise<
  PriceMeterComparableRawListing
> {

  const {
    data,
    error
  } =
    await supabaseAdmin
      .from(
        'listings'
      )
      .select(
        LISTING_SELECT
      )
      .eq(
        'id',
        subjectListingId
      )
      .eq(
        'listing_status',
        'active'
      )
      .maybeSingle()


  if (error) {
    throw error
  }


  if (!data) {
    throw new Error(
      'Phase 12A subject listing was not found as an active listing.'
    )
  }


  return (
    data as
      PriceMeterComparableRawListing
  )
}

export async function loadPriceMeterComparableSubjectConfiguration(
  subjectListingId:
    string
): Promise<
  PriceMeterComparableSubjectConfigurationLoad
> {

  const subjectListing =
    await loadSubjectListing(
      subjectListingId
    )


  const analyticalDate =
    getCurrentAnalyticalDate()


  const canonicalGeographyTerms =
    await loadCanonicalGeographyTerms(
      supabaseAdmin
    )


  const fxIdentity =
    await resolveFxIdentity({
      listings: [
        subjectListing
      ],

      analyticalDate
    })


  const decoratedSubject =
    decorateListings({
      listings: [
        subjectListing
      ],

      canonicalGeographyTerms,

      analyticalDate,

      fxIdentity
    })


  const observations =
    buildPriceMeterObservations(
      decoratedSubject
    )


  if (
    observations.length ===
      0
  ) {
    throw new Error(
      'Phase 12A subject does not produce an eligible Price / m² observation.'
    )
  }


  const subjectMemberships =
    await loadMembershipDetails([
      subjectListingId
    ])


  const subjectMembership =
    subjectMemberships[0]


  if (!subjectMembership) {
    throw new Error(
      'Phase 12A could not establish subject ontology membership.'
    )
  }


  return {
  analyticalDate,

  fxIdentity,

  canonicalGeographyTerms,

  listing:
    subjectListing,

    observations,

    characteristics:
      subjectMembership
        .characteristics,

    yearBuiltRange:
      subjectListing
        .year_built_range
  }
}

function applyAreaConstraint(
  query:
    any,

  column:
    'property_area' |
    'construction_area',

  constraint: {
    min:
      number | null

    max:
      number | null
  }
) {

  let boundedQuery =
    query


  if (
    constraint.min !==
      null
  ) {
    boundedQuery =
      boundedQuery.gte(
        column,
        constraint.min
      )
  }


  if (
    constraint.max !==
      null
  ) {
    boundedQuery =
      boundedQuery.lt(
        column,
        constraint.max
      )
  }


  return boundedQuery
}


async function loadBoundedCandidateListings({
  subject,
  geography,
  subjectListing
}: {
  subject:
    PriceMeterComparableSubjectIdentity

  geography:
    CanonicalGeographyTerm

  subjectListing:
    PriceMeterComparableRawListing
}): Promise<
  PriceMeterComparableRawListing[]
> {

  const position =
    subject.positionIdentity


  const propertyAreaConstraint =
    resolvePropertyAreaConstraint(
      subject.propertyAreaRange
    )


  if (!propertyAreaConstraint) {
    throw new Error(
      'Phase 12A could not resolve the canonical Property Area SQL constraint.'
    )
  }


  let query:
    any =
    supabaseAdmin
      .from(
        'listings'
      )
      .select(
        LISTING_SELECT
      )
      .eq(
        'listing_status',
        'active'
      )
      .eq(
        'transaction_type',
        position.transactionType
      )
      .eq(
        'property_type',
        subject.propertyType.slug
      )


  /*
   * Geography is explicitly selected by the user.
   *
   * Canonical identity supplies the exact source hierarchy
   * represented by that selection.
   */

   const sourceGeography = {
    province:
      subjectListing.province ??
      null,

    canton:
      subjectListing.canton ??
      null,

    district:
      subjectListing.district ??
      null
  }


  if (
    geography.term_type ===
      'province'
  ) {
    if (
      !sourceGeography.province
    ) {
      throw new Error(
        'Phase 12A subject lacks source Province required for SQL bounding.'
      )
    }


    query =
      query.eq(
        'province',
        sourceGeography.province
      )
  }


  if (
    geography.term_type ===
      'canton'
  ) {
    if (
      !sourceGeography.province ||
      !sourceGeography.canton
    ) {
      throw new Error(
        'Phase 12A subject lacks source Province/Canton required for SQL bounding.'
      )
    }


    query =
      query
        .eq(
          'province',
          sourceGeography.province
        )
        .eq(
          'canton',
          sourceGeography.canton
        )
  }


  if (
    geography.term_type ===
      'district'
  ) {
    if (
      !sourceGeography.province ||
      !sourceGeography.canton ||
      !sourceGeography.district
    ) {
      throw new Error(
        'Phase 12A subject lacks source Province/Canton/District required for SQL bounding.'
      )
    }


    query =
      query
        .eq(
          'province',
          sourceGeography.province
        )
        .eq(
          'canton',
          sourceGeography.canton
        )
        .eq(
          'district',
          sourceGeography.district
        )
  }


  query =
    applyAreaConstraint(
      query,
      'property_area',
      propertyAreaConstraint
    )


  if (
    position.propertyBasis ===
      'improved_property'
  ) {
    if (
      subject.constructionAreaRange ===
        null
    ) {
      throw new Error(
        'Improved Property Phase 12A subject lacks canonical Construction Area range.'
      )
    }


    const constructionConstraint =
      resolveConstructionAreaConstraint(
        subject.constructionAreaRange
      )


    if (!constructionConstraint) {
      throw new Error(
        'Phase 12A could not resolve the canonical Construction Area SQL constraint.'
      )
    }


    query =
      applyAreaConstraint(
        query,
        'construction_area',
        constructionConstraint
      )
  }


  const {
    data,
    error
  } =
    await query


  if (error) {
    throw error
  }


  return (
    data ??
    []
  ) as PriceMeterComparableRawListing[]
}


function selectObservationUniverse({
  observations,
  subject
}: {
  observations:
    PriceMeterObservation[]

  subject:
    PriceMeterComparableSubjectIdentity
}): PriceMeterObservation[] {

  const position =
    subject.positionIdentity


  return observations.filter(
    observation =>
      observation.transactionType ===
        position.transactionType &&
      observation.propertyBasis ===
        position.propertyBasis &&
      observation.normalizationBasis ===
        position.normalizationBasis &&
      observation
        .analyticalIdentity
        .eligibility
        .eligible
  )
}


export async function loadPriceMeterComparableBoundedPopulation({
  subjectListingId,
  geographyLevel,
  normalizationBasis
}: {
  subjectListingId:
    string

  geographyLevel:
    PriceMeterComparableGeographyLevel

  normalizationBasis:
    PriceMeterNormalizationBasis
}): Promise<
  PriceMeterComparableBoundedLoadResult
> {
  /*
   * -------------------------------------------------------
   * 1. SUBJECT ONLY
   * -------------------------------------------------------
   */
const subjectConfiguration =
    await loadPriceMeterComparableSubjectConfiguration(
      subjectListingId
    )


  const subjectListing =
    subjectConfiguration.listing


  const analyticalDate =
    subjectConfiguration.analyticalDate


  const subjectFxIdentity =
  subjectConfiguration.fxIdentity


const canonicalGeographyTerms =
  subjectConfiguration
    .canonicalGeographyTerms


const subjectObservation =
    selectSubjectObservation({
      observations:
        subjectConfiguration
          .observations,

      normalizationBasis
    })


  const subjectIdentity =
    resolvePriceMeterComparableSubjectIdentity({
      observation:
        subjectObservation,

      characteristics:
        subjectConfiguration
          .characteristics,

      yearBuiltRange:
        subjectConfiguration
          .yearBuiltRange
    })


  const geography =
    resolvePriceMeterComparableGeography({
      observation:
        subjectObservation,

      level:
        geographyLevel
    })


  /*
   * -------------------------------------------------------
   * 2. SQL-BOUNDED CANDIDATES
   * -------------------------------------------------------
   */

  const candidateListings =
    await loadBoundedCandidateListings({
      subject:
        subjectIdentity,

      geography,

      subjectListing
    })


  /*
   * -------------------------------------------------------
   * 3. ONE CANONICAL FX IDENTITY FOR THIS QUESTION
   * -------------------------------------------------------
   *
   * Subject + peers must be evaluated against the same
   * analytical date and canonical BCCR FX identity.
   */

  const fxIdentity =
    await resolveFxIdentity({
      listings: [
        subjectListing,
        ...candidateListings
      ],

      analyticalDate
    })


  const decoratedCandidates =
    decorateListings({
      listings:
        candidateListings,

      canonicalGeographyTerms,

      analyticalDate,

      fxIdentity
    })


  const candidateObservations =
    selectObservationUniverse({
      observations:
        buildPriceMeterObservations(
          decoratedCandidates
        ),

      subject:
        subjectIdentity
    })


  /*
   * Rebuild the subject with the same final FX context used
   * for the candidate population.
   */

  const finalDecoratedSubject =
    decorateListings({
      listings: [
        subjectListing
      ],

      canonicalGeographyTerms,

      analyticalDate,

      fxIdentity
    })


  const finalSubjectObservation =
    selectSubjectObservation({
      observations:
        buildPriceMeterObservations(
          finalDecoratedSubject
        ),

      normalizationBasis
    })


  if (
    finalSubjectObservation
      .normalizationBasis !==
      subjectObservation
        .normalizationBasis
  ) {
    throw new Error(
      'Phase 12A subject normalization changed during canonical FX reconstruction.'
    )
  }


  /*
   * -------------------------------------------------------
   * 4. CANDIDATE-ONLY ONTOLOGY
   * -------------------------------------------------------
   */

  const boundedListingIds =
    Array.from(
      new Set(
        [
          subjectListingId,

          ...candidateObservations
            .map(
              observation =>
                observation.listingId
            )
            .filter(
              (
                listingId
              ): listingId is string =>
                listingId !== null
            )
        ]
      )
    )


  const membershipDetails =
    await loadMembershipDetails(
      boundedListingIds
    )


  const finalSubjectMembership =
    membershipDetails.find(
      membership =>
        membership.listingId ===
          subjectListingId
    )


  if (!finalSubjectMembership) {
    throw new Error(
      'Phase 12A subject ontology membership disappeared from the bounded population.'
    )
  }


  const finalSubjectIdentity =
    resolvePriceMeterComparableSubjectIdentity({
      observation:
        finalSubjectObservation,

      characteristics:
        finalSubjectMembership
          .characteristics,

      yearBuiltRange:
        subjectListing
          .year_built_range
    })


  const memberships:
    PriceMeterComparableMembership[] =
      membershipDetails.map(
        membership => ({
          listingId:
            membership.listingId,

          ontologyTermIds:
            membership.ontologyTermIds
        })
      )


  return {
    analyticalDate,

    fxIdentity,

    subject: {
      listing:
        subjectListing,

      observation:
        finalSubjectObservation,

      characteristics:
        finalSubjectMembership
          .characteristics,

      yearBuiltRange:
        subjectListing
          .year_built_range,

      identity:
        finalSubjectIdentity
    },

    geography,

    observations:
      candidateObservations,

    memberships
  }
}