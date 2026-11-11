import type { SupabaseClient } from '@supabase/supabase-js'

import {
  resolveListingEntitlements,
  type ListingEntitlementStatus
} from '@/lib/listing-entitlements'

import {
  resolveAvailableAddOns
} from '@/lib/add-on-catalog'

import {
  resolveUserPackageLimits
} from '@/lib/package-limits'

export type ListingCapabilityState =
  | 'active'
  | 'scheduled'
  | 'available'
  | 'historical'
  export type ListingCapabilityApprovalState =
  | 'not_required'
  | 'required'

export type ListingCapability = {
  slug: string

  nameEn: string
  nameEs: string

  descriptionEn: string
  descriptionEs: string

  state: ListingCapabilityState

  entitlementStatus:
  ListingEntitlementStatus | null

  sourceType: string | null

  startsAt: string | null
  expiresAt: string | null

  durationType: string | null
  durationDays: number | null

  activeQuantity: number

  scheduledQuantity: number

  assignedQuantity: number

  maximumQuantity: number | null

  remainingQuantity:
    number | null

  requiresManualApproval: boolean

    approvalState:
    ListingCapabilityApprovalState
}

export type ResolvedListingCapabilities = {
  listingId: string

  resolvedAt: string

  activeCapabilities:
    ListingCapability[]

  scheduledCapabilities: 
    ListingCapability[]

  availableCapabilities:
    ListingCapability[]

  historicalCapabilities:
    ListingCapability[]
}

function calculateCapabilityQuantities({
  activeQuantity,
  scheduledQuantity,
  maximumQuantity
}: {
  activeQuantity: number
  scheduledQuantity: number
  maximumQuantity: number | null
}) {
  const assignedQuantity =
    activeQuantity +
    scheduledQuantity

  const remainingQuantity =
    maximumQuantity === null
      ? null
      : Math.max(
          0,
          maximumQuantity -
            assignedQuantity
        )

    return {
    activeQuantity,
    scheduledQuantity,
    assignedQuantity,
    maximumQuantity,
    remainingQuantity
  }
}

