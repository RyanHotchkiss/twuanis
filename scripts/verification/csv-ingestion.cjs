const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const assert = require('node:assert/strict')

const root = path.resolve(__dirname, '../..')
const ts = require(root + '/node_modules/typescript')

let count = 0
const calls = []

function ok(value, message) {
  assert.ok(value, message)
  count++
  console.log('PASS', message)
}

function load(file, deps) {
  const module = { exports: {} }

  vm.runInNewContext(
    ts.transpileModule(
      fs.readFileSync(root + '/' + file, 'utf8'),
      {
        compilerOptions: {
          module: ts.ModuleKind.CommonJS,
          target: ts.ScriptTarget.ES2022
        }
      }
    ).outputText,
    {
      module,
      exports: module.exports,
      process: { env: {} },
      TextDecoder,
      Buffer,
      require(key) {
        if (key === 'server-only') return {}
        if (key in deps) return deps[key]
        throw Error(key)
      },
      fetch() {
        throw Error('network forbidden')
      }
    }
  )

  return module.exports
}

const TYPE_IDS = {
  House: '1115',
  Condo: '1116',
  Land: '1117',
  Farm: '1118',
  Cabin: '1119',
  'Commercial Property': '1120'
}

let canonicalInput
let persistenceFailure = false
let canonicalFailure = false

const engine = load(
  'lib/csv-source-ingestion.ts',
  {
    '@/lib/canonical-customer-edit': {
      customerEditDomains:
        async (db, changes) => {
          canonicalInput = changes

          const typeId =
            TYPE_IDS[changes.property_type]

          if (!typeId) {
            throw Error(
              'Selection identity is missing or ambiguous.'
            )
          }

          return {
            domains: {
              geography: {
                province: '3',
                canton: '304',
                district: '30403'
              },
              semantics: {
                property_type: [typeId]
              },
              money: {
                amount:
                  changes.current_price ??
                  changes.monthly_price,
                currency:
                  changes.currency
              }
            },
            content: {
              title:
                typeof changes.title === 'string'
                  ? changes.title
                  : '',
              description:
                typeof changes.description === 'string'
                  ? changes.description
                  : '',
              whatsapp:
                typeof changes.whatsapp === 'string'
                  ? changes.whatsapp
                  : ''
            }
          }
        }
    }
  }
)

const admin = {
  rpc: async (name, args) => {
    calls.push({ name, args })

    if (name === 'retain_csv_source_evidence') {
      if (persistenceFailure) {
        return {
          error: {
            message: 'conflict'
          }
        }
      }

      return {
        data:
          '07000000-0000-0000-0000-000000001818'
      }
    }

    if (name === 'ingest_canonical_source_observation') {
      if (canonicalFailure) {
        return {
          error: {
            message: 'canonical failure'
          }
        }
      }

      return {
        data: {
          listing_id: 'listing',
          outcome: 'accepted'
        }
      }
    }

    throw Error(`Unexpected RPC: ${name}`)
  },

  storage: {
    from() {
      throw Error('source media storage forbidden')
    }
  },

  from() {
    throw Error('unexpected database population read')
  }
}

function baseRaw(propertyType = 'House') {
  return {
    source_name: 'encuentra24',
    source_listing_id: 'source',
    observation_id: 'genuine',
    observed_at: '2026-09-30T01:02:03Z',

    property_type: propertyType,
    transaction_type: 'sale',

    province: 'Cartago',
    canton: 'Jiménez',
    district: 'Pejibaye',

    title: 'Canonical source test',
    description: 'Source description',

    current_price: '250000',
    monthly_price: '',
    currency: 'USD',

    whatsapp: '+50688887777',

    raw_bathrooms: '2.5',
    raw_bedrooms: '2',
    raw_parking: '2',
    raw_year_built: '1997',

    raw_property_area: '850.75 m²',
    raw_construction_area: '240.5 m²',

    images:
      'https://photos.encuentra24.com/example.jpg'
  }
}

function row(raw) {
  return {
    ...raw,

    property_type: 'INFERRED',
    bathrooms: '3 Bathrooms',

    source_observation_input:
      JSON.stringify(raw),

    unresolved_normalizer_review:
      JSON.stringify({
        status: 'unresolved',
        canonical_authority: false,
        values: {
          bathrooms: '3 Bathrooms',
          environment: 'Beachfront'
        }
      })
  }
}

