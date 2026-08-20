export type CanonicalGeographyTerm = {
  id: number
  parent_id: number | null
  term_name: string
  term_name_en: string | null
  term_name_es: string | null
  slug: string
  slug_en: string | null
  slug_es: string | null
  official_code: string | null
  term_type:
    | 'province'
    | 'canton'
    | 'district'
}


export type GeographyResolutionReason =
  | 'resolved'
  | 'missing'
  | 'unrecognized'
  | 'ambiguous'
  | 'hierarchy_conflict'


export type CanonicalGeographyResolution = {
  source: {
    province: string | null
    canton: string | null
    district: string | null
  }

  province: CanonicalGeographyTerm | null
  canton: CanonicalGeographyTerm | null
  district: CanonicalGeographyTerm | null

  reasons: {
    province: GeographyResolutionReason
    canton: GeographyResolutionReason
    district: GeographyResolutionReason
  }

  complete: boolean
}


function normalizeGeographyValue(
  value: unknown
): string {
  return String(
    value ?? ''
  )
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(
      /[\u0300-\u036f]/g,
      ''
    )
    .replace(
      /[^a-z0-9\s]/g,
      ' '
    )
    .replace(
      /\s+/g,
      ' '
    )
    .trim()
}


function aliasesForTerm(
  term: CanonicalGeographyTerm
): string[] {
  return [
    term.term_name,
    term.term_name_en,
    term.term_name_es,
    term.slug,
    term.slug_en,
    term.slug_es
  ]
    .filter(
      (
        value
      ): value is string =>
        Boolean(value)
    )
    .map(
      normalizeGeographyValue
    )
}


function sourceAliases(
  value: string | null,
  type:
    | 'province'
    | 'canton'
    | 'district'
): string[] {

  if (!value) {
    return []
  }


  const normalized =
    normalizeGeographyValue(
      value
    )


  const aliases =
    new Set<string>([
      normalized
    ])


  if (
    type ===
      'province'
  ) {

    aliases.add(
      normalized
        .replace(
          /\bprovincia\b/g,
          ''
        )
        .replace(
          /\s+/g,
          ' '
        )
        .trim()
    )
  }


  if (
    type ===
      'canton'
  ) {

    aliases.add(
      normalized
        .replace(
          /\bcanton\b/g,
          ''
        )
        .replace(
          /\s+/g,
          ' '
        )
        .trim()
    )


    /*
     * Source vocabulary sometimes uses "Capital"
     * for the central canton.
     *
     * Example:
     * "San José Capital" → Canton San José
     *
     * This remains deterministic because matching
     * also requires the canonical Province parent.
     */

    aliases.add(
      normalized
        .replace(
          /\bcapital\b/g,
          ''
        )
        .replace(
          /\s+/g,
          ' '
        )
        .trim()
    )
  }


  if (
    type ===
      'district'
  ) {

    /*
     * Some sources append "Centro" to the
     * central district name.
     *
     * Example:
     * "Alajuela Centro" → District Alajuela
     *
     * Parent Canton identity is still required.
     */

    aliases.add(
      normalized
        .replace(
          /\bcentro\b/g,
          ''
        )
        .replace(
          /\s+/g,
          ' '
        )
        .trim()
    )
  }


  return Array.from(
    aliases
  ).filter(Boolean)
}


function findMatches({
  terms,
  value,
  type,
  parentId
}: {
  terms: CanonicalGeographyTerm[]

  value:
    string | null

  type:
    CanonicalGeographyTerm[
      'term_type'
    ]

  parentId?:
    number | null
}): CanonicalGeographyTerm[] {

  if (!value) {
    return []
  }


  const sourceValues =
    sourceAliases(
      value,
      type
    )


  return terms.filter(
    term => {

      if (
        term.term_type !==
          type
      ) {
        return false
      }


      if (
        parentId !==
          undefined &&
        term.parent_id !==
          parentId
      ) {
        return false
      }


      const termAliases =
        aliasesForTerm(
          term
        )


      return sourceValues.some(
        sourceValue =>
          termAliases.includes(
            sourceValue
          )
      )
    }
  )
}


