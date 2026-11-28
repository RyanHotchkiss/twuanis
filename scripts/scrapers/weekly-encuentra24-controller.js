'use strict'

// Stage 1 controller.  It is intentionally inert unless Stage 2 sets the
// server-side enable flag.  It runs the two established entrypoints serially
// and stores all operational state under a persistent mounted run root.
const crypto = require('node:crypto')
const fs = require('node:fs')
const path = require('node:path')
const { spawn } = require('node:child_process')
const { createClient, ingestObservation, recordRemovedListingCandidates } = require('./encuentra24-canonical-ingestion-adapter.cjs')
const { readLedger, recordLedger, interruptedSourceIds } = require('./rent-run-ledger.cjs')
const { createRunArchive } = require('./scraper-run-archive.cjs')

if (process.env.ENCUENTRA24_ENV_FILE) {
  require('dotenv').config({ path: process.env.ENCUENTRA24_ENV_FILE, override: false, quiet: true })
}
// The local application configuration uses Next's non-secret project URL.
// Map it only inside this server-side worker; the service-role key remains
// private and is never forwarded to browser or client code.
if (!process.env.SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_URL) {
  process.env.SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
}

const ROOT = process.env.ENCUENTRA24_RUN_ROOT || ''
const ENABLED = process.env.ENCUENTRA24_WEEKLY_SCHEDULE_ENABLED === '1'
const MANUAL = process.env.ENCUENTRA24_WEEKLY_OPERATOR_RUN === '1'
const VALIDATE_ONLY = process.env.ENCUENTRA24_WEEKLY_VALIDATE === '1'
const MAX_RUNTIME_MS = Math.min(69 * 60 * 1000, Number(process.env.ENCUENTRA24_WEEKLY_MAX_RUNTIME_MS || 69 * 60 * 1000))
const REPOSITORY = path.resolve(__dirname, '../..')
let activeChild = null

