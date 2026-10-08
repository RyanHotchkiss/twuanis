import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import { customerEditDomains } from '@/lib/canonical-customer-edit'
import { resolveListingGeography } from '@/lib/geography/resolve-listing-geography'

export function csvEvidenceEnvelope(row: Record<string, unknown>) {
  if(typeof row.source_observation_input!=='string'||typeof row.unresolved_normalizer_review!=='string')throw Error('Original observation evidence is required; historical CSV cannot be promoted.')
  if(row.source_observation_input.length>262144||row.unresolved_normalizer_review.length>65536)throw Error('Observation exceeds evidence bounds.')
  const raw=JSON.parse(row.source_observation_input),review=JSON.parse(row.unresolved_normalizer_review)
  if(!raw||Array.isArray(raw)||typeof raw!=='object'||!review||Array.isArray(review)||review.status!=='unresolved'||review.canonical_authority!==false||!review.values||Array.isArray(review.values)||typeof review.values!=='object')throw Error('Separate raw and noncanonical review objects required.')
  // The surviving CSV parser emits strings. Reject numeric/object coercion that could lose source precision.
  if(Object.values(raw).some(value=>typeof value!=='string'))throw Error('Lossless original CSV string fields required.')
  for(const key of ['source_name','source_listing_id','observation_id','observed_at'])if(typeof raw[key]!=='string'||!raw[key].trim()||row[key]!==raw[key])throw Error('Genuine observation metadata is missing or inconsistent.')
  if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/.test(raw.observed_at)||!Number.isFinite(Date.parse(raw.observed_at)))throw Error('Explicit genuine observation timestamp required.')
  return {raw,review}
}