function canonicalCalls() {
  return calls.filter(
    call =>
      call.name ===
      'ingest_canonical_source_observation'
  )
}

async function expectAccepted(raw, message) {
  calls.length = 0

  const result =
    await engine.ingestCsvObservation(
      admin,
      row(raw)
    )

  ok(
    result.success === true,
    message
  )

  ok(
    calls.map(call => call.name).join(',') ===
      'retain_csv_source_evidence,ingest_canonical_source_observation',
    `${message}: retention precedes canonical ingestion`
  )

  return canonicalCalls()[0].args
}

async function expectBlocked(
  raw,
  expectedMessage,
  message
) {
  calls.length = 0

  const result =
    await engine.ingestCsvObservation(
      admin,
      row(raw)
    )

  ok(
    result.success === false &&
      Boolean(result.evidenceId),
    `${message}: evidence retained`
  )

  ok(
    canonicalCalls().length === 0,
    `${message}: canonical ingestion blocked`
  )

  if (expectedMessage) {
    ok(
      String(result.error).includes(
        expectedMessage
      ),
      `${message}: expected rejection reason`
    )
  }
}

;(async () => {
  /*
   * ACCEPTED PROPERTY TYPES
   */

  let input =
    await expectAccepted(
      baseRaw('House'),
      'House with exact property and construction area accepted'
    )

  ok(
    input.p_input.measurements
      .property_area.value === '850.75' &&
    input.p_input.measurements
      .construction_area.value === '240.5',
    'House exact areas preserved'
  )

  ok(
    input.p_input.facts
      .bathrooms.value === '2.5',
    'fractional bathroom preserved without rounding'
  )

  ok(
    input.p_input.facts
      .year_built.value === '1997',
    'exact source year preserved'
  )

  ok(
    canonicalInput.property_type === 'House' &&
    canonicalInput.current_price === '250000',
    'raw type and original monetary amount used'
  )

  ok(
    canonicalInput.district === 'Pejivalle',
    'frozen source alias resolved upstream'
  )

  const condo = baseRaw('Condo')
  condo.raw_property_area = ''

  await expectAccepted(
    condo,
    'Condo accepted with construction area only'
  )

  const land = baseRaw('Land')
  land.raw_construction_area = ''

  await expectAccepted(
    land,
    'Land accepted with property area only'
  )

  const farm = baseRaw('Farm')
  farm.raw_construction_area = ''

  await expectAccepted(
    farm,
    'Farm accepted with property area only'
  )

  await expectAccepted(
    baseRaw('Cabin'),
    'Cabin accepted with both exact areas'
  )

  const commercial =
    baseRaw('Commercial Property')

  commercial.raw_property_area = ''

  await expectAccepted(
    commercial,
    'Commercial Property source accepted with construction area only'
  )

  /*
   * PRICE / CURRENCY
   */

  const noPrice = baseRaw('House')
  noPrice.current_price = ''

  await expectBlocked(
    noPrice,
    'exact positive asking price',
    'missing asking price'
  )

  const zeroPrice = baseRaw('House')
  zeroPrice.current_price = '0'

  await expectBlocked(
    zeroPrice,
    'exact positive asking price',
    'zero asking price'
  )

  const badCurrency = baseRaw('House')
  badCurrency.currency = 'EUR'

  await expectBlocked(
    badCurrency,
    'supported currency',
    'unsupported currency'
  )

  /*
   * WHATSAPP
   */

  const noWhatsapp = baseRaw('House')
  noWhatsapp.whatsapp = ''

  await expectBlocked(
    noWhatsapp,
    'valid WhatsApp',
    'blank WhatsApp'
  )

  const garbageWhatsapp =
    baseRaw('House')

  garbageWhatsapp.whatsapp =
    '%02395<;89:<D=?'

  await expectBlocked(
    garbageWhatsapp,
    'valid WhatsApp',
    'malformed WhatsApp'
  )

  const internationalWhatsapp =
    baseRaw('House')

  internationalWhatsapp.whatsapp =
    '+576015088535'

  await expectAccepted(
    internationalWhatsapp,
    'valid international WhatsApp accepted'
  )

  /*
   * AREA REQUIREMENTS
   */

  const houseNoProperty =
    baseRaw('House')

  houseNoProperty.raw_property_area = ''

  await expectBlocked(
    houseNoProperty,
    'House evidence requires exact property and construction area',
    'House missing property area'
  )

  const houseNoConstruction =
    baseRaw('House')

  houseNoConstruction.raw_construction_area = ''

  await expectBlocked(
    houseNoConstruction,
    'House evidence requires exact property and construction area',
    'House missing construction area'
  )

  const condoNoConstruction =
    baseRaw('Condo')

  condoNoConstruction.raw_construction_area = ''

  await expectBlocked(
    condoNoConstruction,
    'Condo evidence requires exact construction area',
    'Condo missing construction area'
  )

  const landNoProperty =
    baseRaw('Land')

  landNoProperty.raw_property_area = ''

  await expectBlocked(
    landNoProperty,
    'Land evidence requires exact property area',
    'Land missing property area'
  )

  const farmNoProperty =
    baseRaw('Farm')

  farmNoProperty.raw_property_area = ''

  await expectBlocked(
    farmNoProperty,
    'Farm evidence requires exact property area',
    'Farm missing property area'
  )

  const cabinNoProperty =
    baseRaw('Cabin')

  cabinNoProperty.raw_property_area = ''

  await expectBlocked(
    cabinNoProperty,
    'Cabin evidence requires exact property and construction area',
    'Cabin missing property area'
  )

  const cabinNoConstruction =
    baseRaw('Cabin')

  cabinNoConstruction.raw_construction_area = ''

  await expectBlocked(
    cabinNoConstruction,
    'Cabin evidence requires exact property and construction area',
    'Cabin missing construction area'
  )

  const commercialNoConstruction =
    baseRaw('Commercial Property')

  commercialNoConstruction.raw_construction_area = ''

  await expectBlocked(
    commercialNoConstruction,
    'Commercial Property source evidence requires exact construction area',
    'Commercial Property missing construction area'
  )

  /*
   * RANGES / BOUNDS MUST NOT BECOME EXACT
   */

  const rangedHouse =
    baseRaw('House')

  rangedHouse.raw_property_area =
    '1000–2000 m²'

  await expectBlocked(
    rangedHouse,
    'House evidence requires exact property and construction area',
    'area range not promoted to exact measurement'
  )

  const boundedLand =
    baseRaw('Land')

  boundedLand.raw_property_area =
    '>5000 m²'

  boundedLand.raw_construction_area = ''

  await expectBlocked(
    boundedLand,
    'Land evidence requires exact property area',
    'area lower bound not promoted to exact measurement'
  )

  /*
   * PROPERTY-TYPE AUTHORIZATION
   */

  await expectBlocked(
    baseRaw('Negocios'),
    null,
    'unsupported Negocios source type'
  )

  await expectBlocked(
    baseRaw('Proyectos nuevos'),
    null,
    'unsupported Proyectos nuevos source type'
  )

  const missingType =
    baseRaw('House')

  delete missingType.property_type
  missingType.raw_property_type =
    'House near beach'

  await expectBlocked(
    missingType,
    'Source-supported property type is missing',
    'heuristic-only property type'
  )

  /*
   * EVIDENCE ENVELOPE
   */

  calls.length = 0

  await assert.rejects(
    engine.ingestCsvObservation(
      admin,
      {
        ...baseRaw('House')
      }
    )
  )

  ok(
    calls.length === 0,
    'historical CSV missing evidence envelope not promoted'
  )

  calls.length = 0
  persistenceFailure = true

  await assert.rejects(
    engine.ingestCsvObservation(
      admin,
      row(baseRaw('House'))
    )
  )

  ok(
    calls.length === 1,
    'immutable evidence conflict stops canonical calls'
  )

  persistenceFailure = false

  for (
    const key of [
      'observation_id',
      'observed_at',
      'source_listing_id'
    ]
  ) {
    const bad =
      row(baseRaw('House'))

    bad[key] = 'forged'

    assert.throws(
      () =>
        engine.csvEvidenceEnvelope(bad)
    )

    count++
    console.log(
      'PASS',
      `forged ${key} rejected`
    )
  }

  const badReview =
    row(baseRaw('House'))

  badReview.unresolved_normalizer_review =
    JSON.stringify({
      status: 'unresolved',
      canonical_authority: true,
      values: {}
    })

  assert.throws(
    () =>
      engine.csvEvidenceEnvelope(
        badReview
      )
  )

  count++
  console.log(
    'PASS',
    'canonical-authority normalizer review rejected'
  )

  const numericRaw =
    baseRaw('House')

  numericRaw.raw_bathrooms = 2.5

  assert.throws(
    () =>
      engine.csvEvidenceEnvelope(
        row(numericRaw)
      )
  )

  count++
  console.log(
    'PASS',
    'numeric coercion in raw evidence rejected'
  )

  /*
   * CANONICAL RPC FAILURE
   */

  calls.length = 0
  canonicalFailure = true

  const canonicalFailureResult =
    await engine.ingestCsvObservation(
      admin,
      row(baseRaw('House'))
    )

  ok(
    canonicalFailureResult.success === false &&
    Boolean(
      canonicalFailureResult.evidenceId
    ),
    'canonical RPC failure retains evidence'
  )

  canonicalFailure = false

  /*
   * ROUTE AUTHORIZATION / REQUEST BOUNDS
   */

  let operator = false
  let auth = true
  let ingests = 0

  const customer = {
    auth: {
      getUser:
        async () => ({
          data: {
            user:
              auth
                ? { id: 'user' }
                : null
          }
        })
    },

    rpc: async name => {
      assert.equal(
        name,
        'is_current_user_import_operator'
      )

      return {
        data: operator
      }
    }
  }

  const route = load(
    'app/api/import-canonical-csv/route.ts',
    {
      'next/server': {
        NextResponse: {
          json:
            (body, options) => ({
              body,
              status:
                options?.status
            })
        }
      },

      '@supabase/supabase-js': {
        createClient:
          () => customer
      },

      '@/lib/supabase-admin': {
        supabaseAdmin:
          admin
      },

      '@/lib/csv-source-ingestion': {
        ingestCsvObservation:
          async () => {
            ingests++

            return {
              success: true
            }
          }
      }
    }
  )

  function request(body) {
    let sent = false

    const reader = {
      read: async () => {
        if (sent) {
          return {
            done: true
          }
        }

        sent = true

        return {
          done: false,
          value:
            Buffer.from(body)
        }
      },

      cancel:
        async () => {},

      releaseLock() {}
    }

    return {
      headers: {
        get:
          () =>
            'Bearer token'
      },

      body: {
        getReader:
          () => reader
      }
    }
  }

  let response =
    await route.POST(
      request('{}')
    )

  ok(
    response.status === 403 &&
    !ingests,
    'operator independently required before ingestion'
  )

  operator = true
  auth = false

  response =
    await route.POST(
      request('{}')
    )

  ok(
    response.status === 401 &&
    !ingests,
    'authentication required'
  )

  auth = true

  response =
    await route.POST(
      request('{}')
    )

  ok(
    response.status === 200 &&
    ingests === 1,
    'verified operator reaches server ingestion'
  )

  response =
    await route.POST(
      request(
        'x'.repeat(524289)
      )
    )

  ok(
    response.status === 409 &&
    ingests === 1,
    'streamed request bound before JSON processing'
  )

  /*
   * BROWSER DIRECT WRITES REMAIN FORBIDDEN
   */

  for (
    const file of [
      'publishCsvListings.ts',
      'publishRentLeaseCsvListings.ts'
    ]
  ) {
    const source =
      fs.readFileSync(
        root +
          '/app/utils/' +
          file,
        'utf8'
      )

    ok(
      source.includes(
        'submitCanonicalCsv'
      ) &&
      !source.includes(
        '.insert('
      ),
      `browser direct writer removed ${file}`
    )
  }

  console.log(
    'CSV INGESTION OFFLINE ASSERTIONS',
    count
  )
})().catch(error => {
  console.error(error)
  process.exitCode = 1
})