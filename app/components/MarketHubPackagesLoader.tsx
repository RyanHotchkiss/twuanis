'use client'

import {
  useEffect,
  useState
} from 'react'

import {
  supabase
} from '@/lib/supabase'

import {
  resolveAvailableAddOns,
  type AvailableAddOn
} from '@/lib/add-on-catalog'

import MarketHubPackages, {
  type BillingCycle,
  type SelectedUpgradePackage
} from '@/app/components/MarketHubPackages'

type MarketHubPackagesLoaderProps = {
  language: 'en' | 'es'
}

type SubscriptionPackage = {
  id: string
  slug: string
  name_en: string
  name_es: string
  description_en: string
  description_es: string
  price_usd: number
  price_crc: number
  billing_interval: string
  hierarchy_level: number
  display_order: number
}

type DatabaseAvailablePackage = {
  id: string
  slug: string
  name_en: string
  name_es: string
  description_en: string
  description_es: string
  price_usd: number
  price_crc: number
  billing_interval: string
  hierarchy_level: number
  display_order: number
  is_active: boolean
}

type DatabaseSubscription = {
  id: string
  user_id: string
  package_id: string
  status: string
  billing_cycle: string
  started_at: string | null
  current_period_start: string | null
  current_period_end: string | null
  cancelled_at: string | null
  expired_at: string | null
  package: SubscriptionPackage[]
}

type DatabasePendingSubscription = {
  id: string
  package_id: string
  status: string
  created_at: string
  package: SubscriptionPackage[]
}

type DatabaseSinpePayment = {
  id: string
  subscription_id: string
  amount: number
  currency: 'CRC' | 'USD'
  sinpe_reference: string
  sender_name: string
  sender_phone: string | null
  payment_date: string
  status:
    | 'submitted'
    | 'under_review'
    | 'approved'
    | 'rejected'
    | 'cancelled'
  created_at: string
}

type DatabaseResolvedUpgrade = {
  id: string
  status:
    | 'approved'
    | 'rejected'
    | 'cancelled'
  rejection_reason: string | null
  reviewed_at: string | null
  approved_at: string | null
  rejected_at: string | null
  updated_at: string
  subscription: {
    id: string
    status: string
    package: SubscriptionPackage[]
  }[]
}

type UpgradeOutcome = {
  paymentId: string
  status:
    | 'approved'
    | 'rejected'
    | 'cancelled'
  packageName: string
  rejectionReason: string | null
  resolvedAt: string
}

type DatabaseEntitlement = {
  id: string
  slug: string
  name_en: string
  name_es: string
  description_en: string | null
  description_es: string | null
  value_type: string
  is_active: boolean
}

type DatabaseEngine = {
  id: string
  slug: string
  name_en: string
  name_es: string
  purpose_en: string
  purpose_es: string
  display_order: number
  is_active: boolean
  is_future: boolean
}

type DatabasePackageEngine = {
  id: string
  engine: DatabaseEngine[]
}

type DatabaseComparisonPackageEngine = {
  package_id: string
  engine: DatabaseEngine[]
}

type DatabasePackageEntitlement = {
  id: string
  boolean_value: boolean | null
  integer_value: number | null
  text_value: string | null
  entitlement: DatabaseEntitlement[]
}

type DatabasePackageLimits = {
  listing_limit: number | null
  featured_listing_limit: number | null
  storage_limit_mb: number | null
}

type PackageUsage = {
  packageId: string
  packageSlug: string

  listingsUsed: number
  listingLimit: number | null

  featuredListingsUsed: number
  featuredListingLimit:
    number | null

  featuredUsageStatus:
    | 'available'
    | 'not_configured'

  storageUsedBytes: number
  storageLimitMb: number | null
  storageLimitBytes: number | null

  savedAnalysesUsed: number
  savedSearchesUsed: number

  recentActivityCount: number
  recentActivityWindowDays: number
}

type PackageUsageResponse = {
  success: boolean
  usage?: PackageUsage
  error?: string
}

type DatabaseAccountPermission = {
  id: string
  slug: string
  name_en: string
  name_es: string
  description_en: string | null
  description_es: string | null
  is_active: boolean
}

type DatabasePackageAccountPermission = {
  id: string
  permission: DatabaseAccountPermission[]
}

function formatUSD(
  value: number
): string {
  return new Intl.NumberFormat(
    'en-US',
    {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }
  ).format(value)
}

