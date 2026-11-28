'use strict'
const fs = require('fs')
const path = require('path')
const { chromium } = require('playwright')
const Papa = require('papaparse')
const crypto = require('crypto')
const { execFileSync } = require('child_process')
const { embeddedAds } = require('./card-parser.cjs')
const { row } = require('./field-mapper.cjs')
const { append, recoveredIds } = require('./run-ledger.cjs')
const { openInventories, reserveBoundedSale } = require('./cycle-inventories.cjs')
const { acquireAdvertiser, acquirePropertyAgent, traverseAdvertiserInventory, acquireProperty } = require('./advertiser-acquisition.cjs')
const { normalizeInventoryProperty } = require('./ingestion.cjs')

function pageUrl(base, page) { return page === 1 ? base : `${base}?page=${page}` }
function mkdir(file) { fs.mkdirSync(path.dirname(file), { recursive: true }) }
function csvWrite(stream, value, header) { stream.write(`${Papa.unparse([value], { header, newline: '\n' })}\n`) }

async function run(config, { limit = 0, resumeDir = '', cycle = null, control = null } = {}) {
  if (limit && (config.transaction !== 'sale' || !Number.isSafeInteger(limit) || limit < 1)) throw new Error('A bounded test requires a positive Sale-only limit')
  const runDir = resumeDir || path.join(process.cwd(), 'var', 'encuentra24-index-runs', `${config.transaction}-${new Date().toISOString().replace(/[:.]/g, '-')}`)
  const archive = path.join(runDir, 'observations.ndjson')
  const csv = path.join(runDir, 'observations-raw.csv')
  fs.mkdirSync(runDir, { recursive: true })
  const inventoryDirectory = cycle?.inventoryDirectory || process.env.ENCUENTRA24_CYCLE_INVENTORY_DIR || runDir
  const cycleId = cycle?.cycleId || process.env.ENCUENTRA24_CYCLE_ID || path.basename(runDir)
  const inventory = openInventories(inventoryDirectory, cycleId)
  const reused = { agencies: new Set(), agents: new Set(), properties: new Set() }
  let stage = 'starting'
  const progress = (phase = stage, sourceInventory = inventory) => {
    const agencies = sourceInventory.entries('agencies'), agents = sourceInventory.entries('agents'), properties = sourceInventory.entries('properties'), values = properties.map(([, value]) => value)
    const counts = { unique_agencies: agencies.length, unique_agents: agents.length, discovered_properties: properties.length, extracted_properties: values.filter(p => ['detail_captured', 'complete'].includes(p.extraction_status)).length, normalized_properties: values.filter(p => p.normalization_status === 'complete').length, admitted: values.filter(p => p.canonical_status === 'admitted').length, published: values.filter(p => p.publication_status === 'published').length, review_required: values.filter(p => p.canonical_status === 'review_required').length, rejected: values.filter(p => p.canonical_status === 'rejected').length, failures: values.filter(p => p.extraction_status === 'failed' || p.normalization_status === 'failed' || p.canonical_status === 'failed').length, agencies_reused: reused.agencies.size, agents_reused: reused.agents.size, properties_reused: reused.properties.size }
    console.log(JSON.stringify({ wasi_progress: { event: typeof phase === 'string' ? phase : stage, selection: `encuentra24-${config.transaction}`, transaction: config.transaction, cycle_id: cycleId, counts } }))
  }
  if (control) control.reportProgress = progress
  let stopSignal = ''
  const onTerm = () => { stopSignal = 'SIGTERM' }
  const onInt = () => { stopSignal = 'SIGINT' }
  process.on('SIGTERM', onTerm)
  process.on('SIGINT', onInt)
  const deadline = control?.deadline || Date.now() + (config.maxRuntimeMs || 69 * 60 * 1000)
  const shouldStop = () => Boolean(stopSignal || control?.stopped() || Date.now() >= deadline)
  // Retry captured observations whose normalization did not finish before a stop.
  for (const [propertyId, property] of inventory.entries('properties')) {
    if (shouldStop()) break
    if (property.raw_observation && property.normalization_status !== 'complete' && (!limit || (property.bounded_sale_reserved === true && property.transaction_type === 'sale'))) normalizeInventoryProperty(inventory, propertyId, runDir)
  }
  const continuing = Boolean(resumeDir && fs.existsSync(csv) && fs.statSync(csv).size)
  const csvStream = fs.createWriteStream(csv, { flags: continuing ? 'a' : 'w' })
  const seen = recoveredIds(archive)
  let browser
  try { browser = await chromium.launch({ headless: true }) } catch (error) { csvStream.end(); process.removeListener('SIGTERM', onTerm); process.removeListener('SIGINT', onInt); throw error }
  try {
  const context = await browser.newContext()
  // Allow Encuentra24 property and advertiser pages, but block external hosts
  // and WhatsApp destinations, including misleading lookalike hostnames.
  await context.route('**/*', route => {
    const request = route.request(); const url = request.url()
    if (/^(?:whatsapp:|intent:)/i.test(url) || /(?:wa\.me|web\.whatsapp\.com|api\.whatsapp\.com)/i.test(url)) return route.abort()
    const parsed = new URL(url)
    if (parsed.protocol !== 'https:' || !(parsed.hostname === 'encuentra24.com' || parsed.hostname.endsWith('.encuentra24.com'))) return route.abort()
    return route.continue()
  })
  const page = await context.newPage()
  // A separate page preserves the primary index and its current position.
  const sourcePage = await context.newPage()
  let count = 0; let csvHeader = !continuing
  const progressTimer = setInterval(progress, 15000)
  const paginationFile = path.join(runDir, 'primary-index-pagination.json')
  let pagination = {}
  try { pagination = JSON.parse(fs.readFileSync(paginationFile, 'utf8')) } catch (error) { if (error.code !== 'ENOENT') throw error }
  try {
    for (let number = 1; ; number += 1) {
      if (stopSignal) return { runDir, archive, csv, count, status: 'INTERRUPTED', signal: stopSignal, complete: false, inventory_complete: false, reason: 'stopped', inventoryDirectory, cycleId }
      if (Date.now() >= deadline) return { runDir, archive, csv, count, complete: false, reason: 'runtime_cap', inventoryDirectory, cycleId }
            let ids = []
      let ads = new Map()
      let repeated = false
      let recognized = false
      let paginationError = ''

      const currentPageSelector =
        'button[aria-current="page"][aria-label^="Página "]'

      const nextPageSelector =
        'button[aria-label="Página siguiente"]'

      for (let attempt = 0; attempt < 3; attempt += 1) {
        if (shouldStop()) break

        try {
          await page.goto(pageUrl(config.indexUrl, number), {
            waitUntil: 'domcontentloaded',
            timeout: 45000
          })

          stage = 'index_discovery'
          progress()

          await page.waitForFunction(
            ({ selector, expected }) => {
              const current = document.querySelector(selector)

              return current &&
                Number(current.textContent.trim()) === expected
            },
            {
              selector: currentPageSelector,
              expected: number
            },
            { timeout: 10000 }
          )

          await page.locator(
            'a.item-card-link[href]'
          ).first().waitFor({
            state: 'visible',
            timeout: 10000
          })

          const html = await page.content()

          ids = await page.locator(
            'a.item-card-link[href]'
          ).evaluateAll(links => [
            ...new Set(
              links.map(link =>
                link.pathname.match(/\/(\d{7,})\/?$/)?.[1]
              ).filter(Boolean)
            )
          ])

          ads = embeddedAds(html, ids)

          const listingIds = ids.filter(id => ads.has(id))

          const fingerprint = crypto
            .createHash('sha256')
            .update(ids.join(','))
            .digest('hex')

          repeated = ids.length > 0 &&
            Object.entries(pagination).some(
              ([position, value]) =>
                Number(position) !== number &&
                value.fingerprint === fingerprint
            )

          const nextControl = page
            .locator(nextPageSelector)
            .first()

          const nextPresent = await nextControl.count() > 0

          const nextDisabled = nextPresent
            ? await nextControl.isDisabled() ||
              await nextControl.getAttribute(
                'aria-disabled'
              ) === 'true'
            : false

          pagination[number] = {
            requested_url: pageUrl(config.indexUrl, number),
            actual_url: page.url(),
            fingerprint,
            listing_count: ids.length,
            embedded_listing_count: listingIds.length,
            unmatched_listing_count:
              ids.length - listingIds.length,
            current_page: number,
            next_present: nextPresent,
            next_disabled: nextDisabled,
            attempt: attempt + 1,
            repeated,
            captured_at: new Date().toISOString()
          }

          const temporary =
            `${paginationFile}.${process.pid}.tmp`

          fs.writeFileSync(
            temporary,
            JSON.stringify(pagination, null, 2),
            { mode: 0o600 }
          )

          fs.renameSync(temporary, paginationFile)

          if (!repeated && ids.length) {
            recognized = true
            break
          }

          paginationError = repeated
            ? 'Repeated listing population'
            : 'Listing cards or embedded data unavailable'

        } catch (error) {
          paginationError = error.message
        }
      }

      if (shouldStop()) {
        return finalize({
          runDir, archive, csv, count,
          complete: false,
          reason: stopSignal ? 'stopped' : 'runtime_cap',
          inventoryDirectory, cycleId
        }, config)
      }

      if (!recognized) {
        return finalize({
          runDir, archive, csv, count,
          complete: false,
          reason: repeated
            ? 'pagination_repeated_after_retries'
            : 'pagination_empty_or_unrecognized_after_retries',
          pagination_error: paginationError,
          inventoryDirectory, cycleId
        }, config)
      }
        for (const id of ids) {
        if (stopSignal) return { runDir, archive, csv, count, status: 'INTERRUPTED', signal: stopSignal, complete: false, inventory_complete: false, reason: 'stopped', inventoryDirectory, cycleId }
        if (Date.now() >= deadline) return { runDir, archive, csv, count, complete: false, reason: 'runtime_cap', inventoryDirectory, cycleId }
        if (seen.has(id)) continue
        if (/^(auto usado|veh[ií]culos?|autos?)$/i.test(String(ads.get(id)?.subCategoryType || ''))) { seen.add(id); continue }
        if (limit && inventory.get('properties', id)?.transaction_type && inventory.get('properties', id).transaction_type !== 'sale') continue
        if (limit && !reserveBoundedSale(inventory, id, limit)) return finalize({ runDir, archive, csv, count, complete: false, reason: 'limit', inventoryDirectory, cycleId, boundedSaleLimit: limit }, config)
        seen.add(id)
        const sourceUrl = await page.locator(`a[href*="/${id}"]`).first().getAttribute('href').then(href => new URL(href, config.indexUrl).toString()).catch(() => '')
        const observation = row(
          ads.get(id) || { id },
          config,
          sourceUrl,
          ''
        )
        observation.advertiser_profile_url = ''
        observation.advertiser_navigation_status = 'not_attempted'
        observation.advertiser_navigation_error = ''
        try {
          if (!sourceUrl) throw new Error('Property listing URL unavailable')
          const existing = inventory.get('properties', id)
          if (existing?.transaction_type && existing.transaction_type !== config.transaction) throw new Error('Source listing transaction conflict; review required')
          const captured = ['complete', 'detail_captured'].includes(existing?.extraction_status)
          if (captured) reused.properties.add(id)
          stage = 'property_extraction'; progress()
          if (!captured) await sourcePage.goto(sourceUrl, { waitUntil: 'domcontentloaded', timeout: 45000 })
          if (shouldStop()) throw new Error('Execution stopped before property extraction')
          const detail = captured ? existing : await acquireProperty(sourcePage, inventory, { id, url: sourceUrl, transaction: config.transaction })
          if (detail.raw_observation) Object.assign(observation, detail.raw_observation)
          const profileHref = captured ? (detail.advertiser_profiles?.[0]?.url || '') : await sourcePage.locator('a[href*="/user/profile/id/"]').first().getAttribute('href').catch(() => '')
          if (!profileHref) {
            observation.advertiser_navigation_status = 'profile_link_not_found'
          } else {
            const profileUrl = new URL(profileHref, sourceUrl)
            if (profileUrl.protocol !== 'https:' || !(profileUrl.hostname === 'encuentra24.com' || profileUrl.hostname.endsWith('.encuentra24.com'))) throw new Error('Advertiser profile URL is outside Encuentra24')
            observation.advertiser_profile_url = profileUrl.toString()
            const advertiserId = profileUrl.pathname.match(/\/profile\/id\/(\d+)/)?.[1]
            const existingAdvertiser = advertiserId && inventory.get('agencies', advertiserId)
            let advertiser = existingAdvertiser
            if (
                ['complete', 'skipped_no_agency_whatsapp'].includes(advertiser?.profile_acquisition_status) ||
                Number(advertiser?.whatsapp_acquisition_attempts || 0) >= 3
              ) {
              reused.agencies.add(advertiserId)
              observation.advertiser_navigation_status = 'profile_reused'
            } else {
              if (shouldStop()) throw new Error('Execution stopped before advertiser navigation')
              await sourcePage.goto(observation.advertiser_profile_url, { waitUntil: 'domcontentloaded', timeout: 45000 })
              if (shouldStop()) throw new Error('Execution stopped before advertiser acquisition')
              observation.advertiser_navigation_status = 'profile_opened'
              advertiser = await acquireAdvertiser(sourcePage, inventory, observation.advertiser_profile_url, shouldStop)
            }
            if (advertiser?.profile_acquisition_status === 'complete' && !advertiser.whatsapp) advertiser = inventory.record('agencies', advertiserId, { profile_acquisition_status: 'skipped_no_agency_whatsapp', skip_reason: advertiser.whatsapp_status === 'acquisition_failed' ? 'agency_whatsapp_acquisition_failed' : 'agency_whatsapp_unavailable' })
            observation.agency_name = advertiser.name || ''
            observation.agency_profile_id = advertiser.profile_id || ''
            observation.agency_logo_url = advertiser.logo_url || ''
            observation.agency_whatsapp = advertiser.whatsapp || ''
            inventory.record('properties', id, { agency_id: advertiserId, agency_whatsapp: advertiser.whatsapp || '', agency_logo_url: advertiser.logo_url || '' })
            if (advertiser.whatsapp_status !== 'acquired' || !advertiser.whatsapp) {
              inventory.record('properties', id, { canonical_status: 'skipped', canonical_error: advertiser.skip_reason || 'agency_whatsapp_unavailable' })
              observation.advertiser_navigation_status = advertiser.skip_reason || 'agency_whatsapp_unavailable'
              append(archive, observation); csvWrite(csvStream, observation, csvHeader); csvHeader = false; count += 1
              if (limit && inventory.entries('properties').filter(([, property]) => property.bounded_sale_reserved === true).length >= limit) return finalize({ runDir, archive, csv, count, complete: false, reason: 'limit', inventoryDirectory, cycleId, boundedSaleLimit: limit }, config)
              continue
            }
            observation.reported_active_listing_count = advertiser.reported_active_listing_count ?? ''
            const seenAgentName = String(detail.observation?.assigned_agent?.name || '').trim()
            const profileAgent = advertiser.agent_id ? inventory.get('agents', advertiser.agent_id) : null
            if (!inventory.get('properties', id)?.agent_id && seenAgentName && profileAgent?.name && seenAgentName.toLocaleLowerCase() === profileAgent.name.trim().toLocaleLowerCase()) inventory.record('properties', id, { agent_id: advertiser.agent_id })
            const propertyAgentId = inventory.get('properties', id)?.agent_id || ''
            if (propertyAgentId && inventory.get('agents', propertyAgentId)?.contact_acquisition_complete) reused.agents.add(propertyAgentId)
            if (
                propertyAgentId &&
                !inventory.get('agents', propertyAgentId)?.contact_acquisition_complete &&
                Number(inventory.get('agents', propertyAgentId)?.whatsapp_acquisition_attempts || 0) < 3
              ) {
              if (shouldStop()) throw new Error('Execution stopped before agent acquisition')
              if (observation.advertiser_navigation_status !== 'profile_opened') await sourcePage.goto(observation.advertiser_profile_url, { waitUntil: 'domcontentloaded', timeout: 45000 })
              await acquirePropertyAgent(sourcePage, inventory, id, shouldStop)
            }
            const agent = propertyAgentId ? inventory.get('agents', propertyAgentId) : null
            observation.agent_name = agent?.name || ''
            observation.agent_id = propertyAgentId
            observation.agent_photo_url = agent?.photo_url || ''
            observation.agent_whatsapp = agent?.whatsapp || ''
            if (advertiser.inventory_complete !== true) {
              stage = 'advertiser_inventory'; progress()
              if (shouldStop()) throw new Error('Execution stopped before inventory traversal')
              const inventoryResult = await traverseAdvertiserInventory(sourcePage, inventory, advertiserId, observation.advertiser_profile_url, deadline, shouldStop)
              observation.advertiser_inventory_status = inventoryResult.inventory_status || ''
            } else {
              observation.advertiser_inventory_status = 'complete'
            }
            if (advertiser.whatsapp_status === 'acquired' && advertiser.whatsapp) {
              for (const [propertyId, property] of inventory.entries('properties')) {
                if (shouldStop()) break
                if (property.agency_id !== advertiserId) continue

            if (
              property.extraction_status === 'complete' ||
              property.extraction_status === 'detail_captured'
            ) {
              if (
                property.canonical_status === 'skipped' &&
                /^agency_whatsapp_/.test(
                  String(property.canonical_error || '')
                ) &&
                property.raw_observation &&
                (!limit || (
                  property.bounded_sale_reserved === true &&
                  property.transaction_type === 'sale'
                ))
              ) {
                inventory.record('properties', propertyId, {
                  agency_whatsapp: advertiser.whatsapp,
                  agency_logo_url: advertiser.logo_url || '',
                  canonical_status: 'pending',
                  canonical_error: '',
                  normalization_status: 'pending'
                })

                normalizeInventoryProperty(
                  inventory,
                  propertyId,
                  runDir
                )
              }

              continue
            }
                if (/\/autos-usados\//i.test(String(property.source_url || ''))) continue
                if (limit && property.transaction_type !== 'sale') continue
                if (limit && !reserveBoundedSale(inventory, propertyId, limit)) {
                  inventory.record('agencies', advertiserId, {
                  inventory_extraction_status: 'bounded_test_limit'
                })
                  break
                }
                if (Date.now() >= deadline) break
                try {
                  const propertyDetail = await acquireProperty(sourcePage, inventory, { id: propertyId, url: property.source_url, transaction: property.transaction_type, agency_id: advertiserId, agency_whatsapp: advertiser.whatsapp, agency_logo_url: advertiser.logo_url })
                  const detailAgentName = String(propertyDetail.observation?.assigned_agent?.name || '').trim()
                  if (!inventory.get('properties', propertyId)?.agent_id && detailAgentName && profileAgent?.name && detailAgentName.toLocaleLowerCase() === profileAgent.name.trim().toLocaleLowerCase()) inventory.record('properties', propertyId, { agent_id: advertiser.agent_id })
                  const propertyAgent = inventory.get('properties', propertyId)?.agent_id
                  if (
                      propertyAgent &&
                      !inventory.get('agents', propertyAgent)?.contact_acquisition_complete &&
                      Number(inventory.get('agents', propertyAgent)?.whatsapp_acquisition_attempts || 0) < 3
                    ) {
                    if (shouldStop()) break
                    await sourcePage.goto(observation.advertiser_profile_url, { waitUntil: 'domcontentloaded', timeout: 45000 })
                    await acquirePropertyAgent(sourcePage, inventory, propertyId, shouldStop)
                  }
                  if (!shouldStop()) normalizeInventoryProperty(inventory, propertyId, runDir)
                } catch (error) {
                  inventory.record('properties', propertyId, { extraction_status: 'failed', extraction_error: error.message })
                }
              }
            }
          }
        } catch (error) {
          observation.advertiser_navigation_status = 'failed'
          observation.advertiser_navigation_error = error.message
        }
        if (!shouldStop()) { stage = 'normalization'; normalizeInventoryProperty(inventory, id, runDir); progress() }
        append(archive, observation)
        csvWrite(csvStream, observation, csvHeader); csvHeader = false
        count += 1
        if (limit && inventory.entries('properties').filter(([, property]) => property.bounded_sale_reserved === true).length >= limit) return finalize({ runDir, archive, csv, count, complete: false, reason: 'limit', inventoryDirectory, cycleId, boundedSaleLimit: limit }, config)
      }

      const pageEvidence = pagination[number]

      if (
        pageEvidence?.next_present === true &&
        pageEvidence?.next_disabled === true &&
        pageEvidence?.current_page === number
      ) {
        const allPagesVerified = Array.from(
          { length: number },
          (_, index) => pagination[index + 1]
        ).every(evidence =>
          evidence &&
          evidence.repeated === false &&
          evidence.listing_count > 0 &&
          evidence.unmatched_listing_count === 0
        )

        return finalize({
          runDir,
          archive,
          csv,
          count,
          complete: allPagesVerified,
          inventory_complete: false,
          primary_index_complete: allPagesVerified,
          reason: allPagesVerified
            ? 'primary_index_exhausted'
            : 'primary_index_exhausted_with_unresolved_listings',
          inventoryDirectory,
          cycleId
        }, config)
      }
    }
  } finally { clearInterval(progressTimer) }
  } finally { await new Promise(resolve => csvStream.end(resolve)); await browser.close(); process.removeListener('SIGTERM', onTerm); process.removeListener('SIGINT', onInt) }
}
module.exports = { run }

async function finalize(result, config) {
  // Let the stream flush before the existing CSV-based stages consume it.
  await new Promise(resolve => setImmediate(resolve))
  return { ...result, transaction: config.transaction }
}
