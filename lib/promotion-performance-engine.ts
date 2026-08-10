import type {
  SupabaseClient
} from '@supabase/supabase-js'

import {
  getPromotionHistory,
  type PromotionHistoryEvent
} from '@/lib/promotion-history'

import type {
  PromotionProductSlug
} from '@/lib/promotion-catalog'


/*
 * ---------------------------------------------------------
 * PROMOTION PERFORMANCE
 * ---------------------------------------------------------
 *
 * Measures observed listing behavior:
 *
 * BEFORE
 * DURING
 * AFTER
 *
 * Promotion History owns promotion time boundaries.
 * Activity Engine owns observed marketplace behavior.
 *
 * This engine does not make causal claims.
 */


export type PromotionPerformanceEvidenceStatus =
  | 'sufficient'
  | 'insufficient_duration'
  | 'baseline_zero'
  | 'period_unavailable'
  | 'no_observed_events'


export type PromotionPerformancePeriodType =
  | 'before'
  | 'during'
  | 'after'


export type PromotionPerformanceMetricKey =
  | 'views'
  | 'saves'
  | 'shares'
  | 'whatsappClicks'
  | 'emailInquiries'
  | 'buyerActions'


export type PromotionPerformanceCounts = {
  views:
    number

  saves:
    number

  shares:
    number

  whatsappClicks:
    number

  emailInquiries:
    number

  buyerActions:
    number
}


export type PromotionPerformanceWindow = {
  type:
    PromotionPerformancePeriodType

  available:
    boolean

  complete:
    boolean

  startsAt:
    string | null

  endsAt:
    string | null

  durationMs:
    number

  durationHours:
    number

  counts:
    PromotionPerformanceCounts

  observedEventCount:
    number

  evidenceStatus:
    PromotionPerformanceEvidenceStatus
}


export type PromotionMetricChange = {
  metric:
    PromotionPerformanceMetricKey

  baseline:
    number | null

  comparison:
    number | null

  absoluteChange:
    number | null

  percentageChange:
    number | null

  evidenceStatus:
    PromotionPerformanceEvidenceStatus
}


export type PromotionPerformanceComparison = {
  beforeToDuring:
    Record<
      PromotionPerformanceMetricKey,
      PromotionMetricChange
    >

  duringToAfter:
    Record<
      PromotionPerformanceMetricKey,
      PromotionMetricChange
    > | null
}


export type PromotionActiveInterval = {
  startsAt:
    string

  endsAt:
    string

  durationMs:
    number
}


export type CanonicalPromotionPerformance = {
  listingId:
    string

  entitlementId:
    string

  promotionSlug:
    PromotionProductSlug

  resolvedAt:
    string

  promotionStartedAt:
    string

  promotionEndedAt:
    string | null

  promotionStillActive:
    boolean

  activeDurationMs:
    number

  activeDurationHours:
    number

  activeIntervals:
    PromotionActiveInterval[]

  before:
    PromotionPerformanceWindow

  during:
    PromotionPerformanceWindow

  after:
    PromotionPerformanceWindow

  comparison:
    PromotionPerformanceComparison

  interpretationAvailable:
    boolean

  interpretationStatus:
    PromotionPerformanceEvidenceStatus

  listingClicksSupported:
    false

  notes:
    string[]
}


export type InsufficientPromotionPerformance = {
  listingId:
    string

  entitlementId:
    string

  resolvedAt:
    string

  status:
    'insufficient_evidence'

  reason:
    string
}


export type PromotionPerformanceResult =
  | CanonicalPromotionPerformance
  | InsufficientPromotionPerformance


type DatabaseActivityEvent = {
  id:
    string

  event_type:
    string

  created_at:
    string
}


const MINIMUM_COMPARABLE_DURATION_MS =
  24 *
  60 *
  60 *
  1000


const PERFORMANCE_EVENT_TYPES = [
  'listing_viewed',
  'listing_saved',
  'listing_shared',
  'listing_whatsapp_clicked',
  'listing_email_inquiry'
] as const


type PerformanceEventType =
  typeof PERFORMANCE_EVENT_TYPES[number]


