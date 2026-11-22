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
  return [
    `Encuentra24 ${transaction==='sale'?'Sale':'Rent'} scraper run`,
    `Run: ${run.run_id||summary.weekly_run_id||'unavailable'}`,
    `Started: ${run.started_at||summary.started_at||'unavailable'}`,
    `Finished: ${run.finished_at||summary.finished_at||'unavailable'}`,
    `Final status: ${terminalStatus(summary,transaction)}`,
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
async function sendEncuentra24Notification(summary, transaction) {
  const to=process.env.SCRAPER_NOTIFICATION_TO, from=process.env.EMAIL_FROM
  if (!to || !from || !process.env.RESEND_API_KEY) return {state:'not_configured'}
  try {
    const {Resend}=require('resend')
    const run=summary[transaction]||{}
    let publication=null
    if (terminalStatus(summary,transaction)==='complete') {
      const rows=await publishedAgencyRows(createClient(),transaction)
      publication={rows,agencies:new Set(rows.map(row=>String(row.agency_name||'').trim()||'Attribution unavailable')).size}
    }
    const message={from,to,subject:`Twuanis Encuentra24 ${transaction==='sale'?'Sale':'Rent'}: ${terminalStatus(summary,transaction)}`,text:notificationText(summary,transaction,publication)}
    if (publication) message.attachments=[{filename:`encuentra24-${transaction}-published-agencies.csv`,content:Buffer.from(agencyCsv(publication.rows,transaction)).toString('base64')}]
    const response=await new Resend(process.env.RESEND_API_KEY).emails.send(message,{idempotencyKey:`encuentra24-terminal-${run.run_id||summary.weekly_run_id}-${transaction}`})
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

function acquireLock(root) {
  const lock = path.join(root, 'weekly-controller.lock')
  try { fs.writeFileSync(lock, JSON.stringify({ pid: process.pid, acquired_at: iso(), expires_at: new Date(Date.now() + MAX_RUNTIME_MS + 5 * 60 * 1000).toISOString() }), { flag: 'wx', mode: 0o600 }) } catch (error) {
    if (error.code !== 'EEXIST') throw error
    let prior
    try { prior = JSON.parse(fs.readFileSync(lock, 'utf8')) } catch { throw new Error('Weekly controller lock cannot be read safely') }
    if (!prior.expires_at || Date.parse(prior.expires_at) > Date.now()) throw new Error('Another weekly Encuentra24 controller is active or requires recovery')
    fs.unlinkSync(lock)
    fs.writeFileSync(lock, JSON.stringify({ pid: process.pid, acquired_at: iso(), expires_at: new Date(Date.now() + MAX_RUNTIME_MS + 5 * 60 * 1000).toISOString() }), { flag: 'wx', mode: 0o600 })
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

async function main() {
  if (VALIDATE_ONLY) { console.log(JSON.stringify({ status: 'VALIDATED', ...validateRuntime() })); return }
  // Stage 1's secure default: a scheduler can invoke this safely, but it will
  // never acquire, ingest, or publish until an explicit Stage 2 enablement.
  if (!ENABLED && !MANUAL) { console.log(JSON.stringify({ status: 'DISABLED', schedule: 'Friday 17:00 America/Costa_Rica (23:00 UTC)' })); return }
  const selectedScrapers = resolveSelectedScrapers()
  required(ROOT && path.isAbsolute(ROOT), 'ENCUENTRA24_RUN_ROOT must be an absolute persistent volume path')
  required(scheduleAllowsStart() || process.env.ENCUENTRA24_WEEKLY_OPERATOR_RUN === '1', 'Refusing start outside Friday 17:00 America/Costa_Rica')
  authorityPreflight(); fs.mkdirSync(ROOT, { recursive: true, mode: 0o700 })
  const lock = acquireLock(ROOT)
  const activeFile = path.join(ROOT, 'weekly-active-run.json')
  let active
  try { active = JSON.parse(fs.readFileSync(activeFile, 'utf8')) } catch (error) { if (error.code !== 'ENOENT') throw error }
  const weeklyRunId = active?.weekly_run_id || crypto.randomUUID(); const startedAt = active?.started_at || iso(); const directory = active?.directory || path.join(ROOT, `weekly-${startedAt.replace(/[:.]/g, '-')}-${weeklyRunId}`)
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
    if (!selectedScrapers.includes('encuentra24-sale')) {
      summary.sale = { skipped: true, reason: 'not_selected' }; persist()
    } else if (!summary.sale.completed) {
      const saleRunId = summary.sale.run_id || crypto.randomUUID()
      const retry = Number(summary.sale.attempts || 0)
      const saleOutput = path.join(directory, retry ? `sale-recovery-${retry}.csv` : 'sale.csv')
      const priorOutput = summary.sale.output
      const resume = priorOutput && fs.existsSync(priorOutput) ? { ENCUENTRA24_SKIP_CSV: priorOutput, ENCUENTRA24_SKIP_SHA256: sha256(priorOutput) } : {}
      summary.sale = { ...summary.sale, run_id: saleRunId, started_at: summary.sale.started_at || iso(), output: saleOutput, attempts: retry + 1 }; persist()
      summary.sale.process = await runChild('scripts/scrapers/encuentra24-sale-scraper.js', ['bienes-raices-venta-de-propiedades', '', saleOutput], { ...process.env, ...resume, ENCUENTRA24_CANONICAL_INGEST: '1', ENCUENTRA24_RUN_ID: saleRunId, ENCUENTRA24_RUN_STARTED_AT: startedAt }, path.join(directory, 'sale.log'))
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
    summary.notifications={}
    for (const transaction of ['sale','rent']) {
      if (summary[transaction]?.run_id) summary.notifications[transaction]=await sendEncuentra24Notification(summary,transaction)
    }
    persist()
    console.log(JSON.stringify({ scraper_execution_summary: summary }))
    process.removeListener('SIGTERM', onSigterm); process.removeListener('SIGINT', onSigint); fs.unlinkSync(lock)
  }
}

if (require.main === module) main().catch(error => { console.error(error.message); process.exitCode = 1 })
module.exports = { costaRicaScheduleNow, scheduleAllowsStart, resolveSelectedScrapers, authorityPreflight, terminalStatus, notificationText, sendEncuentra24Notification, agencyCsv, publishedAgencyRows }
