/*
 * ---------------------------------------------------------
 * CANONICAL ANALYTICAL DATE
 * ---------------------------------------------------------
 *
 * Purpose:
 *
 * Resolve the calendar date associated with a Twuanis
 * analytical computation.
 *
 * Twuanis currently operates against the Costa Rican real
 * estate market. Analytical dates therefore use the
 * Costa Rican civil calendar rather than the server's
 * timezone or UTC calendar date.
 *
 * IMPORTANT:
 *
 * Analytical date is NOT:
 *
 * - listing created_at
 * - listing updated_at
 * - listing published_at
 * - FX effective date
 *
 * It represents the date of the analytical market state.
 */


export const TWUANIS_ANALYTICAL_TIME_ZONE =
  'America/Costa_Rica'


export function getCurrentAnalyticalDate():
  string {

  const parts =
    new Intl.DateTimeFormat(
      'en-CA',
      {
        timeZone:
          TWUANIS_ANALYTICAL_TIME_ZONE,

        year:
          'numeric',

        month:
          '2-digit',

        day:
          '2-digit'
      }
    )
      .formatToParts(
        new Date()
      )


  const year =
    parts.find(
      part =>
        part.type === 'year'
    )?.value


  const month =
    parts.find(
      part =>
        part.type === 'month'
    )?.value


  const day =
    parts.find(
      part =>
        part.type === 'day'
    )?.value


  if (
    !year ||
    !month ||
    !day
  ) {
    throw new Error(
      'Unable to resolve canonical Twuanis analytical date.'
    )
  }


  return `${year}-${month}-${day}`
}