function emptyCounts():
  PromotionPerformanceCounts {

  return {
    views:
      0,

    saves:
      0,

    shares:
      0,

    whatsappClicks:
      0,

    emailInquiries:
      0,

    buyerActions:
      0
  }
}


function timestamp(
  value:
    string
): number {

  const parsed =
    new Date(
      value
    ).getTime()


  if (
    !Number.isFinite(
      parsed
    )
  ) {

    throw new PromotionPerformanceError(
      'INVALID_PROMOTION_HISTORY',
      `Invalid promotion timestamp: ${value}`
    )
  }


  return parsed
}


function hoursFromMs(
  durationMs:
    number
): number {

  return Number(
    (
      durationMs /
      (
        60 *
        60 *
        1000
      )
    ).toFixed(
      2
    )
  )
}


function isPerformanceEventType(
  value:
    string
): value is PerformanceEventType {

  return (
    PERFORMANCE_EVENT_TYPES as
      readonly string[]
  ).includes(
    value
  )
}


function countActivityEvents(
  events:
    DatabaseActivityEvent[]
): PromotionPerformanceCounts {

  const counts =
    emptyCounts()


  for (
    const event
    of events
  ) {

    if (
      !isPerformanceEventType(
        event.event_type
      )
    ) {
      continue
    }


    switch (
      event.event_type
    ) {

      case 'listing_viewed':
        counts.views +=
          1
        break


      case 'listing_saved':
        counts.saves +=
          1
        break


      case 'listing_shared':
        counts.shares +=
          1
        break


      case 'listing_whatsapp_clicked':
        counts.whatsappClicks +=
          1
        break


      case 'listing_email_inquiry':
        counts.emailInquiries +=
          1
        break
    }
  }


  counts.buyerActions =
    counts.whatsappClicks +
    counts.emailInquiries


  return counts
}


function filterEventsForRange({
  events,
  startsAt,
  endsAt
}: {
  events:
    DatabaseActivityEvent[]

  startsAt:
    number

  endsAt:
    number
}) {

  return events.filter(
    event => {

      const eventTime =
        new Date(
          event.created_at
        ).getTime()


      return (
        Number.isFinite(
          eventTime
        ) &&
        eventTime >=
          startsAt &&
        eventTime <
          endsAt
      )
    }
  )
}


function filterEventsForIntervals({
  events,
  intervals
}: {
  events:
    DatabaseActivityEvent[]

  intervals:
    PromotionActiveInterval[]
}) {

  return events.filter(
    event => {

      const eventTime =
        new Date(
          event.created_at
        ).getTime()


      if (
        !Number.isFinite(
          eventTime
        )
      ) {
        return false
      }


      return intervals.some(
        interval => {

          const startsAt =
            timestamp(
              interval.startsAt
            )


          const endsAt =
            timestamp(
              interval.endsAt
            )


          return (
            eventTime >=
              startsAt &&
            eventTime <
              endsAt
          )
        }
      )
    }
  )
}


