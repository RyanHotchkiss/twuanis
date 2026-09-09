import 'server-only'

import {
  createServerSupabaseClient
} from '@/lib/supabase-server'

import {
  validatePriceMeterComparableRequest,
  type PriceMeterComparableRequest
} from '@/lib/price-meter-comparable-request'

import {
  loadPriceMeterComparableBoundedPopulation,
  loadPriceMeterComparableSubjectConfiguration
} from '@/lib/price-meter-comparable-loader'

import {
  runPriceMeterComparableEngine,
  type PriceMeterComparableEngineResult
} from '@/lib/price-meter-comparable-engine'

import {
  buildPriceMeterComparableConfigurationPresentation,
  buildPriceMeterComparablePresentation,
  type PriceMeterComparablePresentation
} from '@/lib/price-meter-comparable-presentation'

/*
 * ---------------------------------------------------------
 * PRICE / M² USER-DEFINED COMPARABLE SERVER BOUNDARY
 * ---------------------------------------------------------
 *
 * Phase 12A
 *
 * REQUEST FIRST.
 * AUTHORIZE SECOND.
 * RETURN MINIMUM THIRD.
 *
 * This is the commercial/security boundary around the
 * Crown Jewel comparable-cohort machinery.
 */


export const PRICE_METER_INTELLIGENCE_ENTITLEMENT =
  'price-m2-intelligence' as const


export class PriceMeterComparableAuthenticationError
  extends Error {

  constructor() {
    super(
      'Authentication is required for Price / m² Market Intelligence.'
    )

    this.name =
      'PriceMeterComparableAuthenticationError'
  }
}


export class PriceMeterComparableAuthorizationError
  extends Error {

  constructor() {
    super(
      'Price / m² Market Intelligence entitlement is required.'
    )

    this.name =
      'PriceMeterComparableAuthorizationError'
  }
}


async function authorizePriceMeterComparableExecution():
  Promise<string> {

  const supabase =
    await createServerSupabaseClient()


  /*
   * -------------------------------------------------------
   * AUTHENTICATED IDENTITY
   * -------------------------------------------------------
   */

  const {
    data: userData,
    error: userError
  } =
    await supabase.auth.getUser()


  if (
    userError ||
    !userData.user
  ) {
    throw new PriceMeterComparableAuthenticationError()
  }


  /*
   * -------------------------------------------------------
   * COMMERCIAL ENTITLEMENT
   * -------------------------------------------------------
   *
   * IMPORTANT:
   *
   * This RPC must execute through the authenticated,
   * cookie-backed Supabase client because the database
   * function resolves entitlement against auth.uid().
   *
   * Never evaluate this gate with the service-role client.
   */

  const {
    data: entitlementData,
    error: entitlementError
  } =
    await supabase.rpc(
      'current_user_has_entitlement',
      {
        requested_entitlement_slug:
          PRICE_METER_INTELLIGENCE_ENTITLEMENT
      }
    )


  if (entitlementError) {
    throw entitlementError
  }


  if (
    entitlementData !==
      true
  ) {
    throw new PriceMeterComparableAuthorizationError()
  }


  return userData.user.id
}

export type PriceMeterComparableConfigurationServerResult = {
  userId:
    string

  presentation:
    PriceMeterComparablePresentation
}


export async function executePriceMeterComparableConfiguration(
  subjectListingId:
    string
): Promise<
  PriceMeterComparableConfigurationServerResult
> {

  /*
   * -------------------------------------------------------
   * 1. REQUEST
   * -------------------------------------------------------
   */

  const normalizedSubjectListingId =
    typeof subjectListingId ===
      'string'
      ? subjectListingId.trim()
      : ''


  if (
    normalizedSubjectListingId.length ===
      0
  ) {
    throw new Error(
      'Phase 12A configuration requires a subject listing ID.'
    )
  }


  /*
   * -------------------------------------------------------
   * 2. AUTHORIZE
   * -------------------------------------------------------
   *
   * No subject listing, ontology, geography, FX, or
   * analytical identity is loaded before entitlement.
   */

  const userId =
    await authorizePriceMeterComparableExecution()


  /*
   * -------------------------------------------------------
   * 3. SUBJECT ONLY
   * -------------------------------------------------------
   *
   * No peer population.
   * No comparable execution.
   */

  const loaded =
    await loadPriceMeterComparableSubjectConfiguration(
      normalizedSubjectListingId
    )


  /*
   * -------------------------------------------------------
   * 4. MINIMUM PRESENTATION CONFIGURATION
   * -------------------------------------------------------
   */

  const presentation =
    buildPriceMeterComparableConfigurationPresentation({
      observations:
        loaded.observations,

      characteristics:
        loaded.characteristics,

      yearBuiltRange:
        loaded.yearBuiltRange
    })


  return {
    userId,
    presentation
  }
}

export type PriceMeterComparableServerResult = {
  userId:
    string

  analysis:
    PriceMeterComparableEngineResult

  presentation:
    PriceMeterComparablePresentation
}


export async function executePriceMeterComparableAnalysis(
  rawRequest:
    PriceMeterComparableRequest
): Promise<
  PriceMeterComparableServerResult
> {

  /*
   * -------------------------------------------------------
   * 1. REQUEST
   * -------------------------------------------------------
   */

  const request =
    validatePriceMeterComparableRequest(
      rawRequest
    )


  /*
   * -------------------------------------------------------
   * 2. AUTHORIZE
   * -------------------------------------------------------
   *
   * No subject load.
   * No market load.
   * No ontology load.
   * No Crown Jewel execution.
   *
   * until entitlement succeeds.
   */

  const userId =
    await authorizePriceMeterComparableExecution()


  /*
   * -------------------------------------------------------
   * 3. BOUND + FETCH
   * -------------------------------------------------------
   */

  const loaded =
    await loadPriceMeterComparableBoundedPopulation({
      subjectListingId:
        request.subjectListingId,

      geographyLevel:
        request.geographyLevel,

      normalizationBasis:
        request.normalizationBasis
    })


  /*
   * -------------------------------------------------------
   * 4. CALCULATE
   * -------------------------------------------------------
   */

   const analysis =
  runPriceMeterComparableEngine({
    request,

    subjectObservation:
      loaded.subject.observation,

    subjectCharacteristics:
      loaded.subject.characteristics,

    subjectYearBuiltRange:
      loaded.subject.yearBuiltRange,

    boundedObservations:
      loaded.observations,

    memberships:
      loaded.memberships
  })


const presentation =
  buildPriceMeterComparablePresentation({
    subject:
      analysis.subject,

    observation:
      loaded.subject.observation
  })


  /*
   * -------------------------------------------------------
   * 5. SERVER RESULT
   * -------------------------------------------------------
   *
   * This is still an INTERNAL server result.
   *
   * Do not serialize this object directly to the browser.
   *
   * The API boundary will map it to the minimum evidence
   * DTO and deliberately remove:
   *
   * - matchingListingIds
   * - raw peer observations
   * - ontology term IDs
   * - internal cohort structures
   * - analytical machinery
   */

    return {
    userId,
    analysis,
    presentation
  }
}