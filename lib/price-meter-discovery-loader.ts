/*
 * ---------------------------------------------------------
 * COMPARATIVE PRICE / M² DISCOVERY SERVER LOADER
 * ---------------------------------------------------------
 *
 * Purpose:
 *
 * Load one SQL-bounded Canton working population for one
 * validated Comparative Price / m² Discovery request.
 *
 * BOUND FIRST.
 * FETCH SECOND.
 * CALCULATE THIRD.
 *
 * One bounded Canton working set supports both:
 *
 * - Canton analytical population
 * - selected District analytical population
 *
 * District is derived downstream in memory.
 *
 * ---------------------------------------------------------
 * SQL BOUNDARY
 * ---------------------------------------------------------
 *
 * The listings query is bounded by:
 *
 * - active listing status
 * - Transaction Type
 * - source Province
 * - source Canton
 * - canonical Property Area constraint
 * - canonical Construction Area constraint when Improved
 *   Property
 *
 * Property Type is deliberately established downstream
 * through positive canonical ontology membership.
 *
 * This prevents an optimization against the source
 * listings.property_type field from silently redefining
 * canonical ontology-backed Property Type membership.
 *
 * ---------------------------------------------------------
 * CRITICAL INFRASTRUCTURE RULE
 * ---------------------------------------------------------
 *
 * This loader performs one bounded listings fetch.
 *
 * It does NOT:
 *
 * - fetch District separately
 * - perform candidate-specific listing queries
 * - perform one database query per candidate
 * - precompute combinations
 * - create persistent analytical caches
 * - use getMarketStatistics()
 * - use loadPriceMeterObservations()
 * - impose an analytical population ceiling
 * - truncate a legitimate population
 * - automatically broaden geography
 *
 * ---------------------------------------------------------
 * SERVER BOUNDARY
 * ---------------------------------------------------------
 *
 * This module is server-only.
 *
 * Raw listing rows, canonical ontology machinery and
 * analytical observations must not enter a client import
 * graph.
 */


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
  type PriceMeterFxIdentity
} from '@/lib/price-meter-identity'

import {
  buildPriceMeterObservations,
  type PriceMeterObservation
} from '@/lib/price-meter-observation-builder'

import {
  isPriceMeterCharacteristicType,
  type PriceMeterCharacteristicIdentity
} from '@/lib/price-meter-characteristic-identity'

import {
  resolveConstructionAreaConstraint,
  resolvePropertyAreaConstraint
} from '@/lib/market-intelligence-area-ranges'

import {
  assertValidPriceMeterDiscoveryRequest,
  type PriceMeterDiscoveryRequest
} from '@/lib/price-meter-discovery-request'

import type {
  PriceMeterOntologyMembership
} from '@/lib/price-meter-ontology-membership'


/*
 * ---------------------------------------------------------
 * LISTING SELECT
 * ---------------------------------------------------------
 *
 * Ordinary Intelligence Hub filters will eventually operate
 * after analytical qualification.
 *
 * Fields required for those filters are retained in the
 * bounded working set so no candidate-specific listing
 * fetches are required later.
 */


const DISCOVERY_LISTING_SELECT = `
  id,
  title,
  images,
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
  currency,
  created_at
`


