'use strict'

// Source observations are checkpointed before navigation advances. This
// module does not submit listings or trigger absence reconciliation.
const { initialResults } = require('./card-parser.cjs')
const { dismissMarketplacePromotion } = require('./index-browser.cjs')
const cheerio = require('cheerio')
const { row: mapIndexRow } = require('./field-mapper.cjs')

function propertyPhotoUrls(ad, listingId, renderedUrls) {
  const structured = String(ad?.id || '') === String(listingId) && Array.isArray(ad?.images) ? ad.images : []
  const candidates = [...structured.map(image => typeof image === 'string' ? image : image?.url), ...renderedUrls]
  return [...new Set(candidates.filter(value => {
    try {
      const url = new URL(value)
      return url.protocol === 'https:' && url.hostname === 'photos.encuentra24.com' && url.pathname.split('/').some(part => part.startsWith(`${listingId}_`))
    } catch { return false }
  }))]
}

async function profileContact(page, section, shouldStop = () => false) {
  if (shouldStop()) return { status: 'interrupted', number: '' }
  try { await dismissMarketplacePromotion(page) } catch (error) { return { status: 'acquisition_failed', number: '', error: `Promotion dismissal failed: ${error.message}` } }
  if (shouldStop()) return { status: 'interrupted', number: '' }
  try { await section.waitFor({ state: 'visible', timeout: 5000 }) } catch { return { status: 'section_not_detected', number: '', error: 'Contact section not detected or not visible' } }
  const button = section
  .getByRole('button', { name: /^WhatsApp$/i })
  .or(section.getByRole('link', { name: /^WhatsApp$/i }))
  .filter({ visible: true })
  .first()
  try { await button.waitFor({ state: 'visible', timeout: 5000 }) } catch { return { status: 'control_not_detected', number: '', error: 'Dedicated WhatsApp control not detected or not visible' } }
  const context = page.context()
  const originalPages = new Set(context.pages())
  let resolveDestination
  const destination = new Promise(resolve => { resolveDestination = resolve })
  const onRequest = request => {
    if (!request.isNavigationRequest()) return
    try {
      const url = new URL(request.url())
      if (!['wa.me', 'api.whatsapp.com', 'web.whatsapp.com'].includes(url.hostname)) return
      const raw = url.searchParams.get('phone') || decodeURIComponent(url.pathname.replace(/^\//, ''))
      let digits = raw.replace(/\D/g, '').replace(/^00506/, '506')
      if (digits.length === 8) digits = `506${digits}`
      if (/^506\d{8}$/.test(digits)) resolveDestination(`+${digits}`)
    } catch { /* Ignore malformed or unrelated destinations. */ }
  }
  context.on('request', onRequest)
  try {
    for (let attempt = 0; ; attempt += 1) {
      if (shouldStop()) return { status: 'interrupted', number: '' }
      try { await button.click({ timeout: 5000, noWaitAfter: true }); break } catch (error) {
        if (attempt >= 1 || !/detached|intercept|not stable/i.test(error.message)) throw error
        await dismissMarketplacePromotion(page)
      }
    }
    if (shouldStop()) return { status: 'interrupted', number: '' }
    const dialog = page.getByRole('dialog').filter({ hasNotText: /Marketplace Encuentra24 Costa Rica/i }).first()
    const result = await Promise.race([
  destination.then(number => ({ number })),
  dialog.waitFor({
    state: 'visible',
    timeout: 8000
  }).then(() => ({ dialog: true })).catch(
    () => new Promise(() => {})
  ),
  page.waitForTimeout(8000).then(() => {
    throw new Error('WhatsApp destination or dialog not detected')
  })
])
    if (result.number) return { status: 'acquired', number: result.number }
    if (shouldStop()) { await page.keyboard.press('Escape').catch(() => {}); return { status: 'interrupted', number: '' } }
    const text = await dialog.innerText()
    const match = text.match(/(?:\+?506|00506)[\s()-]*\d[\d\s()-]{6,12}\d|\b\d{4}[\s-]?\d{4}\b/)
    let digits = String(match?.[0] || '').replace(/\D/g, '').replace(/^00506/, '506')
    if (digits.length === 8) digits = `506${digits}`
    const number = /^506\d{8}$/.test(digits) ? `+${digits}` : ''
    await dialog.getByRole('button', { name: /^(?:cerrar|close)$/i }).first().click({ timeout: 2000 }).catch(() => page.keyboard.press('Escape'))
    return { status: number ? 'acquired' : 'number_not_exposed', number }
  } catch (error) {
    await page.keyboard.press('Escape').catch(() => {})
    return { status: shouldStop() ? 'interrupted' : 'acquisition_failed', number: '', error: error.message }
  } finally {
    context.off('request', onRequest)
    // A blocked external navigation can still create a delayed blank/error tab.
    await page.waitForTimeout(300).catch(() => {})
    for (const opened of context.pages()) if (!originalPages.has(opened)) await opened.close().catch(() => {})
  }
}

async function acquireAdvertiser(page, inventory, profileUrl, shouldStop = () => false) {
  const profileId = new URL(profileUrl).pathname.match(/\/profile\/id\/(\d+)/)?.[1]
  if (!profileId) throw new Error('Advertiser profile lacks a stable source ID')
  const prior = inventory.get('agencies', profileId)

const acquisitionAttempts = Number(prior?.whatsapp_acquisition_attempts || 0)

if (prior?.whatsapp_status !== 'acquired' && acquisitionAttempts >= 3) {
  return prior
}

  if (prior?.profile_acquisition_status === 'complete' || prior?.profile_acquisition_status === 'skipped_no_agency_whatsapp') return prior
  if (shouldStop()) return inventory.record('agencies', profileId, { profile_id: profileId, profile_url: profileUrl, profile_acquisition_status: 'incomplete', whatsapp_status: 'interrupted' })
  const contactSection = page
  .getByRole('heading', { name: /^Contáctanos$/i })
  .first()
  .locator('..')
  const agencyContact = prior?.whatsapp_status === 'acquired' ? { status: 'acquired', number: prior.whatsapp } : await profileContact(page, contactSection, shouldStop)
  if (agencyContact.status === 'interrupted' || shouldStop()) return inventory.record('agencies', profileId, { profile_id: profileId, profile_url: profileUrl, profile_acquisition_status: 'incomplete', whatsapp_status: 'interrupted' })
  if (!agencyContact.number) {
  const acquisitionFailed = [
    'acquisition_failed',
    'control_not_detected',
    'section_not_detected',
    'number_not_exposed'
  ].includes(agencyContact.status)

  return inventory.record('agencies', profileId, {
    profile_id: profileId,
    profile_url: profileUrl,
    whatsapp_acquisition_attempts: acquisitionAttempts + 1,
    profile_acquisition_status: acquisitionFailed
      ? 'incomplete'
      : 'skipped_no_agency_whatsapp',
    whatsapp_status: agencyContact.status,
    whatsapp_error: agencyContact.error || '',
    skip_reason: acquisitionFailed
      ? 'agency_whatsapp_acquisition_failed'
      : 'agency_whatsapp_unavailable'
  })
  }
  const data = await page.evaluate(() => {
    const headings = [...document.querySelectorAll('h1,h2,h3,h4')]
    const agent = headings.find(element => element.textContent.trim().toLowerCase() === 'agente asignado')?.parentElement
    const agentLink = agent?.querySelector('a[href*="/profile/id/"]')
    const total =
  document.body.innerText.match(
    /Anuncios activos\s+([\d.,]+)/i
  ) ||
  document.body.innerText.match(
    /Total:\s*([\d.,]+)\s+anuncios/i
  )
    const agencyName = document.querySelector('h1')?.innerText.trim() || ''
    // The observed profile marks its user image with the advertiser name;
    // exclude listing-gallery images and do not substitute a banner.
    const logo = [...document.querySelectorAll('img')].find(image => agencyName && image.alt.trim() === agencyName && !image.closest('.card_container'))
    const agentName = agentLink?.innerText.trim() || [...(agent?.querySelectorAll('h2,h3,h4,h5') || [])].map(element => element.innerText.trim()).find(value => value && !/^agente asignado$/i.test(value)) || ''
    return { agency_name: agencyName, agency_logo_url: logo?.src || '', reported_active_listing_count: total ? Number(total[1].replace(/[.,]/g, '')) : null, agent_name: agentName, agent_profile_url: agentLink?.href || '', agent_photo_url: agent?.querySelector('img')?.src || '', agent_section_present: Boolean(agent) }
  })
  const agentId = data.agent_profile_url.match(/\/profile\/id\/(\d+)/)?.[1] || (data.agent_section_present ? `agency-section:${profileId}` : '')
    let agent = agentId
    ? inventory.get('agents', agentId)
    : null

  if (
    agentId &&
    !agent?.contact_acquisition_complete &&
    Number(agent?.whatsapp_acquisition_attempts || 0) < 3 &&
    !shouldStop()
  ) {
    const agentSection = page
      .getByRole('heading', { name: /^Agente asignado$/i })
      .first()
      .locator('..')

    const contact = await profileContact(
      page,
      agentSection,
      shouldStop
    )

    agent = inventory.record('agents', agentId, {
      name: data.agent_name || agent?.name || '',
      profile_url: data.agent_profile_url,
      agency_id: profileId,
      photo_url: data.agent_photo_url || agent?.photo_url || '',
      whatsapp: contact.number || agent?.whatsapp || '',
      whatsapp_status: contact.status,
      whatsapp_acquisition_attempts:
        Number(agent?.whatsapp_acquisition_attempts || 0) + 1,
      contact_acquisition_complete:
        contact.status === 'acquired' && Boolean(contact.number)
    })
  }
  return inventory.record('agencies', profileId, { profile_id: profileId, profile_url: profileUrl, name: data.agency_name || prior?.name || '', logo_url: data.agency_logo_url || prior?.logo_url || '', reported_active_listing_count: data.reported_active_listing_count ?? prior?.reported_active_listing_count ?? null, whatsapp: agencyContact.number, whatsapp_status: agencyContact.status, agent_id: agentId || prior?.agent_id || '', agent_section_present: data.agent_section_present, agent_acquisition_status: !data.agent_section_present ? 'section_absent' : agent?.whatsapp_status === 'acquisition_failed' || (!data.agent_name && !data.agent_photo_url) ? 'acquisition_failed' : 'acquired', profile_acquisition_status: shouldStop() ? 'incomplete' : 'complete' })
}

async function acquirePropertyAgent(page, inventory, propertyId, shouldStop = () => false) {
  if (shouldStop()) return null
  const property = inventory.get('properties', propertyId)
  if (!property?.agent_id) return null
  const agent = inventory.get('agents', property.agent_id)
  if (
  !agent ||
  agent.contact_acquisition_complete ||
  Number(agent.whatsapp_acquisition_attempts || 0) >= 3
) return agent || null
  const section = page.getByRole('heading', { name: /^Agente asignado$/i }).first().locator('..')
  if (!await section.count()) return agent
  const agentLink = section.locator('a[href*="/profile/id/"]').first()

const href = await agentLink.count()
  ? await agentLink.getAttribute('href', { timeout: 2000 }).catch(() => '')
  : ''
  const linkedAgentId = href?.match(/\/profile\/id\/(\d+)/)?.[1] || ''
const sectionAgentId = `agency-section:${property.agency_id}`

if (linkedAgentId) {
  if (linkedAgentId !== property.agent_id) return agent
} else {
  if (property.agent_id !== sectionAgentId) return agent
  if (agent.agency_id !== property.agency_id) return agent

  const normalizeName = value =>
    String(value || '').trim().replace(/\s+/g, ' ').toLocaleLowerCase()

  const expectedName = normalizeName(agent.name)

  const observedNames = await section
    .locator('h2,h3,h4,h5')
    .allTextContents()

  if (!expectedName || !observedNames.some(
    name => normalizeName(name) === expectedName
  )) return agent
}
  const contact = await profileContact(page, section, shouldStop)
    const updated = inventory.record('agents', property.agent_id, {
    whatsapp: contact.number || agent.whatsapp || '',
    whatsapp_status: contact.status,
    whatsapp_acquisition_attempts:
      Number(agent.whatsapp_acquisition_attempts || 0) + 1,
    contact_acquisition_complete:
      contact.status === 'acquired' && Boolean(contact.number),
    acquisition_status: contact.status
  })

  if (property.normalization_status === 'complete') {
    inventory.record('properties', propertyId, {
      normalization_status: 'pending',
      normalization_reason: 'agent_contact_updated'
    })
  }

  return updated
}

async function acquireProperty(page, inventory, listing) {
  const prior = inventory.get('properties', listing.id)
  if (['complete', 'detail_captured'].includes(prior?.extraction_status)) return prior
  inventory.record('properties', listing.id, { source_url: listing.url, transaction_type: listing.transaction, extraction_status: 'in_progress' })
  if (page.url() !== listing.url) await page.goto(listing.url, { waitUntil: 'domcontentloaded', timeout: 45000 })
  const html = await page.content()
  const legacy = require(listing.transaction === 'rent' ? '../encuentra24-rent-scraper.js' : '../encuentra24-sale-scraper.js')
  const $ = cheerio.load(html)
  const ad = legacy.extractFlightAd(html, listing.id)
  const geography = legacy.extractLocation($)
  const insight = legacy.extractInsightAttributes($)
  const details = legacy.extractDetailAttributes($)
  const observation = await page.evaluate(() => ({
    title: document.querySelector('h1')?.innerText || '',
    source_url: location.href,
    visible_text: document.body.innerText,
    breadcrumbs: [...document.querySelectorAll('nav[aria-label*="breadcrumb" i] a, [itemtype*="BreadcrumbList"] [itemprop="name"]')].map(element => element.innerText.trim()).filter(Boolean),
    jsonld: [...document.querySelectorAll('script[type="application/ld+json"]')].map(element => element.textContent),
    assigned_agent: (() => {
      const heading = [...document.querySelectorAll('h1,h2,h3,h4,h5')].find(element => /^agente asignado$/i.test(element.innerText.trim()))
      const section = heading?.parentElement
      const link = section?.querySelector('a[href*="/profile/id/"]')
      const id = link?.pathname.match(/\/profile\/id\/(\d+)/)?.[1] || ''
      const name = link?.innerText.trim() || [...(section?.querySelectorAll('h2,h3,h4,h5') || [])].map(element => element.innerText.trim()).find(value => value && !/^agente asignado$/i.test(value)) || ''
      return section && (id || name) ? { id, profile_url: link?.href || '', name, photo_url: section.querySelector('img')?.src || '' } : null
    })(),
    advertiser_profiles: [...document.querySelectorAll('a[href*="/profile/id/"]')].map(element => ({ url: element.href, text: element.innerText.trim() })),
    image_urls: [...new Set([...document.querySelectorAll('meta[property="og:image"], img[src*="photos.encuentra24.com/t_or_"]')].map(element => element.content || element.src).filter(Boolean))]
  }))
  const mapped = mapIndexRow(ad || { id: listing.id }, { transaction: listing.transaction }, listing.url)
  const schemas = legacy.extractJsonLd($)
  const schema = schemas.find(value => value && (value.name || value.description)) || {}
  const offer = Array.isArray(schema.offers) ? (schema.offers[0] || {}) : (schema.offers || {})
  const resolvePrice = listing.transaction === 'rent' ? legacy.resolveRentPriceIdentity : legacy.resolveSalePriceIdentity
  const price = resolvePrice({ offer, flightAd: ad, insightAttributes: insight, detailAttributes: details, title: mapped.title || observation.title, description: mapped.description || schema.description || '', $ })
  mapped[listing.transaction === 'rent' ? 'monthly_price' : 'current_price'] = String(price?.amount || '')
  mapped.currency = String(price?.currency || '')
  const measurements = legacy.extractLegacyMeasurements({ flightAd: ad, detailAttributes: details, insightAttributes: insight, evidenceDescription: mapped.description || schema.description || '', sourcePropertyType: mapped.property_type, title: mapped.title || observation.title })
  mapped.raw_property_area = measurements.rawPropertyAreaResult.value
  mapped.raw_property_area_source = measurements.rawPropertyAreaResult.source
  mapped.raw_property_area_field = measurements.rawPropertyAreaResult.field
  mapped.raw_construction_area = measurements.rawConstructionAreaResult.value
  mapped.raw_construction_area_source = measurements.rawConstructionAreaResult.source
  mapped.raw_construction_area_field = measurements.rawConstructionAreaResult.field
  const photos = propertyPhotoUrls(ad, listing.id, observation.image_urls)
  observation.image_urls = photos
  Object.assign(mapped, { title: mapped.title || observation.title, description: mapped.description || schema.description || '', province: geography.province || mapped.province, canton: geography.canton || mapped.canton, district: geography.district || mapped.district, raw_breadcrumbs: geography.raw_breadcrumbs || mapped.raw_breadcrumbs, images: photos.join('|'), raw_insight_attributes: JSON.stringify(insight), raw_detail_attributes: JSON.stringify(details), raw_jsonld: JSON.stringify(schemas) })
  Object.assign(mapped, require('./ingestion.cjs').priceEvidence(mapped))
  const agent = observation.assigned_agent
  if (agent?.id) {
    const priorAgent = inventory.get('agents', agent.id) || {}
    inventory.record('agents', agent.id, { name: agent.name || priorAgent.name || '', profile_url: agent.profile_url, photo_url: agent.photo_url || priorAgent.photo_url || '', agency_id: listing.agency_id || priorAgent.agency_id || '', property_ids: [...new Set([...(priorAgent.property_ids || []), listing.id])], acquisition_status: priorAgent.acquisition_status || 'pending_profile' })
  }
  return inventory.record('properties', listing.id, { observation, raw_observation: mapped, extraction_status: 'detail_captured', advertiser_profiles: observation.advertiser_profiles, agency_id: listing.agency_id || '', agency_whatsapp: listing.agency_whatsapp || '', agency_logo_url: listing.agency_logo_url || '', agent_id: agent?.id || '' })
}

async function discoverAdvertiserPage(page, inventory, advertiserId, profileUrl) {
  await page.goto(profileUrl, { waitUntil: 'domcontentloaded', timeout: 45000 })
  const html = await page.content()
  const initial = initialResults(html)
  const details = await page.evaluate(() => ({ title: document.title, source_url: location.href }))
  const prior = inventory.get('agencies', advertiserId) || {}
  const found = Array.isArray(initial?.data) ? initial.data.map(ad => ({ id: String(ad.id || ''), url: ad.link || '', source_ad: ad })).filter(ad => ad.id && ad.url) : []
  inventory.record('agencies', advertiserId, { ...details, discovered_properties: found, inventory_complete: false, inventory_status: initial ? 'page_captured' : 'unrecognized_inventory', prior_inventory_status: prior.inventory_status || '' })
  return found
}

async function traverseAdvertiserInventory(
  page,
  inventory,
  advertiserId,
  profileUrl,
  deadline,
  shouldStop = () => false
) {
  let state = inventory.get('agencies', advertiserId) || {}

  if (state.inventory_complete === true) return state

  const visited = new Set()
  const visitedUrls = []
  const portfolioPropertyIds = new Set()

  let reportedTotal = null
  let expectedPage = 1

  const stopped = () =>
    shouldStop() || Date.now() >= deadline

  const checkpoint = (status, extra = {}) =>
    inventory.record('agencies', advertiserId, {
      inventory_complete: false,
      inventory_status: status,
      inventory_visited_urls: [...visitedUrls],
      inventory_next_url: profileUrl,
      inventory_reported_total: reportedTotal,
      inventory_observed_count: portfolioPropertyIds.size,
      ...extra
    })

  if (stopped()) {
    return checkpoint('interrupted_or_runtime_limit')
  }

  const target = new URL(profileUrl)

  if (
    target.protocol !== 'https:' ||
    !(
      target.hostname === 'encuentra24.com' ||
      target.hostname.endsWith('.encuentra24.com')
    )
  ) {
    throw new Error('Inventory URL outside Encuentra24')
  }

  await page.goto(target.href, {
    waitUntil: 'domcontentloaded',
    timeout: 45000
  })

  const heading = page.getByRole('heading', {
    name: /^Anuncios Disponibles$/i
  }).first()

  try {
    await heading.waitFor({
      state: 'visible',
      timeout: 10000
    })
  } catch {
    return checkpoint('inventory_not_recognized')
  }

  const inventoryRoot = heading.locator('..')

  while (!stopped()) {
    const result = await inventoryRoot.evaluate(root => {
      const links = [...root.querySelectorAll(
        'a.item-card-link[href]'
      )].map(a => ({
        url: a.href,
        id: a.pathname.match(/\/(\d{7,})\/?$/)?.[1] || ''
      })).filter(item => item.id)

      const next = root.querySelector(
        '[aria-label="Go to next page"]'
      )

      const disabled = Boolean(next && (
        next.disabled ||
        next.getAttribute('aria-disabled') === 'true' ||
        next.getAttribute('data-disabled') === 'true' ||
        next.classList.contains('pointer-events-none')
      ))

      const current = root.querySelector(
        '[aria-current="page"]'
      )

      const total =
        document.body.innerText.match(
          /Anuncios activos\s+([\d.,]+)/i
        ) ||
        root.innerText.match(
          /Total:\s*([\d.,]+)\s+anuncios/i
        )

      return {
        links,
        next_present: Boolean(next),
        next_disabled: disabled,
        current_page: current
          ? Number(current.textContent.trim())
          : null,
        total: total
          ? Number(total[1].replace(/[.,]/g, ''))
          : null
      }
    })

    if (result.total !== null) {
      if (
        reportedTotal !== null &&
        reportedTotal !== result.total
      ) {
        return checkpoint('inventory_total_changed')
      }

      reportedTotal = result.total
    }

    if (
      result.current_page !== null &&
      result.current_page !== expectedPage
    ) {
      return checkpoint('unexpected_page_position')
    }

    if (
      result.links.length === 0 &&
      reportedTotal !== 0
    ) {
      return checkpoint('inventory_empty_unverified')
    }

    const signature = result.links
      .map(item => item.id)
      .join(',')

    if (visited.has(signature)) {
      return checkpoint('repeated_pagination')
    }

    visited.add(signature)
    visitedUrls.push(page.url())

    for (const item of result.links) {
      portfolioPropertyIds.add(item.id)

      const pathname = new URL(item.url)
        .pathname.toLowerCase()

      const transaction =
        /alquiler|arrendamiento/.test(pathname)
          ? 'rent'
          : /venta/.test(pathname)
            ? 'sale'
            : ''

      const previous = inventory.get(
        'properties',
        item.id
      )

      if (!previous) {
        inventory.record('properties', item.id, {
          source_listing_id: item.id,
          source_url: item.url,
          transaction_type: transaction,
          agency_id: advertiserId,
          discovery_status: 'discovered',
          extraction_status: 'pending'
        })
      }
    }

    state = checkpoint('in_progress', {
      inventory_pages_visited: visited.size,
      inventory_current_page: expectedPage
    })

    if (stopped()) {
      return checkpoint('interrupted_or_runtime_limit')
    }

    if (result.next_present && !result.next_disabled) {
      const nextControl = inventoryRoot.locator(
        '[aria-label="Go to next page"]'
      ).first()

      try {
        await nextControl.click({ timeout: 5000 })

        await page.waitForFunction(
          ({ previous, nextPage }) => {
            const heading = [
              ...document.querySelectorAll('h1,h2,h3,h4')
            ].find(el =>
              /^Anuncios Disponibles$/i.test(
                el.textContent.trim()
              )
            )

            if (!heading) return false

            const root = heading.parentElement

            const current = root.querySelector(
              '[aria-current="page"]'
            )

            const ids = [...root.querySelectorAll(
              'a.item-card-link[href]'
            )].map(a =>
              a.pathname.match(/\/(\d{7,})\/?$/)?.[1] || ''
            ).filter(Boolean)

            return (
              ids.length > 0 &&
              ids.join(',') !== previous &&
              (
                !current ||
                Number(current.textContent.trim()) === nextPage
              )
            )
          },
          {
            previous: signature,
            nextPage: expectedPage + 1
          },
          { timeout: 10000 }
        )

        expectedPage += 1
        continue

      } catch (error) {
        return checkpoint('pagination_failed', {
          inventory_error: error.message
        })
      }
    }

    const verified =
      reportedTotal !== null &&
      portfolioPropertyIds.size === reportedTotal &&
      (!result.next_present || result.next_disabled)

    return checkpoint(
      verified ? 'complete' : 'pagination_unverified',
      {
        inventory_complete: verified,
        inventory_next_url: verified ? '' : profileUrl,
        inventory_pages_visited: visited.size,
        inventory_current_page: expectedPage
      }
    )
  }

  return checkpoint('interrupted_or_runtime_limit')
}

module.exports = { acquireProperty, discoverAdvertiserPage, acquireAdvertiser, acquirePropertyAgent, traverseAdvertiserInventory, propertyPhotoUrls, profileContact }
