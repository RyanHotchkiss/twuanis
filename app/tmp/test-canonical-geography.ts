import {
  resolveCanonicalGeography,
  type CanonicalGeographyTerm
} from '@/lib/geography/canonical-geography'


const terms: CanonicalGeographyTerm[] = [
  {
    id: 10,
    parent_id: 9,
    term_type: 'province',
    term_name: 'San José',
    term_name_en: 'San Jose',
    term_name_es: 'San José',
    slug: 'san-jose',
    slug_en: 'san-jose',
    slug_es: 'san-jose',
    official_code: '1'
  },
  {
    id: 11,
    parent_id: 9,
    term_type: 'province',
    term_name: 'Alajuela',
    term_name_en: 'Alajuela',
    term_name_es: 'Alajuela',
    slug: 'alajuela',
    slug_en: 'alajuela',
    slug_es: 'alajuela',
    official_code: '2'
  },
  {
    id: 13,
    parent_id: 9,
    term_type: 'province',
    term_name: 'Heredia',
    term_name_en: 'Heredia',
    term_name_es: 'Heredia',
    slug: 'heredia',
    slug_en: 'heredia',
    slug_es: 'heredia',
    official_code: '4'
  },

  {
    id: 17,
    parent_id: 10,
    term_type: 'canton',
    term_name: 'San José',
    term_name_en: 'San Jose',
    term_name_es: 'San José',
    slug: 'san-jose',
    slug_en: 'san-jose',
    slug_es: 'san-jose',
    official_code: '101'
  },
  {
    id: 18,
    parent_id: 10,
    term_type: 'canton',
    term_name: 'Escazú',
    term_name_en: 'Escazu',
    term_name_es: 'Escazú',
    slug: 'escazu',
    slug_en: 'escazu',
    slug_es: 'escazu',
    official_code: '102'
  },
  {
    id: 25,
    parent_id: 10,
    term_type: 'canton',
    term_name: 'Santa Ana',
    term_name_en: 'Santa Ana',
    term_name_es: 'Santa Ana',
    slug: 'santa-ana',
    slug_en: 'santa-ana',
    slug_es: 'santa-ana',
    official_code: '109'
  },
  {
    id: 29,
    parent_id: 10,
    term_type: 'canton',
    term_name: 'Tibás',
    term_name_en: 'Tibas',
    term_name_es: 'Tibás',
    slug: 'tibas',
    slug_en: 'tibas',
    slug_es: 'tibas',
    official_code: '113'
  },
  {
    id: 37,
    parent_id: 11,
    term_type: 'canton',
    term_name: 'Alajuela',
    term_name_en: 'Alajuela',
    term_name_es: 'Alajuela',
    slug: 'alajuela',
    slug_en: 'alajuela',
    slug_es: 'alajuela',
    official_code: '201'
  },

  {
    id: 614,
    parent_id: 17,
    term_type: 'district',
    term_name: 'Carmen',
    term_name_en: 'Carmen',
    term_name_es: 'Carmen',
    slug: 'carmen',
    slug_en: 'carmen',
    slug_es: 'carmen',
    official_code: '10101'
  },
  {
    id: 625,
    parent_id: 18,
    term_type: 'district',
    term_name: 'Escazú',
    term_name_en: 'Escazu',
    term_name_es: 'Escazú',
    slug: 'escazu',
    slug_en: 'escazu',
    slug_es: 'escazu',
    official_code: '10201'
  },
  {
    id: 674,
    parent_id: 25,
    term_type: 'district',
    term_name: 'Santa Ana',
    term_name_en: 'Santa Ana',
    term_name_es: 'Santa Ana',
    slug: 'santa-ana',
    slug_en: 'santa-ana',
    slug_es: 'santa-ana',
    official_code: '10901'
  },
  {
    id: 679,
    parent_id: 25,
    term_type: 'district',
    term_name: 'Brasil',
    term_name_en: 'Brasil',
    term_name_es: 'Brasil',
    slug: 'brasil',
    slug_en: 'brasil',
    slug_es: 'brasil',
    official_code: '10906'
  },
  {
    id: 737,
    parent_id: 37,
    term_type: 'district',
    term_name: 'Alajuela',
    term_name_en: 'Alajuela',
    term_name_es: 'Alajuela',
    slug: 'alajuela',
    slug_en: 'alajuela',
    slug_es: 'alajuela',
    official_code: '20101'
  }
]


function assert(
  condition: boolean,
  message: string
) {
  if (!condition) {
    throw new Error(message)
  }
}


