export type ListingStatus =
  | 'active'
  | 'draft'
  | 'expired'
  | 'archived'
  | 'deleted'

export type ListingLifecycleStage =
  | 'draft'
  | 'published'
  | 'expired'
  | 'archived'
  | 'deleted'

export type ListingLifecycleAction =
  | 'edit'
  | 'publish'
  | 'unpublish'
  | 'renew'
  | 'duplicate'
  | 'archive'
  | 'restore'
  | 'soft-delete'
  | 'permanent-delete'

export type ListingLifecycleDestination =
  | ListingStatus
  | 'permanently-deleted'

export type ListingLifecycleTransition = {
  action: ListingLifecycleAction
  from: ListingStatus
  to: ListingLifecycleDestination
}

export type ListingLifecycleResolution = {
  status: ListingStatus
  stage: ListingLifecycleStage
  availableActions:
    ListingLifecycleAction[]
  transitions:
    Partial<
      Record<
        ListingLifecycleAction,
        ListingLifecycleDestination
      >
    >
}

const LIFECYCLE_RESOLUTIONS:
  Record<
    ListingStatus,
    ListingLifecycleResolution
  > = {
    draft: {
      status: 'draft',
      stage: 'draft',

      availableActions: [
        'edit',
        'publish',
        'duplicate',
        'soft-delete'
      ],

      transitions: {
        publish: 'active',
        'soft-delete': 'deleted'
      }
    },

    active: {
      status: 'active',
      stage: 'published',

      availableActions: [
        'edit',
        'duplicate',
        'renew',
        'unpublish',
        'archive',
        'soft-delete'
      ],

      transitions: {
        renew: 'active',
        unpublish: 'draft',
        archive: 'archived',
        'soft-delete': 'deleted'
      }
    },

    expired: {
      status: 'expired',
      stage: 'expired',

      availableActions: [
        'edit',
        'duplicate',
        'renew',
        'archive',
        'soft-delete'
      ],

      transitions: {
        renew: 'active',
        archive: 'archived',
        'soft-delete': 'deleted'
      }
    },

    archived: {
      status: 'archived',
      stage: 'archived',

      availableActions: [
        'duplicate',
        'restore',
        'soft-delete'
      ],

      transitions: {
        restore: 'draft',
        'soft-delete': 'deleted'
      }
    },

    deleted: {
      status: 'deleted',
      stage: 'deleted',

      availableActions: [
        'restore',
        'permanent-delete'
      ],

      transitions: {
        restore: 'draft',
        'permanent-delete':
          'permanently-deleted'
      }
    }
  }

export function isListingStatus(
  value: unknown
): value is ListingStatus {
  return (
    value === 'active' ||
    value === 'draft' ||
    value === 'expired' ||
    value === 'archived' ||
    value === 'deleted'
  )
}

export function normalizeListingStatus(
  value: unknown
): ListingStatus {
  return isListingStatus(value)
    ? value
    : 'draft'
}

export function resolveListingLifecycle(
  status: ListingStatus
): ListingLifecycleResolution {
  const resolution =
    LIFECYCLE_RESOLUTIONS[
      status
    ]

  return {
    ...resolution,

    availableActions: [
      ...resolution.availableActions
    ],

    transitions: {
      ...resolution.transitions
    }
  }
}

export function canPerformListingLifecycleAction({
  status,
  action
}: {
  status: ListingStatus
  action: ListingLifecycleAction
}): boolean {
  return resolveListingLifecycle(
    status
  ).availableActions.includes(
    action
  )
}

export function getListingLifecycleDestination({
  status,
  action
}: {
  status: ListingStatus
  action: ListingLifecycleAction
}):
  | ListingLifecycleDestination
  | null {
  return (
    resolveListingLifecycle(
      status
    ).transitions[
      action
    ] ??
    null
  )
}

export function resolveListingLifecycleTransition({
  status,
  action
}: {
  status: ListingStatus
  action: ListingLifecycleAction
}):
  | ListingLifecycleTransition
  | null {
  const destination =
    getListingLifecycleDestination({
      status,
      action
    })

  if (!destination) {
    return null
  }

  return {
    action,
    from: status,
    to: destination
  }
}

export function assertListingLifecycleAction({
  status,
  action
}: {
  status: ListingStatus
  action: ListingLifecycleAction
}): ListingLifecycleTransition {
  const transition =
    resolveListingLifecycleTransition({
      status,
      action
    })

  if (!transition) {
    throw new Error(
      `The "${action}" action is not available when a listing is "${status}".`
    )
  }

  return transition
}