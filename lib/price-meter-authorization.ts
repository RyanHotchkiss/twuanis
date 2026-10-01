import 'server-only'
import { createServerSupabaseClient } from '@/lib/supabase-server'

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


export async function authorizePriceMeterIntelligenceExecution():
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

    const [
    entitlementResult,
    administratorResult
  ] =
    await Promise.all([
      supabase.rpc(
        'current_user_has_entitlement',
        {
          requested_entitlement_slug:
            PRICE_METER_INTELLIGENCE_ENTITLEMENT
        }
      ),
      supabase.rpc(
        'is_current_user_administrator'
      )
    ])


  if (entitlementResult.error) {
    throw entitlementResult.error
  }


  if (administratorResult.error) {
    throw administratorResult.error
  }


  const commerciallyAuthorized =
    entitlementResult.data === true

  const administrativelyAuthorized =
    administratorResult.data === true


  if (
    !commerciallyAuthorized &&
    !administrativelyAuthorized
  ) {
    throw new PriceMeterComparableAuthorizationError()
  }


  return userData.user.id
}