function runTest(
  name: string,
  test: () => void
) {
  try {
    test()
    console.log(`🟩 ${name}`)
  } catch (error) {
    console.error(`🟥 ${name}`)
    throw error
  }
}


runTest(
  'Province suffix resolves canonically',
  () => {
    const result =
      resolveCanonicalGeography({
        province:
          'San José provincia',
        canton: null,
        district: null,
        terms
      })

    assert(
      result.province?.id === 10,
      'Expected San José Province'
    )

    assert(
      result.reasons.province ===
        'resolved',
      'Expected resolved Province'
    )

    assert(
      result.reasons.canton ===
        'missing',
      'Expected missing Canton'
    )
  }
)


runTest(
  'Capital alias resolves under canonical Province',
  () => {
    const result =
      resolveCanonicalGeography({
        province:
          'San José provincia',
        canton:
          'San José Capital',
        district:
          'Carmen',
        terms
      })

    assert(
      result.province?.id === 10,
      'Expected San José Province'
    )

    assert(
      result.canton?.id === 17,
      'Expected San José Canton'
    )

    assert(
      result.district?.id === 614,
      'Expected Carmen District'
    )

    assert(
      result.complete,
      'Expected complete geography'
    )
  }
)


runTest(
  'Escazú hierarchy resolves completely',
  () => {
    const result =
      resolveCanonicalGeography({
        province:
          'San José provincia',
        canton: 'Escazú',
        district: 'Escazú',
        terms
      })

    assert(
      result.province?.id === 10,
      'Expected San José Province'
    )

    assert(
      result.canton?.id === 18,
      'Expected Escazú Canton'
    )

    assert(
      result.district?.id === 625,
      'Expected Escazú District'
    )

    assert(
      result.complete,
      'Expected complete geography'
    )
  }
)


runTest(
  'Santa Ana and Brasil resolve completely',
  () => {
    const result =
      resolveCanonicalGeography({
        province:
          'San José provincia',
        canton: 'Santa Ana',
        district: 'Brasil',
        terms
      })

    assert(
      result.canton?.id === 25,
      'Expected Santa Ana Canton'
    )

    assert(
      result.district?.id === 679,
      'Expected Brasil District'
    )

    assert(
      result.complete,
      'Expected complete geography'
    )
  }
)


runTest(
  'Centro suffix resolves central district',
  () => {
    const result =
      resolveCanonicalGeography({
        province: 'Alajuela',
        canton: 'Alajuela',
        district:
          'Alajuela Centro',
        terms
      })

    assert(
      result.province?.id === 11,
      'Expected Alajuela Province'
    )

    assert(
      result.canton?.id === 37,
      'Expected Alajuela Canton'
    )

    assert(
      result.district?.id === 737,
      'Expected Alajuela District'
    )

    assert(
      result.complete,
      'Expected complete geography'
    )
  }
)


runTest(
  'Canton supplied as Province becomes hierarchy conflict',
  () => {
    const result =
      resolveCanonicalGeography({
        province: 'Tibás',
        canton: null,
        district: null,
        terms
      })

    assert(
      result.province === null,
      'Tibás must not resolve as Province'
    )

    assert(
      result.reasons.province ===
        'hierarchy_conflict',
      'Expected hierarchy conflict'
    )
  }
)


runTest(
  'Missing District remains missing',
  () => {
    const result =
      resolveCanonicalGeography({
        province:
          'San José provincia',
        canton: 'Escazú',
        district: null,
        terms
      })

    assert(
      result.province?.id === 10,
      'Expected Province resolution'
    )

    assert(
      result.canton?.id === 18,
      'Expected Canton resolution'
    )

    assert(
      result.district === null,
      'District should remain null'
    )

    assert(
      result.reasons.district ===
        'missing',
      'Expected missing District'
    )

    assert(
      !result.complete,
      'Incomplete geography must not report complete'
    )
  }
)


runTest(
  'Unknown District remains unrecognized',
  () => {
    const result =
      resolveCanonicalGeography({
        province:
          'San José provincia',
        canton: 'San José',
        district:
          'Barrio Escalante',
        terms
      })

    assert(
      result.province?.id === 10,
      'Expected Province resolution'
    )

    assert(
      result.canton?.id === 17,
      'Expected Canton resolution'
    )

    assert(
      result.district === null,
      'Unknown District must not be guessed'
    )

    assert(
      result.reasons.district ===
        'unrecognized',
      'Expected unrecognized District'
    )
  }
)


console.log(
  '🟩 Canonical geography boundary tests passed'
)