export async function ingestCsvObservation(
  admin: SupabaseClient,
  row: Record<string, unknown>,
  // Human-triggered ingestion supplies an actor-bound transport. Geography reads stay separate.
  writes: Pick<SupabaseClient, 'rpc'> = admin
) {
  const { raw, review } =
    csvEvidenceEnvelope(row)

  /*
   * Retain genuine source evidence first.
   *
   * Failure of the Twuanis evidence-eligibility
   * contract must never erase the observation.
   */
  const retained =
    await writes.rpc(
      'retain_csv_source_evidence',
      {
        p_raw: raw,
        p_review: review
      }
    )

  if (
    retained.error ||
    typeof retained.data !== 'string'
  ) {
    throw Error(
      retained.error?.message ||
      'Evidence retention not confirmed.'
    )
  }

  const evidenceId =
    retained.data

  try {
    /*
     * Only explicit source property_type may
     * establish canonical property identity.
     */
    if (
      typeof raw.property_type !== 'string' ||
      !raw.property_type.trim()
    ) {
      throw Error(
        'Source-supported property type is missing; inferred type remains unresolved.'
      )
    }

    if (
      !['sale', 'rent'].includes(
        raw.transaction_type
      )
    ) {
      throw Error(
        'Explicit original transaction required.'
      )
    }

    const geography =
      await resolveListingGeography({
        supabase: admin,
        province: raw.province,
        canton: raw.canton,
        district: raw.district
      })

    if (
      !geography.province ||
      !geography.canton
    ) {
      throw Error(
        'Exact geographic identity is unresolved.'
      )
    }

    const normalizedPropertyType =
        typeof row.property_type === 'string'
          ? row.property_type.trim()
          : ''

      if (!normalizedPropertyType) {
        throw Error(
          'Normalized canonical property type is missing.'
        )
      }

      const changes: Record<string, unknown> = {
        property_type: normalizedPropertyType,
      province: geography.province.term_name,
      canton: geography.canton.term_name,
      district:
        geography.district?.term_name ??
        null
    }

    /*
     * PRICE / MONETARY IDENTITY
     *
     * A canonical analytical listing requires
     * an exact positive asking price in an
     * explicitly supported currency.
     */
    const money =
      raw.transaction_type === 'sale'
        ? 'current_price'
        : 'monthly_price'

    const rawMoney =
      raw[money]

    if (
      typeof rawMoney !== 'string' ||
      !/^\d+(\.\d+)?$/.test(rawMoney) ||
      Number(rawMoney) <= 0 ||
      !['CRC', 'USD'].includes(
        String(raw.currency)
      )
    ) {
      throw Error(
        'Canonical evidence requires an exact positive asking price and supported currency.'
      )
    }

    changes[money] =
      rawMoney

    changes.currency =
      raw.currency

    /*
     * CONTACT
     *
     * Twuanis currently exposes WhatsApp as the
     * permitted listing contact path. Therefore
     * a valid international WhatsApp number is
     * required for canonical analytical listing
     * creation.
     */
    const whatsapp =
      typeof raw.whatsapp === 'string'
        ? raw.whatsapp.trim()
        : ''

    if (
      !/^\+\d{8,15}$/.test(
        whatsapp
      )
    ) {
      throw Error(
        'Canonical evidence requires a valid WhatsApp contact number.'
      )
    }

    changes.whatsapp =
      whatsapp

    for (
      const key of [
        'title',
        'description'
      ]
    ) {
      if (
        typeof raw[key] === 'string'
      ) {
        changes[key] =
          raw[key]
      }
    }

    /*
     * Resolve canonical geography and semantic
     * identity before evidence eligibility is
     * evaluated.
     *
     * Unsupported source property types fail
     * positive ontology resolution here.
     */
    const {
      domains,
      content
    } =
      await customerEditDomains(
        admin,
        changes,
        {
          transaction_type:
            raw.transaction_type
        }
      )

    /*
     * Exact source facts only.
     */
    const facts:
      Record<string, unknown> = {}

    for (
      const [dimension, key]
      of [
        ['bedrooms', 'raw_bedrooms'],
        ['bathrooms', 'raw_bathrooms'],
        ['parking', 'raw_parking'],
        ['year_built', 'raw_year_built']
      ]
    ) {
      const value =
        raw[key]

      if (
        (
          typeof value === 'string' ||
          typeof value === 'number'
        ) &&
        /^\d+(\.\d+)?$/.test(
          String(value)
        )
      ) {
        facts[dimension] = {
          kind: 'exact',
          value: String(value),
          reference:
            `csv-source-evidence:${evidenceId}:${key}`
        }
      }
    }

    /*
     * EXACT AREA EVIDENCE
     *
     * Explicit square-meter source measurements
     * only.
     *
     * Bare numbers, approximate values, ranges,
     * lower/upper bounds and heuristic normalized
     * values do not establish exact measurements.
     */
    const measurements:
      Record<string, { value: string }> = {}

    for (
      const dim of [
        'property_area',
        'construction_area'
      ]
    ) {
      const sourceValue =
        raw[`raw_${dim}`]

      const match =
        typeof sourceValue === 'string'
          ? sourceValue.match(
              /^(\d+(?:\.\d+)?)\s*(?:m²|m2)$/
            )
          : null

      if (
        match &&
        Number(match[1]) > 0
      ) {
        measurements[dim] = {
          value: match[1]
        }
      }
    }

    /*
     * SOURCE-INGESTION EVIDENCE ELIGIBILITY
     *
     * This gate is intentionally more forgiving
     * than future Twuanis customer publication
     * requirements.
     *
     * It governs whether retained external-source
     * evidence may enter the canonical analytical
     * listing population.
     */

    const propertyTypeIds =
      domains?.semantics?.property_type

    if (
      !Array.isArray(propertyTypeIds) ||
      propertyTypeIds.length !== 1
    ) {
      throw Error(
        'Canonical property type identity is unresolved.'
      )
    }

    const propertyTypeId =
      String(propertyTypeIds[0])

    const hasPropertyArea =
      Boolean(
        measurements.property_area
      )

    const hasConstructionArea =
      Boolean(
        measurements.construction_area
      )

    switch (propertyTypeId) {
      /*
       * House
       */
      case '1115':
        if (
          !hasPropertyArea ||
          !hasConstructionArea
        ) {
          throw Error(
            'House evidence requires exact property and construction area.'
          )
        }
        break

      /*
       * Condo
       */
      case '1116':
        if (
          !hasConstructionArea
        ) {
          throw Error(
            'Condo evidence requires exact construction area.'
          )
        }
        break

      /*
       * Land
       */
      case '1117':
        if (
          !hasPropertyArea
        ) {
          throw Error(
            'Land evidence requires exact property area.'
          )
        }
        break

      /*
       * Farm
       */
      case '1118':
        if (
          !hasPropertyArea
        ) {
          throw Error(
            'Farm evidence requires exact property area.'
          )
        }
        break

      /*
       * Cabin
       */
      case '1119':
        if (
          !hasPropertyArea ||
          !hasConstructionArea
        ) {
          throw Error(
            'Cabin evidence requires exact property and construction area.'
          )
        }
        break

      /*
       * Commercial Property
       *
       * External-source ingestion is deliberately
       * more permissive than future customer
       * publication: construction area is required;
       * property area is optional.
       */
      case '1120':
        if (
          !hasConstructionArea
        ) {
          throw Error(
            'Commercial Property source evidence requires exact construction area.'
          )
        }
        break

      default:
        throw Error(
          'Property type is outside the authorized Twuanis analytical population.'
        )
    }

    const input = {
      transaction:
        raw.transaction_type,
      ...domains,
      facts,
      measurements,
      content
    }

    const applied =
      await writes.rpc(
        'ingest_canonical_source_observation',
        {
          p_evidence:
            evidenceId,
          p_input:
            input
        }
      )

    if (
      applied.error ||
      typeof applied.data?.listing_id !==
        'string'
    ) {
      throw Error(
        applied.error?.message ||
        'Canonical ingestion not confirmed; retry same observation.'
      )
    }

    const listingId =
      applied.data.listing_id

    if (
      ![
        'accepted',
        'succeeded'
      ].includes(
        applied.data.outcome
      )
    ) {
      return {
        success: false,
        evidenceId,
        listingId,
        error:
          `Source observation ${applied.data.outcome}; evidence retained.`
      }
    }

    return {
      success: true,
      evidenceId,
      listingId
    }
  } catch (error) {
    return {
      success: false,
      evidenceId,
      error:
        error instanceof Error
          ? error.message
          : 'Canonical creation rejected; evidence retained.'
    }
  }
}
