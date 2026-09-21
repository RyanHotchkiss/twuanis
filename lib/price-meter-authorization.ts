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

