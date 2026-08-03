import { recordActivityEvent } from '@/lib/activity'
import type { ActivityEventMetadata } from '@/lib/activity'

type ComparisonActivityInput = {
  comparisonId: string
  metadata?: ActivityEventMetadata
}

export async function trackComparisonCreated({
  comparisonId,
  metadata
}: ComparisonActivityInput) {
  return recordActivityEvent({
    eventCategory: 'comparison',
    eventType: 'comparison_created',
    entityType: 'property_comparison',
    entityId: comparisonId,
    metadata
  })
}

export async function trackComparisonOpened({
  comparisonId,
  metadata
}: ComparisonActivityInput) {
  return recordActivityEvent({
    eventCategory: 'comparison',
    eventType: 'comparison_opened',
    entityType: 'property_comparison',
    entityId: comparisonId,
    metadata
  })
}

export async function trackComparisonDuplicated({
  comparisonId,
  metadata
}: ComparisonActivityInput) {
  return recordActivityEvent({
    eventCategory: 'comparison',
    eventType: 'comparison_duplicated',
    entityType: 'property_comparison',
    entityId: comparisonId,
    metadata
  })
}

export async function trackComparisonDeleted({
  comparisonId,
  metadata
}: ComparisonActivityInput) {
  return recordActivityEvent({
    eventCategory: 'comparison',
    eventType: 'comparison_deleted',
    entityType: 'property_comparison',
    entityId: comparisonId,
    metadata
  })
}