function buildActiveIntervals({
  events,
  now
}: {
  events:
    PromotionHistoryEvent[]

  now:
    number
}): PromotionActiveInterval[] {

  const sortedEvents =
    [...events]
      .sort(
        (
          first,
          second
        ) =>
          timestamp(
            first.occurredAt
          ) -
          timestamp(
            second.occurredAt
          )
      )


  const intervals:
    PromotionActiveInterval[] =
      []


  let activeStart:
    number | null =
      null


  for (
    const event
    of sortedEvents
  ) {

    const occurredAt =
      timestamp(
        event.occurredAt
      )


    switch (
      event.eventType
    ) {

      case 'promotion_activated': {

        if (
          activeStart ===
            null
        ) {

          activeStart =
            occurredAt
        }

        break
      }


      case 'promotion_changed': {

        /*
         * A change may keep the promotion active
         * or move it back to scheduled state.
         *
         * We trust resultingState from immutable
         * Promotion History.
         */

        if (
          event.resultingState ===
            'scheduled'
        ) {

          if (
            activeStart !==
              null &&
            occurredAt >
              activeStart
          ) {

            intervals.push({
              startsAt:
                new Date(
                  activeStart
                ).toISOString(),

              endsAt:
                new Date(
                  occurredAt
                ).toISOString(),

              durationMs:
                occurredAt -
                activeStart
            })
          }


          activeStart =
            null
        }


        if (
          event.resultingState ===
            'active' &&
          activeStart ===
            null
        ) {

          activeStart =
            occurredAt
        }

        break
      }


      case 'promotion_expired':
      case 'promotion_cancelled': {

        if (
          activeStart !==
            null &&
          occurredAt >
            activeStart
        ) {

          intervals.push({
            startsAt:
              new Date(
                activeStart
              ).toISOString(),

            endsAt:
              new Date(
                occurredAt
              ).toISOString(),

            durationMs:
              occurredAt -
              activeStart
          })
        }


        activeStart =
          null

        break
      }


      case 'promotion_scheduled':
        break
    }
  }


  /*
   * Promotion is still operational.
   *
   * Its current active interval ends at resolution time
   * for measurement purposes only.
   */

  if (
    activeStart !==
      null &&
    now >
      activeStart
  ) {

    intervals.push({
      startsAt:
        new Date(
          activeStart
        ).toISOString(),

      endsAt:
        new Date(
          now
        ).toISOString(),

      durationMs:
        now -
        activeStart
    })
  }


  return intervals
}


function calculateTotalDuration(
  intervals:
    PromotionActiveInterval[]
): number {

  return intervals.reduce(
    (
      total,
      interval
    ) =>
      total +
      interval.durationMs,
    0
  )
}


function createWindow({
  type,
  startsAt,
  endsAt,
  counts,
  observedEventCount,
  available,
  complete
}: {
  type:
    PromotionPerformancePeriodType

  startsAt:
    number | null

  endsAt:
    number | null

  counts:
    PromotionPerformanceCounts

  observedEventCount:
    number

  available:
    boolean

  complete:
    boolean
}): PromotionPerformanceWindow {

  const durationMs =
    startsAt !== null &&
    endsAt !== null &&
    endsAt >
      startsAt
      ? endsAt -
        startsAt
      : 0


  let evidenceStatus:
    PromotionPerformanceEvidenceStatus


  if (
    !available
  ) {

    evidenceStatus =
      'period_unavailable'

  } else if (
    durationMs <
      MINIMUM_COMPARABLE_DURATION_MS
  ) {

    evidenceStatus =
      'insufficient_duration'

  } else if (
    observedEventCount ===
      0
  ) {

    /*
     * Zero means no events were observed.
     *
     * It does NOT assert that every possible interaction
     * was historically instrumented during this period.
     */

    evidenceStatus =
      'no_observed_events'

  } else {

    evidenceStatus =
      'sufficient'
  }


  return {
    type,

    available,

    complete,

    startsAt:
      startsAt === null
        ? null
        : new Date(
            startsAt
          ).toISOString(),

    endsAt:
      endsAt === null
        ? null
        : new Date(
            endsAt
          ).toISOString(),

    durationMs,

    durationHours:
      hoursFromMs(
        durationMs
      ),

    counts,

    observedEventCount,

    evidenceStatus
  }
}


function metricValue(
  counts:
    PromotionPerformanceCounts,

  metric:
    PromotionPerformanceMetricKey
): number {

  return counts[
    metric
  ]
}