function required(condition, message) { if (!condition) throw new Error(message) }
function iso() { return new Date().toISOString() }
function atomic(file, value) { const temporary = `${file}.${process.pid}.tmp`; fs.writeFileSync(temporary, JSON.stringify(value, null, 2), { mode: 0o600 }); fs.renameSync(temporary, file) }
function validCap(value, name) { required(Number.isInteger(value) && value > 0 && value <= 10000, `${name} must be an integer from 1 to 10000`) }
function sha256(file) { return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex') }
function terminalStatus(summary, transaction) {
  const run=summary[transaction]||{}, completion=run.ingestion?.completion||{}
  if (summary.status==='INTERRUPTED') return 'stopped'
  if (summary.status==='FAILED') return 'failed'
  if (run.process?.code===0 && completion.inventory_complete===true && completion.status==='COMPLETE') return 'complete'
  return 'incomplete'
}
function agencyCsv(rows, transaction) {
  const quote=value=>`"${String(value??'').replace(/"/g,'""')}"`
  const groups=new Map()
  for (const row of rows) { const agency=String(row.agency_name||'').trim()||'Attribution unavailable'; const list=groups.get(agency)||[]; if(!list.some(item=>item.id===row.id)) list.push(row); groups.set(agency,list) }
  const lines=[['row_type','agency_name','published_listing_count','transaction_type','encuentra24_listing_url','twuanis_listing_url'].map(quote).join(',')]
  for (const [agency,list] of [...groups.entries()].sort(([a],[b])=>a.localeCompare(b))) {
    lines.push(['agency_summary',agency,list.length,transaction,'',''].map(quote).join(','))
    for (const row of list) lines.push(['listing',agency,list.length,transaction,row.source_url||'',`https://twuanis.com/en/${transaction==='sale'?'buy/listing':'rent-lease/listing'}/${row.id}`].map(quote).join(','))
  }
  return '\ufeff'+lines.join('\r\n')+'\r\n'
}
function propertyCsv(inventory, selections) {
  const Papa = require('papaparse')
  const rows = []
  for (const [id, property] of inventory.entries('properties')) {
    if (!selections.includes(property.transaction_type)) continue
    if (!property.raw_observation && (!property.extraction_status || property.extraction_status === 'pending') && !property.normalization_status && !property.canonical_status) continue
    const raw = property.raw_observation || {}, normalized = property.normalized_observation || {}
    const agency = property.agency_id ? inventory.get('agencies', property.agency_id) || {} : {}
    const agent = property.agent_id ? inventory.get('agents', property.agent_id) || {} : {}
    const value = key => normalized[key] ?? raw[key] ?? ''
    const listingId = property.canonical_result?.listing_id || ''
    const published = property.publication_status === 'published'
    rows.push({ source_listing_id: id, transaction_type: property.transaction_type || '', source_url: value('source_url') || property.source_url || '', observed_at: value('observed_at'), title: value('title'), description: value('description'), property_type: value('property_type'), raw_property_type: value('raw_property_type'), province: value('province'), canton: value('canton'), district: value('district'), source_breadcrumbs: value('raw_breadcrumbs'), price: value(property.transaction_type === 'rent' ? 'monthly_price' : 'current_price'), currency: value('currency'), property_area: value('raw_property_area'), construction_area: value('raw_construction_area'), bedrooms: value('raw_bedrooms'), bathrooms: value('raw_bathrooms'), parking: value('raw_parking'), year_built: value('raw_year_built'), property_photo_urls: value('images'), agency_name: normalized.agency_name || agency.name || '', agency_whatsapp: normalized.agency_whatsapp || agency.whatsapp || '', agency_logo_url: normalized.agency_logo_url || agency.logo_url || '', agent_name: normalized.agent_name || agent.name || '', agent_whatsapp: normalized.agent_whatsapp || agent.whatsapp || '', agent_photo_url: normalized.agent_photo_url || agent.photo_url || '', extraction_status: property.extraction_status || '', extraction_error: property.extraction_error || '', normalization_status: property.normalization_status || '', normalization_error: property.normalization_error || '', canonical_status: property.canonical_status || '', canonical_outcome: property.canonical_result?.outcome || property.canonical_result?.admission || '', canonical_error: property.canonical_error || '', publication_status: property.publication_status || '', publication_error: property.publication_error || '', twuanis_listing_id: listingId, twuanis_listing_url: published && listingId ? `https://twuanis.com/en/${property.transaction_type === 'rent' ? 'rent-lease' : 'buy'}/listing/${listingId}` : '', attribution_status: property.attribution_status || '', attribution_error: property.attribution_error || '' })
  }
  for (const row of rows) {
    const property = inventory.get('properties', row.source_listing_id) || {}
    const agency = property.agency_id ? inventory.get('agencies', property.agency_id) || {} : {}
    row.agency_whatsapp_status = agency.whatsapp_status || ''
    row.agency_skip_reason = agency.skip_reason || ''
    row.assigned_agent_status = agency.agent_acquisition_status || ''
  }
  const fields = ['source_listing_id','transaction_type','source_url','observed_at','title','description','property_type','raw_property_type','province','canton','district','source_breadcrumbs','price','currency','property_area','construction_area','bedrooms','bathrooms','parking','year_built','property_photo_urls','agency_name','agency_whatsapp','agency_whatsapp_status','agency_skip_reason','agency_logo_url','agent_name','agent_whatsapp','agent_photo_url','assigned_agent_status','extraction_status','extraction_error','normalization_status','normalization_error','canonical_status','canonical_outcome','canonical_error','publication_status','publication_error','twuanis_listing_id','twuanis_listing_url','attribution_status','attribution_error']
  return '\ufeff' + Papa.unparse({ fields, data: rows }, { newline: '\r\n', escapeFormulae: true }) + '\r\n'
}
async function publishedAgencyRows(client, transaction) {
  const rows=[]
  for(let offset=0;;offset+=1000) {
    const page=await client.select('listings',`select=id,agency_name,source_url&source_name=eq.encuentra24&listing_origin=eq.imported&transaction_type=eq.${transaction}&listing_status=eq.active&order=id.asc&limit=1000&offset=${offset}`)
    rows.push(...page); if(page.length<1000) return rows
  }
}
function notificationText(summary, transaction, publication) {
  const run=summary[transaction]||{}, ingestion=run.ingestion||{}, review=ingestion.removalReview||{}
  const complete=ingestion.completion?.inventory_complete===true
  const metrics=summary.cycle_metrics
  return [
    `Encuentra24 ${transaction==='sale'?'Sale':'Rent'} scraper run`,
    `Run: ${run.run_id||summary.weekly_run_id||'unavailable'}`,
    `Started: ${run.started_at||summary.started_at||'unavailable'}`,
    `Finished: ${run.finished_at||summary.finished_at||'unavailable'}`,
    `Final status: ${terminalStatus(summary,transaction)}`,
    ...(metrics ? [
      `Selected scopes: ${(summary.selected_scrapers||[]).join(', ')}`,
      `Duration ms: ${Number.isFinite(Date.parse(summary.finished_at)-Date.parse(summary.started_at)) ? Date.parse(summary.finished_at)-Date.parse(summary.started_at) : 'unavailable'}`,
      `Unique agencies encountered: ${metrics.agencies_encountered ?? 'unavailable'}; agency WhatsApp acquired: ${metrics.agency_whatsapp_acquired ?? 'unavailable'}; unique agents: ${metrics.agents}`,
      `Agencies skipped, WhatsApp unavailable: ${metrics.agency_whatsapp_unavailable ?? 0}; acquisition unsuccessful: ${metrics.agency_whatsapp_failed ?? 0}`,
      `Assigned-agent section absent: ${metrics.agent_section_absent ?? 0}; information acquired: ${metrics.agent_info_acquired ?? 0}; acquisition unsuccessful: ${metrics.agent_info_failed ?? 0}`,
      `Sale properties discovered: ${metrics.sale_discovered}; Rent properties discovered: ${metrics.rent_discovered}`,
      `Properties extracted: ${metrics.extracted}; normalized: ${metrics.normalized}`,
      `Published: ${metrics.published}; duplicate review: ${metrics.review}; rejected: ${metrics.rejected}; failed: ${metrics.failed}`,
      ...metrics.failure_details.map(item => `Failure ${item.source_listing_id}: ${item.reason}`)
    ] : []),
    `Listings collected: ${ingestion.captured??'unavailable'}`,
    publication ? `Current published Twuanis listings represented in CSV: ${publication.rows.length}` : 'Agency publication CSV: not attached because this run was not verified complete.',
    publication ? `Distinct agencies represented: ${publication.agencies}` : 'Distinct agencies represented: unavailable.',
    `Inventory complete: ${complete?'yes':'no'}`,
    complete ? `Suspected removals: ${review.created??'unavailable'}` : 'Removal reconciliation: not completed because the inventory was not verified complete.',
    complete ? `Candidates awaiting Owner review: ${review.pending??'unavailable'}` : 'Candidates awaiting Owner review: unavailable.',
    `Inconclusive removals: ${review.inconclusive??'unavailable'}`,
    'Listings archived through previous Owner decisions: unavailable.',
    'Suspected removals are not confirmed source unavailability and do not establish that a property was sold.',
    'Review: https://twuanis.com/admin?workspace=encuentra24-removed'
  ].join('\n')
}

function cycleNotificationSummary(cycle, inventory, startedAt, finishedAt) {
  const entries = inventory.entries('properties')
  const properties = entries.map(([, value]) => value)
  const metrics = {
    agencies: inventory.entries('agencies').filter(([, value]) => value.profile_acquisition_status === 'complete').length,
    agencies_encountered: inventory.entries('agencies').length,
    agency_whatsapp_acquired: inventory.entries('agencies').filter(([, value]) => value.whatsapp_status === 'acquired' && value.whatsapp).length,
    agency_whatsapp_unavailable: inventory.entries('agencies').filter(([, value]) => value.skip_reason === 'agency_whatsapp_unavailable').length,
    agency_whatsapp_failed: inventory.entries('agencies').filter(([, value]) => value.skip_reason === 'agency_whatsapp_acquisition_failed').length,
    agent_section_absent: inventory.entries('agencies').filter(([, value]) => value.agent_acquisition_status === 'section_absent').length,
    agent_info_acquired: inventory.entries('agencies').filter(([, value]) => value.agent_acquisition_status === 'acquired').length,
    agent_info_failed: inventory.entries('agencies').filter(([, value]) => value.agent_acquisition_status === 'acquisition_failed').length,
    agents: inventory.entries('agents').filter(([, value]) => value.contact_acquisition_complete === true).length,
    sale_discovered: properties.filter(p => p.transaction_type === 'sale').length,
    rent_discovered: properties.filter(p => p.transaction_type === 'rent').length,
    extracted: properties.filter(p => ['complete','detail_captured'].includes(p.extraction_status)).length,
    normalized: properties.filter(p => p.normalization_status === 'complete').length,
    published: properties.filter(p => p.publication_status === 'published').length,
    review: properties.filter(p => p.canonical_status === 'review_required').length,
    rejected: properties.filter(p => p.canonical_status === 'rejected').length,
    failed: properties.filter(p => p.extraction_status === 'failed' || p.normalization_status === 'failed' || p.canonical_status === 'failed').length,
    failure_details: entries.filter(([, p]) => p.extraction_status === 'failed' || p.normalization_status === 'failed' || p.canonical_status === 'failed').map(([id, p]) => ({ source_listing_id: id, reason: [p.extraction_status === 'failed' && p.extraction_error, p.normalization_status === 'failed' && p.normalization_error, p.canonical_status === 'failed' && p.canonical_error].filter(Boolean).join('; ') || 'Failure reason unavailable' }))
  }
  const summary = { weekly_run_id: cycle.cycleId, started_at: startedAt, finished_at: finishedAt, status: cycle.status === 'INTERRUPTED' ? 'INTERRUPTED' : cycle.status === 'FAILED' ? 'FAILED' : cycle.complete ? 'COMPLETED' : 'PARTIAL', selected_scrapers: cycle.selections.map(value => `encuentra24-${value}`), cycle_metrics: metrics }
  for (const transaction of cycle.selections) {
    const result = cycle.results?.[transaction] || {}
    const scoped = entries.filter(([, p]) => p.transaction_type === transaction)
    const complete = result.complete === true && result.inventory_complete === true && cycle.status !== 'INTERRUPTED' && cycle.status !== 'FAILED'
    summary[transaction] = { run_id: cycle.cycleId, started_at: startedAt, finished_at: finishedAt, process: { code: complete ? 0 : 1 }, ingestion: { captured: scoped.filter(([, p]) => ['detail_captured','complete'].includes(p.extraction_status)).length, published: scoped.filter(([, p]) => p.publication_status === 'published').length, rejected: scoped.filter(([, p]) => p.canonical_status === 'rejected').length, errors: scoped.filter(([, p]) => p.extraction_status === 'failed' || p.normalization_status === 'failed' || p.canonical_status === 'failed').map(([id,p]) => `${id}: ${p.extraction_error || p.normalization_error || p.canonical_error || 'Failure reason unavailable'}`), completion: { inventory_complete: complete, status: complete ? 'COMPLETE' : 'INCOMPLETE' }, removalReview: { status: 'not_invoked' }, reconciliation: { absence_applied: false, archived: 0 } } }
  }
  return summary
}
async function sendEncuentra24Notification(summary, transaction, dependencies = {}) {
  // The local listener keeps recipients in one comma-separated secret setting.
  // Resend accepts an address array, so Sale and Rent always receive the same
  // deduplicated recipient set without changing other scraper notifications.
  const to=[...new Set(String(process.env.SCRAPER_NOTIFICATION_TO||'').split(',').map(value=>value.trim()).filter(Boolean))], from=process.env.EMAIL_FROM
  if (!to.length || !from || !process.env.RESEND_API_KEY) return {state:'not_configured'}
  try {
    const {Resend}=require('resend')
    const run=summary[transaction]||{}
    let publication=null
    if (terminalStatus(summary,transaction)==='complete') {
      const rows=await publishedAgencyRows(dependencies.client || createClient(),transaction)
      publication={rows,agencies:new Set(rows.map(row=>String(row.agency_name||'').trim()||'Attribution unavailable')).size}
    }
    const message={from,to,subject:`Twuanis Encuentra24 ${transaction==='sale'?'Sale':'Rent'}: ${terminalStatus(summary,transaction)}`,text:notificationText(summary,transaction,publication)}
    message.attachments=[]
    if (publication) message.attachments.push({filename:`encuentra24-${transaction}-published-agencies.csv`,content:Buffer.from(agencyCsv(publication.rows,transaction)).toString('base64')})
    if (dependencies.inventory) message.attachments.push({filename:`encuentra24-${summary.weekly_run_id}-properties.csv`,content:Buffer.from(propertyCsv(dependencies.inventory, (summary.selected_scrapers || []).map(value=>value.replace(/^encuentra24-/,'')))).toString('base64')})
    const sender = dependencies.resend || new Resend(process.env.RESEND_API_KEY)
    const response=await sender.emails.send(message,{idempotencyKey:dependencies.idempotencyKey || `encuentra24-terminal-${run.run_id||summary.weekly_run_id}-${transaction}`})
    // A same-key 409 proves this transaction's terminal message was already
    // accepted. Treat it as delivered for Sale and Rent; other errors remain
    // visible rather than being masked as duplicate notifications.
    if (response.error?.statusCode===409 || response.error?.status===409) return {state:'already_sent',idempotency_key:`encuentra24-terminal-${run.run_id||summary.weekly_run_id}-${transaction}`}
    return response.error||!response.data?.id?{state:'failed',error:response.error?.message||'delivery_unconfirmed'}:{state:'sent',id:response.data.id}
  } catch(error) { return {state:'failed',error:error?.message||String(error)} }
}
function parseCsv(text) { const rows=[]; let row=[], value='', quoted=false; for(let i=0;i<text.length;i++){const c=text[i];if(c==='"'){if(quoted&&text[i+1]==='"'){value+='"';i++}else quoted=!quoted}else if(c===','&&!quoted){row.push(value);value=''}else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&text[i+1]==='\n')i++;row.push(value);if(row.some(Boolean))rows.push(row);row=[];value=''}else value+=c}if(value||row.length){row.push(value);rows.push(row)}const [headers,...data]=rows;return data.map(values=>Object.fromEntries(headers.map((header,index)=>[header,values[index]||''])))}
async function ingestAndReconcile(file, transaction, runId, startedAt, processResult) {
  let rows=[], errors=[]; try { rows=parseCsv(fs.readFileSync(file,'utf8')) } catch(error) { errors.push(error.message) }
  const archive=createRunArchive(path.join(path.dirname(file),'source-observation-archive'),{commandId:process.env.TWUANIS_SCRAPER_COMMAND_ID||runId,sourceName:'encuentra24',transaction,extractedAt:startedAt})
  const client=createClient(), observedIds=[...new Set(rows.map(row=>String(row.source_listing_id||'').trim()).filter(Boolean))]
  let published=0,rejected=0,failed=0
  for(const row of rows){try{const result=await ingestObservation(client,row,{runId,startedAt});const outcome=String(result?.outcome||'');archive.outcome(row,{outcome,reason:result?.reason||null});if(outcome==='accepted'||outcome==='succeeded')published++;else rejected++}catch(error){failed++;errors.push(error.message);archive.outcome(row,{outcome:'failed',reason:error.message})}}
  // Encuentra24 absence is never an automatic lifecycle action.  A complete
  // inventory can create Owner-review candidates; partial and failed runs
  // retain/ingest their observations but create no absence candidates.
  let completion={status:'incomplete',inventory_complete:false,errors}
  for (const candidate of [path.join(path.dirname(file),'run-summary.json'), path.join(path.dirname(file),'source-observation-archive','run-summary.json')]) {
    try { completion={...completion,...JSON.parse(fs.readFileSync(candidate,'utf8'))}; break } catch { /* absent or unreadable means incomplete */ }
  }
  const removalReview=processResult.code===0&&completion.inventory_complete===true&&observedIds.length>0
    ?await recordRemovedListingCandidates(client,{transaction,runId,startedAt,completion,observedIds})
    :{created:0,pending:0,inconclusive:0,status:'skipped',reason:'INVENTORY_NOT_VERIFIED_COMPLETE'}
  await archive.finalize()
  return { captured:observedIds.length,published,rejected,failed,errors,completion,removalReview,
    reconciliation:{absence_applied:false,status:'disabled',reason:'ENCUENTRA24_OWNER_REVIEW_REQUIRED'} }
}