export async function resolveListingCapabilities({
  supabase,
  listingId,
  ownerId
}: {
  supabase: SupabaseClient

  listingId: string

  ownerId: string
}): Promise<ResolvedListingCapabilities> {

  const packageLimits =
    await resolveUserPackageLimits({
      supabase,
      userId: ownerId
    })

  const entitlements =
    await resolveListingEntitlements({
      supabase,
      listingId,
      ownerId
    })

  const availableAddOns =
    await resolveAvailableAddOns({
      supabase,
      packageId:
        packageLimits.packageId
    })

    const activeCapabilities =
    entitlements
      .activeEntitlements
      .map(entitlement => {
        const addOn =
          availableAddOns.find(
            candidate =>
              candidate.slug ===
              entitlement.productSlug
          )

        return {
          slug:
            entitlement.productSlug,

          nameEn:
            entitlement.productNameEn,

          nameEs:
            entitlement.productNameEs,

          descriptionEn:
            addOn?.descriptionEn ??
            '',

          descriptionEs:
            addOn?.descriptionEs ??
            '',

          state:
            'active' as const,

        entitlementStatus:
            entitlement.status,

          sourceType:
            entitlement.sourceType,

          startsAt:
            entitlement.startsAt,

          expiresAt:
            entitlement.expiresAt,

          durationType:
            addOn?.durationType ??
            null,

          durationDays:
            addOn?.durationDays ??
            null,

                    ...calculateCapabilityQuantities({
            activeQuantity:
              entitlements
                .activeEntitlements
                .filter(
                  candidate =>
                    candidate.productSlug ===
                    entitlement.productSlug
                )
                .length,

            scheduledQuantity:
              entitlements
                .scheduledEntitlements
                .filter(
                  candidate =>
                    candidate.productSlug ===
                    entitlement.productSlug
                )
                .length,

            maximumQuantity:
              addOn?.maximumQuantity ??
              null
          }),

          requiresManualApproval:
            addOn?.requiresManualApproval ??
            false,
          approvalState:
            addOn?.requiresManualApproval
              ? 'required'
              : 'not_required'
        } satisfies ListingCapability
      })

  const scheduledCapabilities =
    entitlements
      .scheduledEntitlements
      .map(entitlement => {
        const addOn =
          availableAddOns.find(
            candidate =>
              candidate.slug ===
              entitlement.productSlug
          )

        return {
          slug:
            entitlement.productSlug,

          nameEn:
            entitlement.productNameEn,

          nameEs:
            entitlement.productNameEs,

          descriptionEn:
            addOn?.descriptionEn ??
            '',

          descriptionEs:
            addOn?.descriptionEs ??
            '',

          state:
            'scheduled' as const,

        entitlementStatus:
            entitlement.status,

          sourceType:
            entitlement.sourceType,

          startsAt:
            entitlement.startsAt,

          expiresAt:
            entitlement.expiresAt,

          durationType:
            addOn?.durationType ??
            null,

          durationDays:
            addOn?.durationDays ??
            null,

                    ...calculateCapabilityQuantities({
            activeQuantity:
              entitlements
                .activeEntitlements
                .filter(
                  candidate =>
                    candidate.productSlug ===
                    entitlement.productSlug
                )
                .length,

            scheduledQuantity:
              entitlements
                .scheduledEntitlements
                .filter(
                  candidate =>
                    candidate.productSlug ===
                    entitlement.productSlug
                )
                .length,

            maximumQuantity:
              addOn?.maximumQuantity ??
              null
          }),

          requiresManualApproval:
            addOn?.requiresManualApproval ??
            false,

          approvalState:
            addOn?.requiresManualApproval
              ? 'required'
              : 'not_required'
        } satisfies ListingCapability
      })

      const availableCapabilities =
        availableAddOns
        .filter(addOn => {
            if (
            addOn.targetType !==
            'listing'
            ) {
            return false
            }

            const activeQuantity =
            entitlements
                .activeEntitlements
                .filter(
                entitlement =>
                    entitlement.productSlug ===
                    addOn.slug
                )
                .length

            const scheduledQuantity =
            entitlements
                .scheduledEntitlements
                .filter(
                entitlement =>
                    entitlement.productSlug ===
                    addOn.slug
                )
                .length

            const assignedQuantity =
            activeQuantity +
            scheduledQuantity

            if (!addOn.isStackable) {
            return assignedQuantity === 0
            }

            if (
            addOn.maximumQuantity ===
            null
            ) {
            return true
            }

            return (
            assignedQuantity <
            addOn.maximumQuantity
            )
        })
        .map(addOn => {
            const activeQuantity =
            entitlements
                .activeEntitlements
                .filter(
                entitlement =>
                    entitlement.productSlug ===
                    addOn.slug
                )
                .length

            return {
            slug:
                addOn.slug,

            nameEn:
                addOn.nameEn,

            nameEs:
                addOn.nameEs,

            descriptionEn:
                addOn.descriptionEn,

            descriptionEs:
                addOn.descriptionEs,

            state:
                'available' as const,

            entitlementStatus:
                null,

            sourceType:
                null,

            startsAt:
                null,

            expiresAt:
                null,

            durationType:
                addOn.durationType,

            durationDays:
                addOn.durationDays,

            ...calculateCapabilityQuantities({
                activeQuantity,

                scheduledQuantity:
                entitlements
                    .scheduledEntitlements
                    .filter(
                    entitlement =>
                        entitlement.productSlug ===
                        addOn.slug
                    )
                    .length,

                maximumQuantity:
                addOn.maximumQuantity
            }),

        requiresManualApproval:
            addOn.requiresManualApproval,

          approvalState:
            addOn.requiresManualApproval
              ? 'required'
              : 'not_required'
        } satisfies ListingCapability
      })

      const historicalCapabilities =
        entitlements
        .historicalEntitlements
        .map(entitlement => {
            const addOn =
            availableAddOns.find(
                candidate =>
                candidate.slug ===
                entitlement.productSlug
            )

            return {
            slug:
                entitlement.productSlug,

            nameEn:
                entitlement.productNameEn,

            nameEs:
                entitlement.productNameEs,

            descriptionEn:
                addOn?.descriptionEn ??
                '',

            descriptionEs:
                addOn?.descriptionEs ??
                '',

            state:
                'historical' as const,

            entitlementStatus:
                entitlement.status,

            sourceType:
                entitlement.sourceType,

            startsAt:
                entitlement.startsAt,

            expiresAt:
                entitlement.expiresAt,

            durationType:
                addOn?.durationType ??
                null,

            durationDays:
                addOn?.durationDays ??
                null,

                        ...calculateCapabilityQuantities({
                activeQuantity:
                entitlements
                    .activeEntitlements
                    .filter(
                    candidate =>
                        candidate.productSlug ===
                        entitlement.productSlug
                    )
                    .length,

                scheduledQuantity:
                entitlements
                    .scheduledEntitlements
                    .filter(
                    candidate =>
                        candidate.productSlug ===
                        entitlement.productSlug
                    )
                    .length,

                maximumQuantity:
                addOn?.maximumQuantity ??
                null
            }),

          requiresManualApproval:
            addOn?.requiresManualApproval ??
            false,

          approvalState:
            addOn?.requiresManualApproval
              ? 'required'
              : 'not_required'
        } satisfies ListingCapability
      })

  return {
    listingId,

    resolvedAt:
      new Date().toISOString(),

    activeCapabilities,

    scheduledCapabilities,

    availableCapabilities,

    historicalCapabilities
  }
}