function calculateMetricChange({
  metric,
  baselineWindow,
  comparisonWindow
}: {
  metric:
    PromotionPerformanceMetricKey

  baselineWindow:
    PromotionPerformanceWindow

  comparisonWindow:
    PromotionPerformanceWindow
}): PromotionMetricChange {

  if (
    !baselineWindow.available ||
    !comparisonWindow.available
  ) {

    return {
      metric,

      baseline:
        null,

      comparison:
        null,

      absoluteChange:
        null,

      percentageChange:
        null,

      evidenceStatus:
        'period_unavailable'
    }
  }


  const baseline =
    metricValue(
      baselineWindow.counts,
      metric
    )


  const comparison =
    metricValue(
      comparisonWindow.counts,
      metric
    )


  const absoluteChange =
    comparison -
    baseline


  /*
   * Percentage change from zero is undefined.
   *
   * We preserve the absolute change without inventing an
   * infinite or misleading percentage.
   */

  if (
    baseline ===
      0
  ) {

    return {
      metric,

      baseline,

      comparison,

      absoluteChange,

      percentageChange:
        null,

      evidenceStatus:
        'baseline_zero'
    }
  }


  if (
    baselineWindow.durationMs <
      MINIMUM_COMPARABLE_DURATION_MS ||
    comparisonWindow.durationMs <
      MINIMUM_COMPARABLE_DURATION_MS
  ) {

    return {
      metric,

      baseline,

      comparison,

      absoluteChange,

      percentageChange:
        null,

      evidenceStatus:
        'insufficient_duration'
    }
  }


  const percentageChange =
    Number(
      (
        (
          absoluteChange /
          baseline
        ) *
        100
      ).toFixed(
        2
      )
    )


  return {
    metric,

    baseline,

    comparison,

    absoluteChange,

    percentageChange,

    evidenceStatus:
      'sufficient'
  }
}


function buildComparison(
  baselineWindow:
    PromotionPerformanceWindow,

  comparisonWindow:
    PromotionPerformanceWindow
):
  Record<
    PromotionPerformanceMetricKey,
    PromotionMetricChange
  > {

  const metrics:
    PromotionPerformanceMetricKey[] =
      [
        'views',
        'saves',
        'shares',
        'whatsappClicks',
        'emailInquiries',
        'buyerActions'
      ]


  return Object.fromEntries(
    metrics.map(
      metric => [
        metric,

        calculateMetricChange({
          metric,

          baselineWindow,

          comparisonWindow
        })
      ]
    )
  ) as
    Record<
      PromotionPerformanceMetricKey,
      PromotionMetricChange
    >
}


export class PromotionPerformanceError
  extends Error {

  code:
    | 'LISTING_ID_REQUIRED'
    | 'ENTITLEMENT_ID_REQUIRED'
    | 'PROMOTION_HISTORY_LOAD_FAILED'
    | 'INVALID_PROMOTION_HISTORY'
    | 'ACTIVITY_LOAD_FAILED'

  constructor(
    code:
      PromotionPerformanceError['code'],

    message:
      string
  ) {

    super(
      message
    )

    this.name =
      'PromotionPerformanceError'

    this.code =
      code
  }
}


export async function getPromotionPerformance({
  supabase,
  listingId,
  entitlementId,
  now = new Date()
}: {
  supabase:
    SupabaseClient

  listingId:
    string

  entitlementId:
    string

  now?:
    Date
}): Promise<
  PromotionPerformanceResult