function authorityPreflight() {
  const geography = process.env.ENCUENTRA24_GEOGRAPHY_CSV
  const geographyHash = process.env.ENCUENTRA24_GEOGRAPHY_SHA256
  const quarantine = process.env.ENCUENTRA24_QUARANTINE_REGISTER
  const quarantineHash = process.env.ENCUENTRA24_QUARANTINE_SHA256
  for (const [file, hash, label] of [[geography, geographyHash, 'geography'], [quarantine, quarantineHash, 'Sale quarantine']]) {
    required(file && fs.existsSync(file), `Missing ${label} authority file`)
    required(/^[a-f0-9]{64}$/i.test(hash || '') && sha256(file) === hash, `${label} authority hash mismatch`)
  }
  required(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY, 'Missing server-side canonical service credentials')
}

function costaRicaScheduleNow(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Costa_Rica', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(now)
  const get = type => parts.find(part => part.type === type)?.value
  return { weekday: get('weekday'), hour: Number(get('hour')), minute: Number(get('minute')) }
}

function scheduleAllowsStart(now = new Date()) {
  const current = costaRicaScheduleNow(now)
  // The host scheduler owns the exact 23:00 UTC trigger. A short grace period
  // permits normal dispatch delay without permitting an accidental second run.
  return current.weekday === 'Fri' && current.hour === 17 && current.minute < 10
}