export type PriceMeterDiscoveryRawListing = {
  id:
    string

  title?:
    string | null

  images?:
    unknown

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

  created_at?:
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


/*
 * ---------------------------------------------------------
 * LOADED RESULT
 * ---------------------------------------------------------
 *
 * Raw listings remain server-side working data.
 *
 * The Discovery engine consumes observations +
 * memberships.
 *
 * A later view-filter layer may consume listings after
 * analytical qualification without another database fetch.
 */


export type PriceMeterDiscoveryBoundedLoadResult = {
  analyticalDate:
    string

  fxIdentity:
    PriceMeterFxIdentity | null

  listings:
    PriceMeterDiscoveryRawListing[]

  observations:
    PriceMeterObservation[]

  memberships:
    PriceMeterOntologyMembership[]
}


/*
 * ---------------------------------------------------------
 * ONTOLOGY TERM RESOLUTION
 * ---------------------------------------------------------
 */


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


/*
 * ---------------------------------------------------------
 * BOUNDED ONTOLOGY MEMBERSHIP
 * ---------------------------------------------------------
 *
 * Membership is loaded only for listing IDs returned by the
 * already-bounded Canton listings query.
 *
 * No ontology query discovers additional listings.
 */


async function loadDiscoveryMemberships(
  listingIds:
    string[]
): Promise<
  PriceMeterOntologyMembership[]
> {

  const uniqueListingIds =
    Array.from(
      new Set(
        listingIds.filter(
          listingId =>
            Boolean(
              listingId
            )
        )
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


    if (
      !listingMembership
    ) {
      throw new Error(
        'Comparative Price / m² Discovery ontology query returned membership outside the bounded Canton listing population.'
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


/*
 * ---------------------------------------------------------
 * AREA SQL CONSTRAINT
 * ---------------------------------------------------------
 */


function applyDiscoveryAreaConstraint(
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


/*
 * ---------------------------------------------------------
 * SOURCE GEOGRAPHY
 * ---------------------------------------------------------
 *
 * Canonical geography identity supplies the authoritative
 * hierarchy selected by the user.
 *
 * The listings table currently stores source geography as
 * strings, so SQL bounding requires the corresponding
 * source-compatible geography value.
 *
 * Canonical geography is resolved again after retrieval and
 * remains the final analytical authority.
 */


function resolveDiscoverySourceGeographyValue(
  term:
    CanonicalGeographyTerm
): string {

  const value =
    term.term_name


  if (
    typeof value !==
      'string' ||
    value.trim().length ===
      0
  ) {
    throw new Error(
      `Comparative Price / m² Discovery canonical ${term.term_type} lacks a source-compatible geography name required for SQL bounding.`
    )
  }


  return value
}


/*
 * ---------------------------------------------------------
 * ONE BOUNDED CANTON LISTING FETCH
 * ---------------------------------------------------------
 */


async function loadDiscoveryBoundedListings(
  request:
    PriceMeterDiscoveryRequest
): Promise<
  PriceMeterDiscoveryRawListing[]
> {

  const {
    comparison
  } = request


  const propertyAreaConstraint =
    resolvePropertyAreaConstraint(
      comparison.propertyAreaRange
    )


  if (
    !propertyAreaConstraint
  ) {
    throw new Error(
      'Comparative Price / m² Discovery could not resolve the canonical Property Area SQL constraint.'
    )
  }


  const sourceProvince =
    resolveDiscoverySourceGeographyValue(
      comparison.province
    )


  const sourceCanton =
    resolveDiscoverySourceGeographyValue(
      comparison.canton
    )


  let query:
    any =
    supabaseAdmin
      .from(
        'listings'
      )
      .select(
        DISCOVERY_LISTING_SELECT
      )
      .eq(
        'listing_status',
        'active'
      )
      .eq(
        'transaction_type',
        comparison.transactionType
      )
      .eq(
        'province',
        sourceProvince
      )
      .eq(
        'canton',
        sourceCanton
      )


  /*
   * IMPORTANT:
   *
   * District is deliberately NOT included in the SQL
   * boundary.
   *
   * The Canton working population must contain all
   * qualifying Districts within the selected Canton.
   */


  query =
    applyDiscoveryAreaConstraint(
      query,
      'property_area',
      propertyAreaConstraint
    )


  if (
    comparison.propertyBasis ===
      'improved_property'
  ) {

    if (
      !comparison.constructionAreaRange
    ) {
      throw new Error(
        'Improved Property Comparative Price / m² Discovery requires a canonical Construction Area range.'
      )
    }


    const constructionAreaConstraint =
      resolveConstructionAreaConstraint(
        comparison.constructionAreaRange
      )


    if (
      !constructionAreaConstraint
    ) {
      throw new Error(
        'Comparative Price / m² Discovery could not resolve the canonical Construction Area SQL constraint.'
      )
    }


    query =
      applyDiscoveryAreaConstraint(
        query,
        'construction_area',
        constructionAreaConstraint
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
  ) as PriceMeterDiscoveryRawListing[]
}


/*
 * ---------------------------------------------------------
 * FX IDENTITY
 * ---------------------------------------------------------
 *
 * Every listing in one Discovery question is evaluated
 * against one analytical date and one canonical BCCR FX
 * identity.
 */


async function resolveDiscoveryFxIdentity({
  listings,
  analyticalDate
}: {
  listings:
    PriceMeterDiscoveryRawListing[]

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


  if (
    !containsUsd
  ) {
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


/*
 * ---------------------------------------------------------
 * CANONICAL DECORATION
 * ---------------------------------------------------------
 */


function decorateDiscoveryListings({
  listings,
  canonicalGeographyTerms,
  analyticalDate,
  fxIdentity
}: {
  listings:
    PriceMeterDiscoveryRawListing[]

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


/*
 * ---------------------------------------------------------
 * OBSERVATION UNIVERSE
 * ---------------------------------------------------------
 *
 * buildPriceMeterObservations may produce both land and
 * construction-normalized observations for one Improved
 * Property.
 *
 * Discovery retains only the exact analytical universe
 * requested by the comparison definition.
 */


function selectDiscoveryObservationUniverse({
  observations,
  request
}: {
  observations:
    PriceMeterObservation[]

  request:
    PriceMeterDiscoveryRequest
}): PriceMeterObservation[] {

  const {
    comparison
  } = request


  return observations.filter(
    observation =>
      observation.transactionType ===
        comparison.transactionType &&
      observation.propertyBasis ===
        comparison.propertyBasis &&
      observation.normalizationBasis ===
        comparison.normalizationBasis &&
      observation
        .analyticalIdentity
        .eligibility
        .eligible
  )
}


/*
 * ---------------------------------------------------------
 * PUBLIC SERVER LOADER
 * ---------------------------------------------------------
 */


export async function loadPriceMeterDiscoveryBoundedPopulation(
  request:
    PriceMeterDiscoveryRequest
): Promise<
  PriceMeterDiscoveryBoundedLoadResult
> {

  /*
   * -------------------------------------------------------
   * 1. VALIDATE BEFORE DATABASE ACCESS
   * -------------------------------------------------------
   */


  assertValidPriceMeterDiscoveryRequest(
    request
  )


  /*
   * -------------------------------------------------------
   * 2. ANALYTICAL DATE
   * -------------------------------------------------------
   */


  const analyticalDate =
    getCurrentAnalyticalDate()


  /*
   * -------------------------------------------------------
   * 3. ONE BOUNDED CANTON FETCH
   * -------------------------------------------------------
   */


  const listings =
    await loadDiscoveryBoundedListings(
      request
    )


  if (
    listings.length ===
      0
  ) {
    return {
      analyticalDate,

      fxIdentity:
        null,

      listings:
        [],

      observations:
        [],

      memberships:
        []
    }
  }


  /*
   * -------------------------------------------------------
   * 4. CANONICAL FX IDENTITY
   * -------------------------------------------------------
   */


  const fxIdentity =
    await resolveDiscoveryFxIdentity({
      listings,
      analyticalDate
    })


  /*
   * -------------------------------------------------------
   * 5. CANONICAL GEOGRAPHY TERMS
   * -------------------------------------------------------
   */


  const canonicalGeographyTerms =
    await loadCanonicalGeographyTerms(
      supabaseAdmin
    )


  /*
   * -------------------------------------------------------
   * 6. CANONICAL ANALYTICAL IDENTITY
   * -------------------------------------------------------
   */


  const decoratedListings =
    decorateDiscoveryListings({
      listings,
      canonicalGeographyTerms,
      analyticalDate,
      fxIdentity
    })


  /*
   * -------------------------------------------------------
   * 7. CANONICAL PRICE / M² OBSERVATIONS
   * -------------------------------------------------------
   */


  const observations =
    selectDiscoveryObservationUniverse({
      observations:
        buildPriceMeterObservations(
          decoratedListings
        ),

      request
    })


  /*
   * -------------------------------------------------------
   * 8. POSITIVE ONTOLOGY MEMBERSHIP
   * -------------------------------------------------------
   *
   * Membership is requested only for listings that survived
   * canonical observation construction.
   */


  const observationListingIds =
    Array.from(
      new Set(
        observations
          .map(
            observation =>
              observation.listingId
          )
          .filter(
            (
              listingId
            ): listingId is string =>
              listingId !==
                null
          )
      )
    )


  const memberships =
    await loadDiscoveryMemberships(
      observationListingIds
    )


  /*
   * -------------------------------------------------------
   * 9. CANONICAL SERVER WORKING SET
   * -------------------------------------------------------
   */


  return {
    analyticalDate,

    fxIdentity,

    listings,

    observations,

    memberships
  }
}