function resolveReason({
  sourceValue,
  matches
}: {
  sourceValue:
    string | null

  matches:
    CanonicalGeographyTerm[]
}): GeographyResolutionReason {

  if (!sourceValue) {
    return 'missing'
  }


  if (
    matches.length ===
      0
  ) {
    return 'unrecognized'
  }


  if (
    matches.length >
      1
  ) {
    return 'ambiguous'
  }


  return 'resolved'
}


export function resolveCanonicalGeography({
  province,
  canton,
  district,
  terms
}: {
  province:
    string | null | undefined

  canton:
    string | null | undefined

  district:
    string | null | undefined

  terms:
    CanonicalGeographyTerm[]
}): CanonicalGeographyResolution {

  const sourceProvince =
    province?.trim() ||
    null

  const sourceCanton =
    canton?.trim() ||
    null

  const sourceDistrict =
    district?.trim() ||
    null


  const provinceMatches =
    findMatches({
      terms,
      value:
        sourceProvince,
      type:
        'province'
    })


  const resolvedProvince =
    provinceMatches.length ===
      1
      ? provinceMatches[0]
      : null


  let provinceReason =
    resolveReason({
      sourceValue:
        sourceProvince,
      matches:
        provinceMatches
    })


  /*
   * If the source value resolves as another
   * geography level, that is not merely
   * unrecognized. It contradicts the hierarchy.
   */

  if (
    sourceProvince &&
    provinceMatches.length ===
      0
  ) {

    const wrongLevelMatch =
      findMatches({
        terms,
        value:
          sourceProvince,
        type:
          'canton'
      }).length > 0 ||
      findMatches({
        terms,
        value:
          sourceProvince,
        type:
          'district'
      }).length > 0


    if (wrongLevelMatch) {
      provinceReason =
        'hierarchy_conflict'
    }
  }


  const cantonMatches =
    resolvedProvince
      ? findMatches({
          terms,
          value:
            sourceCanton,
          type:
            'canton',
          parentId:
            resolvedProvince.id
        })
      : []


  const resolvedCanton =
    cantonMatches.length ===
      1
      ? cantonMatches[0]
      : null


  let cantonReason:
    GeographyResolutionReason


  if (!sourceCanton) {
    cantonReason =
      'missing'
  } else if (
    !resolvedProvince
  ) {
    cantonReason =
      'hierarchy_conflict'
  } else {
    cantonReason =
      resolveReason({
        sourceValue:
          sourceCanton,
        matches:
          cantonMatches
      })
  }


  const districtMatches =
    resolvedCanton
      ? findMatches({
          terms,
          value:
            sourceDistrict,
          type:
            'district',
          parentId:
            resolvedCanton.id
        })
      : []


  const resolvedDistrict =
    districtMatches.length ===
      1
      ? districtMatches[0]
      : null


  let districtReason:
    GeographyResolutionReason


  if (!sourceDistrict) {
    districtReason =
      'missing'
  } else if (
    !resolvedCanton
  ) {
    districtReason =
      'hierarchy_conflict'
  } else {
    districtReason =
      resolveReason({
        sourceValue:
          sourceDistrict,
        matches:
          districtMatches
      })
  }


  return {
    source: {
      province:
        sourceProvince,

      canton:
        sourceCanton,

      district:
        sourceDistrict
    },

    province:
      resolvedProvince,

    canton:
      resolvedCanton,

    district:
      resolvedDistrict,

    reasons: {
      province:
        provinceReason,

      canton:
        cantonReason,

      district:
        districtReason
    },

    complete:
      Boolean(
        resolvedProvince &&
        resolvedCanton &&
        resolvedDistrict
      )
  }
}