function resolveSelectedScrapers(value = process.env.ENCUENTRA24_SELECTED_SCRAPERS) {
  const selected = String(value || 'encuentra24-sale,encuentra24-rent')
    .split(',')
    .map(item => item.trim())
    .filter(Boolean)
  const unique = [...new Set(selected)].sort()
  required(unique.length >= 1 && unique.length <= 2 && unique.every(item => item === 'encuentra24-sale' || item === 'encuentra24-rent'), 'Unsupported scraper selection')
  return unique
}

function acquireLock(root, maxRuntimeMs = MAX_RUNTIME_MS) {
  const lock = path.join(root, 'weekly-controller.lock')
  try { fs.writeFileSync(lock, JSON.stringify({ pid: process.pid, acquired_at: iso(), expires_at: new Date(Date.now() + maxRuntimeMs + 5 * 60 * 1000).toISOString() }), { flag: 'wx', mode: 0o600 }) } catch (error) {
    if (error.code !== 'EEXIST') throw error
    let prior
    try { prior = JSON.parse(fs.readFileSync(lock, 'utf8')) } catch { throw new Error('Weekly controller lock cannot be read safely') }
    if (!prior.expires_at || Date.parse(prior.expires_at) > Date.now()) throw new Error('Another weekly Encuentra24 controller is active or requires recovery')
    fs.unlinkSync(lock)
    fs.writeFileSync(lock, JSON.stringify({ pid: process.pid, acquired_at: iso(), expires_at: new Date(Date.now() + maxRuntimeMs + 5 * 60 * 1000).toISOString() }), { flag: 'wx', mode: 0o600 })
  }
  return lock
}

