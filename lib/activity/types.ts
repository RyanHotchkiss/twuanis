export type ActivityType =
  | 'listing-viewed'
  | 'listing-saved'
  | 'listing-shared'
  | 'listing-created'
  | 'listing-updated'
  | 'listing-published'
  | 'listing-unpublished'
  | 'listing-archived'
  | 'listing-deleted'
  | 'listing_unpublished'
  | 'listing_archived'
  | 'listing_restored'
  | 'listing_deleted'

export type ActivityEntityType =
  | 'listing'

export type ActivityMetadata = {
  title?: string | null
  province?: string | null
  canton?: string | null
  district?: string | null
  propertyType?: string | null
  transactionType?: string | null
  pathname?: string | null
  [key: string]:
    | string
    | number
    | boolean
    | null
    | undefined
}

export type ActivityInput = {
  activityType: ActivityType
  entityType: ActivityEntityType
  entityId?: string | null
  metadata?: ActivityMetadata
}

export type ActivityResult =
  | {
      success: true
      activityId: string
    }
  | {
      success: false
      skipped?: boolean
      error?: string
    }