function formatCRC(
  value: number
): string {
  return new Intl.NumberFormat(
    'es-CR',
    {
      style: 'currency',
      currency: 'CRC',
      maximumFractionDigits: 0
    }
  ).format(value)
}

function formatRenewalDate(
  value: string | null,
  language: 'en' | 'es'
): string {
  if (!value) {
    return '—'
  }

  const date =
    new Date(value)

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return '—'
  }

  return new Intl.DateTimeFormat(
    language === 'es'
      ? 'es-CR'
      : 'en-US',
    {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }
  ).format(date)
}

function normalizeBillingCycle(
  value: string
): BillingCycle {
  switch (value) {
    case 'annual':
      return 'annual'

    case 'free':
      return 'free'

    case 'monthly':
    default:
      return 'monthly'
  }
}

export default function MarketHubPackagesLoader({
  language
}: MarketHubPackagesLoaderProps) {
  const [
    subscription,
    setSubscription
  ] =
    useState<DatabaseSubscription | null>(
      null
    )

  const [
    loading,
    setLoading
  ] =
    useState(true)

  const [
    errorMessage,
    setErrorMessage
  ] =
    useState('')

  const [
    packageEntitlements,
    setPackageEntitlements
  ] =
    useState<DatabasePackageEntitlement[]>(
      []
    )

    const [
      packageEngines,
      setPackageEngines
    ] =
      useState<DatabasePackageEngine[]>(
        []
      )

    const [
      packageLimits,
      setPackageLimits
    ] =
      useState<DatabasePackageLimits | null>(
        null
      )
     
    const [
      packageUsage,
      setPackageUsage
    ] =
      useState<PackageUsage | null>(
        null
      )

    const [
      packageUsageError,
      setPackageUsageError
    ] =
      useState('')

    const [
      accountPermissions,
      setAccountPermissions
    ] =
      useState<DatabasePackageAccountPermission[]>(
        []
      )

    const [
      availablePackages,
      setAvailablePackages
    ] =
      useState<DatabaseAvailablePackage[]>(
        []
      )

    const [
      comparisonPackageEngines,
      setComparisonPackageEngines
    ] =
      useState<
        DatabaseComparisonPackageEngine[]
      >([])

    const [
      addOnProducts,
      setAddOnProducts
    ] =
      useState<
        AvailableAddOn[]
      >([])

    const [
      selectedUpgradePackage,
      setSelectedUpgradePackage
    ] =
      useState<SelectedUpgradePackage | null>(
        null
      )

    const [
      pendingSubscription,
      setPendingSubscription
    ] =
      useState<DatabasePendingSubscription | null>(
        null
      )

    const [
      pendingPayment,
      setPendingPayment
    ] =
      useState<DatabaseSinpePayment | null>(
        null
      )

    const [
      upgradeOutcome,
      setUpgradeOutcome
    ] =
      useState<UpgradeOutcome | null>(
        null
      )

    const [
        paymentCurrency,
        setPaymentCurrency
      ] =
        useState<'CRC' | 'USD'>(
          'CRC'
        )

      const [
        sinpeReference,
        setSinpeReference
      ] =
        useState('')

      const [
        senderName,
        setSenderName
      ] =
        useState('')

      const [
        senderPhone,
        setSenderPhone
      ] =
        useState('')

      const [
        paymentDate,
        setPaymentDate
      ] =
        useState(
          new Date()
            .toISOString()
            .slice(0, 10)
        )

      const [
        submittingUpgrade,
        setSubmittingUpgrade
      ] =
        useState(false)

      const [
        upgradeError,
        setUpgradeError
      ] =
        useState('')

    async function loadPackageUsage():
      Promise<void> {
      setPackageUsageError('')

      const {
        data: {
          session
        },
        error: sessionError
      } =
        await supabase
          .auth
          .getSession()

      if (
        sessionError ||
        !session?.access_token
      ) {
        setPackageUsage(null)

        setPackageUsageError(
          language === 'es'
            ? 'No se pudo verificar el uso de su paquete.'
            : 'Your package usage could not be verified.'
        )

        return
      }

      try {
        const response =
          await fetch(
            '/api/package-usage',
            {
              method: 'GET',

              headers: {
                Authorization:
                  `Bearer ${session.access_token}`
              },

              cache:
                'no-store'
            }
          )

        const result =
          await response.json() as
            PackageUsageResponse

        if (
          !response.ok ||
          !result.success ||
          !result.usage
        ) {
          setPackageUsage(null)

          setPackageUsageError(
            result.error ||
            (
              language === 'es'
                ? 'No se pudo cargar el uso de su paquete.'
                : 'Your package usage could not be loaded.'
            )
          )

          return
        }

        setPackageUsage(
          result.usage
        )
      } catch (usageError) {
        console.error(
          'MARKETHUB PACKAGE USAGE ERROR:',
          usageError
        )

        setPackageUsage(null)

        setPackageUsageError(
          language === 'es'
            ? 'No se pudo cargar el uso de su paquete.'
            : 'Your package usage could not be loaded.'
        )
      }
    }

  useEffect(() => {
    let active = true

    async function loadSubscription(
      showLoading = true
    ): Promise<void> {
      if (showLoading) {
        setLoading(true)
      }

      setErrorMessage('')

    const {
        data: availablePackageData,
        error: availablePackageError
      } =
        await supabase
          .from(
            'packages'
          )
          .select(`
            id,
            slug,
            name_en,
            name_es,
            description_en,
            description_es,
            price_usd,
            price_crc,
            billing_interval,
            hierarchy_level,
            display_order,
            is_active
          `)
          .eq(
            'is_active',
            true
          )
          .order(
            'display_order',
            {
              ascending: true
            }
          )

      if (!active) {
        return
      }

      if (availablePackageError) {
        console.error(
          'MARKETHUB AVAILABLE PACKAGES ERROR:',
          availablePackageError
        )

        setAvailablePackages([])
      } else {
        setAvailablePackages(
          (
            availablePackageData || []
          ) as DatabaseAvailablePackage[]
        )
      }

      const {
        data: comparisonEngineData,
        error: comparisonEngineError
      } =
        await supabase
          .from(
            'package_engines'
          )
          .select(`
            package_id,
            engine:engines (
              id,
              slug,
              name_en,
              name_es,
              purpose_en,
              purpose_es,
              display_order,
              is_active,
              is_future
            )
          `)

            if (!active) {
              return
            }

            if (comparisonEngineError) {
              console.error(
                'MARKETHUB PACKAGE COMPARISON ENGINES ERROR:',
                comparisonEngineError
              )

              setComparisonPackageEngines([])
            } else {
              setComparisonPackageEngines(
                (
                  comparisonEngineData || []
                ) as DatabaseComparisonPackageEngine[]
              )
            }

            const {
              data: {
                user
              },
              error: userError
            } =
              await supabase.auth.getUser()

            if (!active) {
              return
            }

            if (
              userError ||
              !user
            ) {
              setSubscription(null)
              setPackageEntitlements([])
              setPackageEngines([])
              setPackageLimits(null)
              setAccountPermissions([])
              setPackageUsage(null)
              setPackageUsageError('')
              setErrorMessage(
                language === 'es'
                  ? 'Inicie sesión para ver su suscripción.'
                  : 'Sign in to view your subscription.'
              )

              setLoading(false)
                            return
                          }

                          if (showLoading) {
                await loadPackageUsage()

                if (!active) {
                  return
                }
              }

            const {
        data: pendingSubscriptionData,
        error: pendingSubscriptionError
      } =
        await supabase
          .from(
            'user_subscriptions'
          )
          .select(`
            id,
            package_id,
            status,
            created_at,
            package:packages (
              id,
              slug,
              name_en,
              name_es,
              description_en,
              description_es,
              price_usd,
              price_crc,
              billing_interval,
              hierarchy_level,
              display_order
            )
          `)
          .eq(
            'user_id',
            user.id
          )
          .eq(
            'status',
            'pending_payment'
          )
          .maybeSingle()

      if (!active) {
        return
      }

      if (pendingSubscriptionError) {
        console.error(
          'MARKETHUB PENDING SUBSCRIPTION ERROR:',
          pendingSubscriptionError
        )

        setPendingSubscription(null)
        setPendingPayment(null)
      } else if (
        pendingSubscriptionData &&
        pendingSubscriptionData.package &&
        pendingSubscriptionData.package.length > 0
      ) {
        const loadedPendingSubscription =
          pendingSubscriptionData as
            DatabasePendingSubscription

        setPendingSubscription(
          loadedPendingSubscription
        )

        const {
          data: pendingPaymentData,
          error: pendingPaymentError
        } =
          await supabase
            .from(
              'sinpe_payments'
            )
            .select(`
              id,
              subscription_id,
              amount,
              currency,
              sinpe_reference,
              sender_name,
              sender_phone,
              payment_date,
              status,
              created_at
            `)
            .eq(
              'subscription_id',
              loadedPendingSubscription.id
            )
            .in(
              'status',
              [
                'submitted',
                'under_review'
              ]
            )
            .order(
              'created_at',
              {
                ascending: false
              }
            )
            .limit(1)
            .maybeSingle()

        if (!active) {
          return
        }

        if (pendingPaymentError) {
          console.error(
            'MARKETHUB PENDING SINPE PAYMENT ERROR:',
            pendingPaymentError
          )

          setPendingPayment(null)
        } else {
          setPendingPayment(
            pendingPaymentData as
              DatabaseSinpePayment | null
          )
        }
      } else {
        setPendingSubscription(null)
        setPendingPayment(null)
      }

      const {
        data: resolvedUpgradeData,
        error: resolvedUpgradeError
      } =
        await supabase
          .from(
            'sinpe_payments'
          )
          .select(`
            id,
            status,
            rejection_reason,
            reviewed_at,
            approved_at,
            rejected_at,
            updated_at,
            subscription:user_subscriptions (
              id,
              status,
              package:packages (
                id,
                slug,
                name_en,
                name_es,
                description_en,
                description_es,
                price_usd,
                price_crc,
                billing_interval,
                hierarchy_level,
                display_order
              )
            )
          `)
          .eq(
            'user_id',
            user.id
          )
          .in(
            'status',
            [
              'approved',
              'rejected',
              'cancelled'
            ]
          )
          .order(
            'updated_at',
            {
              ascending: false
            }
          )
          .limit(1)
          .maybeSingle()

      if (!active) {
        return
      }

      if (resolvedUpgradeError) {
        console.error(
          'MARKETHUB RESOLVED UPGRADE ERROR:',
          resolvedUpgradeError
        )

        setUpgradeOutcome(null)
      } else if (
        resolvedUpgradeData &&
        resolvedUpgradeData.subscription &&
        resolvedUpgradeData.subscription.length > 0 &&
        resolvedUpgradeData.subscription[0].package &&
        resolvedUpgradeData.subscription[0].package.length > 0
      ) {
        const resolvedUpgrade =
          resolvedUpgradeData as
            DatabaseResolvedUpgrade

        const resolvedPackage =
          resolvedUpgrade
            .subscription[0]
            .package[0]

        const resolvedAt =
          resolvedUpgrade.approved_at ??
          resolvedUpgrade.rejected_at ??
          resolvedUpgrade.reviewed_at ??
          resolvedUpgrade.updated_at

        /*
        * Display recently resolved upgrade outcomes.
        * Older payment history belongs in the future
        * billing/payment-history interface.
        */
        const resolvedTime =
          new Date(
            resolvedAt
          ).getTime()

        const sevenDaysAgo =
          Date.now() -
          7 * 24 * 60 * 60 * 1000

        if (
          Number.isNaN(resolvedTime) ||
          resolvedTime < sevenDaysAgo
        ) {
          setUpgradeOutcome(null)
        } else {
          setUpgradeOutcome({
            paymentId:
              resolvedUpgrade.id,

            status:
              resolvedUpgrade.status,

            packageName:
              language === 'es'
                ? resolvedPackage.name_es
                : resolvedPackage.name_en,

            rejectionReason:
              resolvedUpgrade.rejection_reason,

            resolvedAt
          })
        }
      } else {
        setUpgradeOutcome(null)
      }

      const {
        data,
        error
      } =
        await supabase
          .from(
            'user_subscriptions'
          )
          .select(`
            id,
            user_id,
            package_id,
            status,
            billing_cycle,
            started_at,
            current_period_start,
            current_period_end,
            cancelled_at,
            expired_at,
            package:packages (
              id,
              slug,
              name_en,
              name_es,
              description_en,
              description_es,
              price_usd,
              price_crc,
              billing_interval,
              hierarchy_level,
              display_order
            )
          `)
          .eq(
            'user_id',
            user.id
          )
          .eq(
            'status',
            'active'
          )
          .order(
            'created_at',
            {
              ascending: false
            }
          )
          .limit(1)
          .maybeSingle()

      if (!active) {
        return
      }

      if (error) {
        console.error(
          'MARKETHUB SUBSCRIPTION ERROR:',
          error
        )

        setSubscription(null)
        setPackageEntitlements([])

        setErrorMessage(
          language === 'es'
            ? 'No se pudo cargar su suscripción.'
            : 'Your subscription could not be loaded.'
        )

        setLoading(false)
        return
      }


      
      if (
        !data ||
        !data.package ||
        data.package.length === 0
        ) {
        setSubscription(null)
        setPackageEntitlements([])
        setPackageEngines([])
        setPackageLimits(null)
        setAccountPermissions([])
        setPackageUsage(null)
        setPackageUsageError('')
        setErrorMessage(
          language === 'es'
            ? 'No se encontró una suscripción activa.'
            : 'No active subscription was found.'
        )

        setLoading(false)
        return
      }

      const loadedSubscription =
        data as DatabaseSubscription

      setSubscription(
        loadedSubscription
      )

      const currentPackage =
        loadedSubscription.package[0]

        try {
          const availableAddOns =
            await resolveAvailableAddOns({
              supabase,
              packageId:
                currentPackage.id
            })

          if (!active) {
            return
          }

          setAddOnProducts(
            availableAddOns
          )
        } catch (addOnError) {
          console.error(
            'MARKETHUB AVAILABLE ADD-ONS ERROR:',
            addOnError
          )

          if (!active) {
            return
          }

          setAddOnProducts([])
        }

      const {
        data: entitlementData,
        error: entitlementError
      } =
        await supabase
          .from(
            'package_entitlements'
          )
          .select(`
            id,
            boolean_value,
            integer_value,
            text_value,
            entitlement:entitlements (
              id,
              slug,
              name_en,
              name_es,
              description_en,
              description_es,
              value_type,
              is_active
            )
          `)
          .eq(
            'package_id',
            currentPackage.id
          )

      if (!active) {
        return
      }

      if (entitlementError) {
        console.error(
          'MARKETHUB PACKAGE ENTITLEMENTS ERROR:',
          entitlementError
        )

        setPackageEntitlements([])
      } else {
        setPackageEntitlements(
          (
            entitlementData || []
          ) as DatabasePackageEntitlement[]
        )
      }

      const {
        data: engineData,
        error: engineError
      } =
        await supabase
          .from(
            'package_engines'
          )
          .select(`
            id,
            engine:engines (
              id,
              slug,
              name_en,
              name_es,
              purpose_en,
              purpose_es,
              display_order,
              is_active,
              is_future
            )
          `)
          .eq(
            'package_id',
            currentPackage.id
          )

      if (!active) {
        return
      }

      if (engineError) {
        console.error(
          'MARKETHUB PACKAGE ENGINES ERROR:',
          engineError
        )

        setPackageEngines([])

      } else {
        setPackageEngines(
          (
            engineData || []
          ) as DatabasePackageEngine[]
        )
      }

      const {
          data: limitsData,
          error: limitsError
        } =
          await supabase
            .from(
              'package_limits'
            )
            .select(`
              listing_limit,
              featured_listing_limit,
              storage_limit_mb
            `)
            .eq(
              'package_id',
              currentPackage.id
            )
            .maybeSingle()

        if (!active) {
          return
        }

        if (limitsError) {
          console.error(
            'MARKETHUB PACKAGE LIMITS ERROR:',
            limitsError
          )

          setPackageLimits(null)
        } else {
          setPackageLimits(
            limitsData as DatabasePackageLimits | null
          )
        }

        const {
          data: accountPermissionData,
          error: accountPermissionError
        } =
          await supabase
            .from(
              'package_account_permissions'
            )
            .select(`
              id,
              permission:account_permissions (
                id,
                slug,
                name_en,
                name_es,
                description_en,
                description_es,
                is_active
              )
            `)
            .eq(
              'package_id',
              currentPackage.id
            )

        if (!active) {
          return
        }

        if (accountPermissionError) {
          console.error(
            'MARKETHUB ACCOUNT PERMISSIONS ERROR:',
            accountPermissionError
          )

          setAccountPermissions([])
        } else {
          setAccountPermissions(
            (
              accountPermissionData || []
            ) as DatabasePackageAccountPermission[]
          )
        }

      setLoading(false)
    }

    loadSubscription(true)

    const usageRefreshInterval =
      window.setInterval(
        () => {
          loadPackageUsage()
        },
        60000
      )

    const refreshInterval =
      window.setInterval(
        () => {
          loadSubscription(false)
        },
        15000
      )

    const handleWindowFocus = () => {
        loadSubscription(false)
        loadPackageUsage()
      }

    window.addEventListener(
      'focus',
      handleWindowFocus
    )

    const {
      data: authListener
    } =
      supabase.auth.onAuthStateChange(
        () => {
          loadSubscription(true)
        }
      )

    return () => {
        active = false

        window.clearInterval(
          refreshInterval
        )

        window.clearInterval(
          usageRefreshInterval
        )

        window.removeEventListener(
          'focus',
          handleWindowFocus
        )

        authListener.subscription.unsubscribe()
      }
    }, [
  language
])

  if (loading) {
    return (
      <section style={messageCard}>
        {language === 'es'
          ? 'Cargando su suscripción...'
          : 'Loading your subscription...'}
      </section>
    )
  }

  if (
    errorMessage ||
    !subscription ||
    !subscription.package ||
    subscription.package.length === 0
    ) {
    return (
      <section style={messageCard}>
        {errorMessage}
      </section>
    )
  }

  const pkg =
     subscription.package[0]

  const formatAddOnDuration = (
      product: AvailableAddOn
    ): string => {
      switch (
        product.durationType
      ) {
        case 'days':
          return language === 'es'
            ? `${product.durationDays} días`
            : `${product.durationDays} days`

        case 'listing_lifetime':
          return language === 'es'
            ? 'Durante la vida del anuncio'
            : 'Listing lifetime'

        case 'permanent':
          return language === 'es'
            ? 'Permanente'
            : 'Permanent'

        case 'single_use':
          return language === 'es'
            ? 'Un solo uso'
            : 'Single use'

        default:
          return '—'
      }
    }

    const listingAddons =
      addOnProducts
        .filter(
          product =>
            product.targetType ===
            'listing'
        )
        .map(product => ({
          name:
            language === 'es'
              ? product.nameEs
              : product.nameEn,

          price:
            language === 'es'
              ? formatCRC(
                  product.priceCrc
                )
              : formatUSD(
                  product.priceUsd
                ),

          description:
            language === 'es'
              ? product.descriptionEs
              : product.descriptionEn,

          duration:
            formatAddOnDuration(
              product
            )
        }))
        
  const currentPlan =
    language === 'es'
      ? pkg.name_es
      : pkg.name_en

  const packageDescription =
    language === 'es'
      ? pkg.description_es
      : pkg.description_en

    const includedFeatures =
    packageEntitlements
      .filter(packageEntitlement => {
        const entitlement =
          packageEntitlement.entitlement[0]

        if (
          !entitlement ||
          !entitlement.is_active
        ) {
          return false
        }

        switch (
          entitlement.value_type
        ) {
          case 'boolean':
            return (
              packageEntitlement.boolean_value ===
              true
            )

          case 'integer':
            return (
              packageEntitlement.integer_value !==
              null
            )

          case 'text':
            return (
              packageEntitlement.text_value !==
              null
            )

          default:
            return false
        }
      })
      .map(packageEntitlement => {
        const entitlement =
          packageEntitlement.entitlement[0]

        return language === 'es'
          ? entitlement.name_es
          : entitlement.name_en
      })
      .sort((a, b) =>
        a.localeCompare(b)
      )

    const availableEngines =
      packageEngines
        .map(packageEngine =>
          packageEngine.engine[0]
        )
        .filter(
          engine =>
            engine &&
            engine.is_active &&
            !engine.is_future
        )
        .sort(
          (a, b) =>
            a.display_order -
            b.display_order
        )

    const engineNames =
      availableEngines.map(
        engine =>
          language === 'es'
            ? engine.name_es
            : engine.name_en
      )

    const accountPermissionNames =
      accountPermissions
        .map(packagePermission =>
          packagePermission.permission[0]
        )
        .filter(
          permission =>
            permission &&
            permission.is_active
        )
        .map(permission =>
          language === 'es'
            ? permission.name_es
            : permission.name_en
        )
        .sort((a, b) =>
          a.localeCompare(b)
        )

    const upgradePackages =
      availablePackages.map(
        availablePackage => {
          const packageName =
            language === 'es'
              ? availablePackage.name_es
              : availablePackage.name_en

      const packageEngines =
        comparisonPackageEngines
          .filter(
            packageEngine =>
              packageEngine.package_id ===
              availablePackage.id
          )
          .map(
            packageEngine =>
              packageEngine.engine[0]
          )
          .filter(
            engine =>
              engine &&
              engine.is_active &&
              !engine.is_future
          )
          .sort(
            (a, b) =>
              a.display_order -
              b.display_order
          )

      const packageEngineNames =
            packageEngines.map(
              engine =>
                language === 'es'
                  ? engine.name_es
                  : engine.name_en
            )

          return {

            packageId:
              availablePackage.id,

            name: packageName,

            priceUSD:
              formatUSD(
                availablePackage.price_usd
              ),

            priceCRC:
              formatCRC(
                availablePackage.price_crc
              ),

            features:
              packageEngineNames,

            current:
              availablePackage.id ===
              pkg.id,

            premium:
              availablePackage.hierarchy_level >= 4
          }
        }
      )

      const availableUpgradeCount =
        upgradePackages.filter(
          packageItem =>
            !packageItem.current
        ).length

    const includedPackages = [
      {
        name: currentPlan,
        engineCount:
          availableEngines.length,
        features: [
          ...engineNames,
          ...includedFeatures
        ],
        active:
          subscription.status ===
          'active'
      }
    ]

    const handleSelectUpgradePackage = (
      packageItem: {
        packageId: string
        name: string
        priceUSD: string
        priceCRC: string
      }
    ) => {
      setSelectedUpgradePackage({
        packageId:
          packageItem.packageId,
        name:
          packageItem.name,
        priceUSD:
          packageItem.priceUSD,
        priceCRC:
          packageItem.priceCRC
      })

      setPaymentCurrency('CRC')
      setSinpeReference('')
      setSenderName('')
      setSenderPhone('')

      setPaymentDate(
        new Date()
          .toISOString()
          .slice(0, 10)
      )

      setUpgradeError('')
    }

    const handleSubmitUpgrade =
      async (): Promise<void> => {
        if (
          !selectedUpgradePackage ||
          submittingUpgrade
        ) {
          return
        }

        setUpgradeError('')
        setSubmittingUpgrade(true)

        try {
          const {
            data: upgradeData,
            error
          } =
            await supabase.rpc(
              'create_subscription_upgrade_request',
              {
                p_package_id:
                  selectedUpgradePackage.packageId,

                p_currency:
                  paymentCurrency,

                p_sinpe_reference:
                  sinpeReference.trim(),

                p_sender_name:
                  senderName.trim(),

                p_sender_phone:
                  senderPhone.trim() || null,

                p_payment_date:
                  new Date(
                    `${paymentDate}T12:00:00`
                  ).toISOString()
              }
            )

          if (error) {
            console.error(
              'MARKETHUB UPGRADE REQUEST ERROR:',
              error
            )

            setUpgradeError(
              language === 'es'
                ? 'No se pudo enviar la solicitud de mejora.'
                : 'Your upgrade request could not be submitted.'
            )

            return
          }

          const createdUpgrade =
            Array.isArray(upgradeData)
              ? upgradeData[0]
              : null

          if (!createdUpgrade) {
            setUpgradeError(
              language === 'es'
                ? 'La solicitud fue creada, pero no se pudo cargar su estado.'
                : 'The request was created, but its status could not be loaded.'
            )

            return
          }

          const {
            data: createdPendingSubscription,
            error: createdSubscriptionError
          } =
            await supabase
              .from(
                'user_subscriptions'
              )
              .select(`
                id,
                package_id,
                status,
                created_at,
                package:packages (
                  id,
                  slug,
                  name_en,
                  name_es,
                  description_en,
                  description_es,
                  price_usd,
                  price_crc,
                  billing_interval,
                  hierarchy_level,
                  display_order
                )
              `)
              .eq(
                'id',
                createdUpgrade.subscription_id
              )
              .single()

          if (createdSubscriptionError) {
            console.error(
              'MARKETHUB CREATED PENDING SUBSCRIPTION ERROR:',
              createdSubscriptionError
            )
          } else {
            setPendingSubscription(
              createdPendingSubscription as
                DatabasePendingSubscription
            )
          }

          const {
            data: createdPayment,
            error: createdPaymentError
          } =
            await supabase
              .from(
                'sinpe_payments'
              )
              .select(`
                id,
                subscription_id,
                amount,
                currency,
                sinpe_reference,
                sender_name,
                sender_phone,
                payment_date,
                status,
                created_at
              `)
              .eq(
                'id',
                createdUpgrade.payment_id
              )
              .single()

          if (createdPaymentError) {
            console.error(
              'MARKETHUB CREATED SINPE PAYMENT ERROR:',
              createdPaymentError
            )
          } else {
            setPendingPayment(
              createdPayment as
                DatabaseSinpePayment
            )
          }

          setSelectedUpgradePackage(null)
          setPaymentCurrency('CRC')
          setSinpeReference('')
          setSenderName('')
          setSenderPhone('')

          setPaymentDate(
            new Date()
              .toISOString()
              .slice(0, 10)
          )
        } finally {
          setSubmittingUpgrade(false)
        }
      }

      const pendingUpgrade =
        pendingSubscription &&
        pendingSubscription.package.length > 0
          ? {
              packageName:
                language === 'es'
                  ? pendingSubscription.package[0].name_es
                  : pendingSubscription.package[0].name_en,

              subscriptionStatus:
                pendingSubscription.status,

              paymentStatus:
                pendingPayment?.status ?? null,

              sinpeReference:
                pendingPayment?.sinpe_reference ?? null,

              amount:
                pendingPayment?.amount ?? null,

              currency:
                pendingPayment?.currency ?? null,

              submittedAt:
                pendingPayment?.created_at ?? null
            }
          : null

  return (
    <MarketHubPackages
      language={language}
      currentPlan={currentPlan}
      packageDescription={packageDescription}
      subscriptionStatus={subscription.status}
      listingLimit={
        packageLimits?.listing_limit ?? null
      }
      storageLimitMb={
        packageLimits?.storage_limit_mb ?? null
      }
      accountPermissions={
        accountPermissionNames
      }
      monthlyPriceUSD={
        formatUSD(
          pkg.price_usd
        )
      }
      monthlyPriceCRC={
        formatCRC(
          pkg.price_crc
        )
      }
      renewalDate={
        formatRenewalDate(
          subscription.current_period_end,
          language
        )
      }
      billingCycle={
        normalizeBillingCycle(
          subscription.billing_cycle
        )
      }
      includedPackages={
        includedPackages
      }
        usageSummary={{
        savedAnalyses:
          packageUsage?.savedAnalysesUsed ?? 0,

        savedSearches:
          packageUsage?.savedSearchesUsed ?? 0,

        recentActivity:
          packageUsage?.recentActivityCount ?? 0,

        recentActivityWindowDays:
          packageUsage?.recentActivityWindowDays ?? 30
      }}

        packageUsage={
          packageUsage
        }

        packageUsageError={
          packageUsageError
        }

        upgradePackages={
          upgradePackages
        }

        availableUpgradeCount={
          availableUpgradeCount
        }

        onSelectUpgradePackage={
            handleSelectUpgradePackage
          }

        selectedUpgradePackage={
            selectedUpgradePackage
          }

        paymentCurrency={
            paymentCurrency
          }

          onPaymentCurrencyChange={
            setPaymentCurrency
          }

          sinpeReference={
            sinpeReference
          }

          onSinpeReferenceChange={
            setSinpeReference
          }

          senderName={
            senderName
          }

          onSenderNameChange={
            setSenderName
          }

          senderPhone={
            senderPhone
          }

          onSenderPhoneChange={
            setSenderPhone
          }

          paymentDate={
            paymentDate
          }

          onPaymentDateChange={
            setPaymentDate
          }

          submittingUpgrade={
            submittingUpgrade
          }

          upgradeError={
            upgradeError
          }

          onSubmitUpgrade={
            handleSubmitUpgrade
          }

          onCloseUpgrade={() =>
            setSelectedUpgradePackage(null)
          }

          pendingUpgrade={
            pendingUpgrade
          }

          upgradeOutcome={
            upgradeOutcome
          }

        listingAddons={listingAddons}
            />
        )
        }

const messageCard = {
  padding: '2rem',
  color: '#aaa',
  background: '#151515',
  border: '1px solid #303030',
  borderRadius: '18px'
}