function runChild(script, args, environment, logFile) {
  return new Promise((resolve, reject) => {
    const log = fs.openSync(logFile, 'a', 0o600)
    const child = spawn(process.execPath, [script, ...args], { cwd: REPOSITORY, env: environment, stdio: ['ignore', log, log] })
    activeChild = child
    const timer = setTimeout(() => child.kill('SIGTERM'), MAX_RUNTIME_MS)
    child.once('error', error => { activeChild = null; clearTimeout(timer); reject(error) })
    child.once('exit', (code, signal) => { activeChild = null; clearTimeout(timer); resolve({ code, signal }) })
  })
}

async function reconcileInterruptedRent(ledgerFile, reportFile) {
  const interrupted = interruptedSourceIds(ledgerFile)
  if (!interrupted.length) return []
  const client = createClient()
  const results = []
  for (const sourceListingId of interrupted) {
    const rows = await client.select('listing_source_observations', `select=source_listing_id,outcome,processed_at,result_revision&source_name=eq.encuentra24&source_listing_id=eq.${encodeURIComponent(sourceListingId)}&order=processed_at.desc&limit=1`)
    if (rows.length) recordLedger(ledgerFile, { sourceListingId, status: 'PRODUCTION_RECONCILED', terminal: true, detail: { observation: rows[0] } })
    results.push({ source_listing_id: sourceListingId, production_observation: rows[0] || null })
  }
  atomic(reportFile, { reconciled_at: iso(), interrupted: results })
  return results
}