> {

  if (
    !listingId
  ) {

    throw new PromotionPerformanceError(
      'LISTING_ID_REQUIRED',
      'A listing ID is required to resolve promotion performance.'
    )
  }


  if (
    !entitlementId
  ) {

    throw new PromotionPerformanceError(
      'ENTITLEMENT_ID_REQUIRED',
      'A promotion entitlement ID is required to resolve promotion performance.'
    )
  }


  const resolvedAt =
    now.toISOString()


  const nowTimestamp =
    now.getTime()


  if (
    !Number.isFinite(
      nowTimestamp
    )
  ) {

    throw new PromotionPerformanceError(
      'INVALID_PROMOTION_HISTORY',
      'Promotion Performance received an invalid resolution time.'
    )
  }


  let history:
    PromotionHistoryEvent[]


  try {

    history =
      await getPromotionHistory({
        supabase,
        listingId
      })

  } catch (
    error
  ) {

    throw new PromotionPerformanceError(
      'PROMOTION_HISTORY_LOAD_FAILED',
      error instanceof Error
        ? error.message
        : 'Promotion History could not be loaded.'
    )
  }


  const entitlementHistory =
    history.filter(
      event =>
        event.entitlementId ===
          entitlementId
    )


  if (
    entitlementHistory.length ===
      0
  ) {

    return {
      listingId,

      entitlementId,

      resolvedAt,

      status:
        'insufficient_evidence',

      reason:
        'No immutable Promotion History exists for this entitlement.'
    }
  }


  const activationEvents =
    entitlementHistory.filter(
      event =>
        event.eventType ===
          'promotion_activated'
    )


  if (
    activationEvents.length ===
      0
  ) {

    return {
      listingId,

      entitlementId,

      resolvedAt,

      status:
        'insufficient_evidence',

      reason:
        'Promotion History contains no promotion_activated event. Scheduled or pending promotion state is not active performance evidence.'
    }
  }


  const promotionSlug =
    entitlementHistory[0]
      .promotionSlug


  const activeIntervals =
    buildActiveIntervals({
      events:
        entitlementHistory,

      now:
        nowTimestamp
    })


  if (
    activeIntervals.length ===
      0
  ) {

    return {
      listingId,

      entitlementId,

      resolvedAt,

      status:
        'insufficient_evidence',

      reason:
        'Promotion History does not establish a measurable active interval.'
    }
  }


  const activeDurationMs =
    calculateTotalDuration(
      activeIntervals
    )


  if (
    activeDurationMs <=
      0
  ) {

    return {
      listingId,

      entitlementId,

      resolvedAt,

      status:
        'insufficient_evidence',

      reason:
        'Promotion active duration is zero.'
    }
  }


  const firstInterval =
    activeIntervals[0]


  const finalInterval =
    activeIntervals[
      activeIntervals.length -
      1
    ]


  const promotionStartedAt =
    timestamp(
      firstInterval.startsAt
    )


  const promotionEndEvent =
    [...entitlementHistory]
      .reverse()
      .find(
        event =>
          event.eventType ===
            'promotion_expired' ||
          event.eventType ===
            'promotion_cancelled'
      )


  const promotionStillActive =
    !promotionEndEvent &&
    finalInterval.endsAt ===
      resolvedAt


  const promotionEndedAt =
    promotionStillActive
      ? null
      : promotionEndEvent
        ? promotionEndEvent
            .occurredAt
        : finalInterval
            .endsAt


  /*
   * Equal-duration V1 comparison.
   *
   * Baseline immediately precedes first observed activation.
   */

  const beforeEnd =
    promotionStartedAt


  const beforeStart =
    beforeEnd -
    activeDurationMs


  /*
   * Post period begins after the final active interval.
   *
   * It only becomes a complete comparable period once an
   * equal duration has elapsed.
   */

  const finalActiveEnd =
    timestamp(
      finalInterval.endsAt
    )


  const afterStart =
    promotionStillActive
      ? null
      : finalActiveEnd


  const plannedAfterEnd =
    afterStart ===
      null
      ? null
      : afterStart +
        activeDurationMs


  const afterEnd =
    plannedAfterEnd ===
      null
      ? null
      : Math.min(
          plannedAfterEnd,
          nowTimestamp
        )


  /*
   * Load every relevant Activity Engine event in one query.
   */

  const queryEnd =
    afterEnd ??
    nowTimestamp


  const {
    data:
      activityData,

    error:
      activityError
  } =
    await supabase
      .from(
        'activity_events'
      )
      .select(`
        id,
        event_type,
        created_at
      `)
      .eq(
        'entity_type',
        'listing'
      )
      .eq(
        'entity_id',
        listingId
      )
      .in(
        'event_type',
        PERFORMANCE_EVENT_TYPES
      )
      .gte(
        'created_at',
        new Date(
          beforeStart
        ).toISOString()
      )
      .lt(
        'created_at',
        new Date(
          queryEnd
        ).toISOString()
      )
      .order(
        'created_at',
        {
          ascending:
            true
        }
      )


  if (
    activityError
  ) {

    throw new PromotionPerformanceError(
      'ACTIVITY_LOAD_FAILED',
      activityError.message
    )
  }


  const activityEvents =
    (
      activityData ??
      []
    ) as DatabaseActivityEvent[]


  const beforeEvents =
    filterEventsForRange({
      events:
        activityEvents,

      startsAt:
        beforeStart,

      endsAt:
        beforeEnd
    })


  const duringEvents =
    filterEventsForIntervals({
      events:
        activityEvents,

      intervals:
        activeIntervals
    })


  const afterEvents =
    afterStart ===
      null ||
    afterEnd ===
      null
      ? []
      : filterEventsForRange({
          events:
            activityEvents,

          startsAt:
            afterStart,

          endsAt:
            afterEnd
        })


  const before =
    createWindow({
      type:
        'before',

      startsAt:
        beforeStart,

      endsAt:
        beforeEnd,

      counts:
        countActivityEvents(
          beforeEvents
        ),

      observedEventCount:
        beforeEvents.length,

      available:
        true,

      complete:
        true
    })


  /*
   * During may contain several operational intervals.
   *
   * The displayed outer boundary is first-start to
   * final-end, while durationMs represents actual active
   * exposure time.
   */

  const duringCounts =
    countActivityEvents(
      duringEvents
    )


  const during:
    PromotionPerformanceWindow = {

    type:
      'during',

    available:
      true,

    complete:
      !promotionStillActive,

    startsAt:
      firstInterval.startsAt,

    endsAt:
      finalInterval.endsAt,

    durationMs:
      activeDurationMs,

    durationHours:
      hoursFromMs(
        activeDurationMs
      ),

    counts:
      duringCounts,

    observedEventCount:
      duringEvents.length,

    evidenceStatus:
      activeDurationMs <
        MINIMUM_COMPARABLE_DURATION_MS
        ? 'insufficient_duration'
        : duringEvents.length ===
            0
          ? 'no_observed_events'
          : 'sufficient'
  }


  const afterAvailable =
    afterStart !==
      null &&
    afterEnd !==
      null


  const afterComplete =
    afterAvailable &&
    plannedAfterEnd !==
      null &&
    nowTimestamp >=
      plannedAfterEnd


  const after =
    createWindow({
      type:
        'after',

      startsAt:
        afterStart,

      endsAt:
        afterEnd,

      counts:
        countActivityEvents(
          afterEvents
        ),

      observedEventCount:
        afterEvents.length,

      available:
        afterAvailable,

      complete:
        afterComplete
    })


  const beforeToDuring =
    buildComparison(
      before,
      during
    )


  const duringToAfter =
    after.available &&
    after.complete
      ? buildComparison(
          during,
          after
        )
      : null


  const interpretationAvailable =
    before.durationMs >=
      MINIMUM_COMPARABLE_DURATION_MS &&
    during.durationMs >=
      MINIMUM_COMPARABLE_DURATION_MS &&
    before.durationMs ===
      during.durationMs


  let interpretationStatus:
    PromotionPerformanceEvidenceStatus


  if (
    !interpretationAvailable
  ) {

    interpretationStatus =
      'insufficient_duration'

  } else if (
    before.observedEventCount ===
      0
  ) {

    interpretationStatus =
      'no_observed_events'

  } else {

    interpretationStatus =
      'sufficient'
  }


  const notes:
    string[] = [
      'Performance describes observed listing behavior and does not establish that promotion caused the observed change.',
      'Percentage change is withheld when the baseline count is zero.',
      'Performance interpretation requires equal-duration comparison periods of at least 24 hours.',
      'A zero count means no matching Activity Engine event was observed; it does not prove historical instrumentation coverage was complete.'
    ]


  if (
    promotionStillActive
  ) {

    notes.push(
      'The promotion is still active, so no post-promotion comparison period is available.'
    )
  }


  if (
    after.available &&
    !after.complete
  ) {

    notes.push(
      'The post-promotion window is still accumulating and is not yet comparable with the promotion-active period.'
    )
  }


  if (
    activeIntervals.length >
      1
  ) {

    notes.push(
      'The promotion contains multiple observed active intervals. During-period counts include only intervals supported by immutable Promotion History.'
    )
  }


  return {
    listingId,

    entitlementId,

    promotionSlug,

    resolvedAt,

    promotionStartedAt:
      new Date(
        promotionStartedAt
      ).toISOString(),

    promotionEndedAt,

    promotionStillActive,

    activeDurationMs,

    activeDurationHours:
      hoursFromMs(
        activeDurationMs
      ),

    activeIntervals,

    before,

    during,

    after,

    comparison: {
      beforeToDuring,

      duringToAfter
    },

    interpretationAvailable,

    interpretationStatus,

    listingClicksSupported:
      false,

    notes
  }
}