function validateRuntime() {
  resolveSelectedScrapers()
  required(ROOT && path.isAbsolute(ROOT), 'ENCUENTRA24_RUN_ROOT must be an absolute persistent volume path')
  authorityPreflight()
  const puppeteer = require('puppeteer')
  const browserExecutable = puppeteer.executablePath()
  required(browserExecutable && fs.existsSync(browserExecutable), 'Puppeteer browser executable is unavailable')
  fs.mkdirSync(ROOT, { recursive: true, mode: 0o700 })
  const lock = acquireLock(ROOT)
  try {
    const file = path.join(ROOT, 'deployment-preflight.json')
    const evidence = { validated_at: iso(), browser_executable: browserExecutable, schedule_enabled: ENABLED }
    atomic(file, evidence)
    required(JSON.parse(fs.readFileSync(file, 'utf8')).validated_at === evidence.validated_at, 'Persistent run storage cannot be read after write')
    const ledger = path.join(ROOT, 'deployment-preflight-rent-ledger.json')
    recordLedger(ledger, { sourceListingId: '0', sourceUrl: 'local://preflight', status: 'PREFLIGHT', terminal: true })
    required(readLedger(ledger).entries['0']?.terminal === true, 'Rent ledger is not durable')
    return evidence
  } finally { fs.unlinkSync(lock) }
}

async function invokeAdvertiserCycle({ root, cycleId, selectedScrapers, dependencies = {} }) {
  const { initializeCycle, executeCycle } = require('./encuentra24-index/cycle.cjs')
  const configs = dependencies.configs || require('./encuentra24-index/config.cjs')
  const run = dependencies.run || require('./encuentra24-index/run.cjs').run
  const ingest = dependencies.ingest || require('./encuentra24-index/ingestion.cjs').ingest
  const selections = selectedScrapers.map(value => value.replace(/^encuentra24-/, ''))
  const testFile = path.join(root, 'bounded-sale-test.json')
  let test = null
  try { test = JSON.parse(fs.readFileSync(testFile, 'utf8')) } catch (error) { if (error.code !== 'ENOENT') throw error }
    if (test && (![10, 100, 1000, 10000].includes(test.limit) || selections.length !== 1 || selections[0] !== 'sale' || (test.cycleId && test.cycleId !== cycleId) || (test.limit === 10000 ? test.maxRuntimeMs !== 86400000 : test.limit === 1000 ? test.maxRuntimeMs !== 14400000 : test.maxRuntimeMs != null))) throw new Error('The armed bounded test permits only its configured Sale cycle')
    if (test && !test.cycleId) atomic(testFile, { ...test, cycleId })
  const cycle = initializeCycle({ root: path.join(root, 'advertiser-cycles'), cycleId, selections })
  const execute = dependencies.executeCycle || executeCycle
  const result = await execute(cycle, { run, ingest, configs, limit: test ? test.limit : 0, maxRuntimeMs: [1000, 10000].includes(test?.limit) ? test.maxRuntimeMs : MAX_RUNTIME_MS, extendedSaleTest: [1000, 10000].includes(test?.limit), ...(dependencies.notify ? { notify: dependencies.notify } : {}) })
  return { ...result, boundedSaleTest: Boolean(test) }
}

async function main() {
  if (VALIDATE_ONLY) { console.log(JSON.stringify({ status: 'VALIDATED', ...validateRuntime() })); return }
  // Stage 1's secure default: a scheduler can invoke this safely, but it will
  // never acquire, ingest, or publish until an explicit Stage 2 enablement.
  if (!ENABLED && !MANUAL) { console.log(JSON.stringify({ status: 'DISABLED', schedule: 'Friday 17:00 America/Costa_Rica (23:00 UTC)' })); return }
  const selectedScrapers = resolveSelectedScrapers()
  required(ROOT && path.isAbsolute(ROOT), 'ENCUENTRA24_RUN_ROOT must be an absolute persistent volume path')
  required(scheduleAllowsStart() || process.env.ENCUENTRA24_WEEKLY_OPERATOR_RUN === '1', 'Refusing start outside Friday 17:00 America/Costa_Rica')
  authorityPreflight(); fs.mkdirSync(ROOT, { recursive: true, mode: 0o700 })
  let lockTest
  try { lockTest = JSON.parse(fs.readFileSync(path.join(ROOT, 'bounded-sale-test.json'), 'utf8')) } catch (error) { if (error.code !== 'ENOENT') throw error }
  const extendedLock = ((lockTest?.limit === 1000 && lockTest.maxRuntimeMs === 14400000) || (lockTest?.limit === 10000 && lockTest.maxRuntimeMs === 86400000)) && selectedScrapers.length === 1 && selectedScrapers[0] === 'encuentra24-sale'
  const lock = acquireLock(ROOT, extendedLock ? lockTest.maxRuntimeMs : MAX_RUNTIME_MS)
  const activeFile = path.join(ROOT, 'weekly-active-run.json')
  let active
  try { active = JSON.parse(fs.readFileSync(activeFile, 'utf8')) } catch (error) { if (error.code !== 'ENOENT') throw error }
  let armedTest
  try { armedTest = JSON.parse(fs.readFileSync(path.join(ROOT, 'bounded-sale-test.json'), 'utf8')) } catch (error) { if (error.code !== 'ENOENT') throw error }
  if (armedTest?.cycleId && !/^[0-9a-f-]{36}$/i.test(armedTest.cycleId)) throw new Error('Invalid armed Sale test cycle identity')
  if (active && armedTest?.cycleId && active.weekly_run_id !== armedTest.cycleId) throw new Error('An existing run conflicts with the armed Sale test')
  const weeklyRunId = active?.weekly_run_id || armedTest?.cycleId || crypto.randomUUID(); const startedAt = active?.started_at || iso(); const directory = active?.directory || path.join(ROOT, `weekly-${startedAt.replace(/[:.]/g, '-')}-${weeklyRunId}`)
  fs.mkdirSync(directory, { recursive: true, mode: 0o700 })
  const summary = active?.summary || { weekly_run_id: weeklyRunId, started_at: startedAt, status: 'RUNNING', schedule: 'Friday 17:00 America/Costa_Rica', selected_scrapers: selectedScrapers, sale: {}, rent: {} }
  if (!Array.isArray(summary.selected_scrapers)) {
    required(selectedScrapers.length === 2, 'Active run selection does not match requested selection')
    summary.selected_scrapers = selectedScrapers
  }
  required(summary.selected_scrapers.join(',') === selectedScrapers.join(','), 'Active run selection does not match requested selection')
  const persist = () => { atomic(path.join(directory, 'weekly-run-summary.json'), summary); atomic(activeFile, { weekly_run_id: weeklyRunId, started_at: startedAt, directory, summary }) }
  let stopRequested = false
  const requestStop = signal => {
    if (stopRequested) return
    stopRequested = true
    summary.status = 'INTERRUPTED'; summary.stop_requested_at = iso(); summary.stop_signal = signal; persist()
    if (activeChild) activeChild.kill('SIGTERM')
  }
  const onSigterm = () => requestStop('SIGTERM')
  const onSigint = () => requestStop('SIGINT')
  process.once('SIGTERM', onSigterm)
  process.once('SIGINT', onSigint)
  persist()
  try {
    // The new cycle owns its notifications and emits existing progress events
    // directly on stdout for the command listener. Signal handlers in the
    // cycle and runner receive the same controller SIGTERM/SIGINT.
    const cycleResult = await invokeAdvertiserCycle({ root: ROOT, cycleId: weeklyRunId, selectedScrapers })
    Object.assign(summary, cycleResult.notification_summary || {})
    summary.status = stopRequested || cycleResult.status === 'INTERRUPTED' ? 'INTERRUPTED' : cycleResult.status === 'FAILED' ? 'FAILED' : cycleResult.complete ? 'COMPLETED' : 'PARTIAL'
    summary.cycle_directory = cycleResult.inventoryDirectory
    summary.cycle_notifications_sent = true
    summary.bounded_sale_test = cycleResult.boundedSaleTest === true
    if (summary.bounded_sale_test && cycleResult.results?.sale?.reason === 'limit') {
      fs.unlinkSync(path.join(ROOT, 'bounded-sale-test.json'))
      summary.bounded_sale_test_finished = true
    }
    if (summary.status !== 'COMPLETED') process.exitCode = 1
    persist()
    return
    if (!selectedScrapers.includes('encuentra24-sale')) {
      summary.sale = { skipped: true, reason: 'not_selected' }; persist()
    } else if (!summary.sale.completed) {
      const saleRunId = summary.sale.run_id || crypto.randomUUID()
      const retry = Number(summary.sale.attempts || 0)
      const saleOutput = path.join(directory, retry ? `sale-recovery-${retry}.csv` : 'sale.csv')
      const priorOutput = summary.sale.output
      const resume = priorOutput && fs.existsSync(priorOutput) ? { ENCUENTRA24_SKIP_CSV: priorOutput, ENCUENTRA24_SKIP_SHA256: sha256(priorOutput) } : {}
      const recoveryIndex = summary.sale.recovery_index || process.env.ENCUENTRA24_SALE_RECOVERY_INDEX || path.join(directory, 'source-observation-archive', 'listing-index.ndjson')
      const recoveryCheckpoint = summary.sale.recovery_checkpoint || process.env.ENCUENTRA24_SALE_RECOVERY_CHECKPOINT || path.join(directory, 'source-observation-archive', 'source-observations.ndjson')
      summary.sale = { ...summary.sale, run_id: saleRunId, started_at: summary.sale.started_at || iso(), output: saleOutput, recovery_index: recoveryIndex, recovery_checkpoint: recoveryCheckpoint, attempts: retry + 1 }; persist()
      summary.sale.process = await runChild('scripts/scrapers/encuentra24-sale-scraper.js', ['bienes-raices-venta-de-propiedades', saleOutput], { ...process.env, ...resume, ENCUENTRA24_SALE_RECOVERY_INDEX: recoveryIndex, ENCUENTRA24_SALE_RECOVERY_CHECKPOINT: recoveryCheckpoint, ENCUENTRA24_CANONICAL_INGEST: '1', ENCUENTRA24_RUN_ID: saleRunId, ENCUENTRA24_RUN_STARTED_AT: startedAt }, path.join(directory, 'sale.log'))
      summary.sale.ingestion = await ingestAndReconcile(saleOutput,'sale',saleRunId,startedAt,summary.sale.process)
      summary.sale.finished_at = iso(); summary.sale.completed = summary.sale.process.code === 0; persist()
      if (!summary.sale.completed) throw new Error('Sale scraper did not complete successfully')
    }
    if (stopRequested) throw new Error('Stop requested')

    if (!selectedScrapers.includes('encuentra24-rent')) {
      summary.rent = { skipped: true, reason: 'not_selected' }; summary.status = 'COMPLETED'; persist()
    } else if (!summary.rent.completed) {
      const rentRunId = summary.rent.run_id || crypto.randomUUID(); const ledger = summary.rent.ledger || path.join(directory, 'rent-run-ledger.json'); const retry = Number(summary.rent.attempts || 0); const rentOutput = path.join(directory, retry ? `rent-recovery-${retry}.csv` : 'rent.csv')
      summary.rent = { ...summary.rent, run_id: rentRunId, started_at: summary.rent.started_at || iso(), output: rentOutput, ledger, attempts: retry + 1 }; persist()
      await reconcileInterruptedRent(ledger, path.join(directory, 'rent-reconciliation.json'))
      summary.rent.process = await runChild('scripts/scrapers/encuentra24-rent-scraper.js', ['bienes-raices-alquiler', '', rentOutput], { ...process.env, ENCUENTRA24_CANONICAL_INGEST: '1', ENCUENTRA24_RUN_ID: rentRunId, ENCUENTRA24_RUN_STARTED_AT: startedAt, ENCUENTRA24_RENT_RUN_LEDGER: ledger }, path.join(directory, 'rent.log'))
      summary.rent.ingestion = await ingestAndReconcile(rentOutput,'rent',rentRunId,startedAt,summary.rent.process)
      summary.rent.finished_at = iso(); summary.rent.completed = summary.rent.process.code === 0; summary.status = summary.rent.completed ? 'COMPLETED' : 'PARTIAL'; persist()
    }
    if (summary.status === 'COMPLETED') fs.unlinkSync(activeFile)
  } catch (error) { summary.status = stopRequested ? 'INTERRUPTED' : 'FAILED'; summary.error = error.message; persist(); if (!stopRequested) throw error } finally {
    // The command listener records this compact terminal evidence and includes
    // it in the Owner's execution report.  Counts that the scraper does not
    // retain remain intentionally unavailable rather than being reported as 0.
    summary.finished_at = iso();
    if (!summary.cycle_notifications_sent) {
      summary.notifications={}
      for (const transaction of ['sale','rent']) {
        if (summary[transaction]?.run_id) summary.notifications[transaction]=await sendEncuentra24Notification(summary,transaction)
      }
    }
    persist()
    if ((summary.status === 'COMPLETED' || summary.bounded_sale_test_finished) && fs.existsSync(activeFile)) fs.unlinkSync(activeFile)
    console.log(JSON.stringify({ scraper_execution_summary: summary }))
    process.removeListener('SIGTERM', onSigterm); process.removeListener('SIGINT', onSigint); fs.unlinkSync(lock)
  }
}

if (require.main === module) main().catch(error => { console.error(error.message); process.exitCode = 1 })
module.exports = { costaRicaScheduleNow, scheduleAllowsStart, resolveSelectedScrapers, authorityPreflight, terminalStatus, notificationText, sendEncuentra24Notification, cycleNotificationSummary, agencyCsv, propertyCsv, publishedAgencyRows, invokeAdvertiserCycle }
