'use strict'

// Outbound-only iMac worker. It is deliberately inert until a launchd job
// starts it after migration 117 is installed; it never exposes a local port.
require('dotenv').config({ path: process.env.ENCUENTRA24_ENV_FILE || '.env.local', quiet: true })
if (!process.env.SUPABASE_URL) process.env.SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL

const { spawn } = require('node:child_process')
const path = require('node:path')
const { createClient } = require('./encuentra24-canonical-ingestion-adapter.cjs')

const root = path.resolve(__dirname, '../..')
const client = createClient()
const intervalMs = Number(process.env.ENCUENTRA24_COMMAND_POLL_MS || 30000)
const { configurations: wasiConfigurations, run: runWasi } = require('./wasi-command-runner.cjs')
const supported = new Set(['encuentra24-sale', 'encuentra24-rent', ...Object.keys(wasiConfigurations)])
const REPORT_TO = 'ryan@twuanis.com'
let busy = false
let child = null
let stopping = false

function selection(value) {
  const selected = [...new Set((value || []).map(String))].sort()
  if (!selected.length || selected.length > 2 || selected.some(item => !supported.has(item))) throw new Error('Unsupported scraper selection')
  if (selected.some(item => item.startsWith('encuentra24-')) && selected.some(item => !item.startsWith('encuentra24-'))) throw new Error('Select one scraper website per command')
  return selected
}

async function rpc(p_operation, p_payload = {}) {
  return client.rpc('scraper_worker_command', { p_operation, p_payload })
}

async function report(commandId, state, summary = {}, notificationState) {
  const payload = { commandId, state, summary }
  if (notificationState) payload.notificationState = notificationState
  return rpc('report', payload)
}

async function stopRequested(commandId) {
  const result = await client.rpc('scraper_worker_stop_requested', { p_command: commandId })
  return result === true || result?.stopRequested === true
}

async function notifyLaunch(commandId, selected) {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.EMAIL_FROM
  const to = process.env.SCRAPER_NOTIFICATION_TO
  if (!apiKey || !from || !to) return { state: 'not_requested', reason: 'email_not_configured' }
  const { Resend } = require('resend')
  const { data, error } = await new Resend(apiKey).emails.send({
    from,
    to,
    subject: 'Twuanis scraper command launched',
    text: `Command ${commandId} launched for ${selected.join(', ')}.`,
  }, { idempotencyKey: `scraper-command-${commandId}` })
  if (error || !data?.id) throw new Error(error?.message || 'Email delivery not confirmed')
  return { state: 'sent', id: data.id }
}

function reportText(commandId, selected, startedAt, finishedAt, state, summary) {
  const metric = key => summary?.[key] ?? 'unavailable'
  return ['Twuanis scraper execution report', `Command: ${commandId}`, `Website / scraper: ${selected.join(', ')}`, `Started: ${startedAt}`, `Finished: ${finishedAt}`, `Duration ms: ${Math.max(0, Date.parse(finishedAt) - Date.parse(startedAt))}`, `Final status: ${state}`, `Sale listings extracted: ${metric('saleListingsExtracted')}`, `Rent listings extracted: ${metric('rentListingsExtracted')}`, `Pages retrieved: ${metric('pagesRetrieved')}`, `Pagination status: ${metric('paginationStatus')}`, `Listings created: ${metric('created')}`, `Listings updated: ${metric('updated')}`, `Listings published: ${metric('published')}`, `Listings rejected: ${metric('rejected')}`, `Listings archived: ${metric('archived')}`, `Active inventory total: ${metric('activeInventoryTotal')}`, `Agency logos extracted: ${metric('agencyLogos')}`, `Agent photographs extracted: ${metric('agentPhotos')}`, `Errors, blocked requests and pagination failures: ${metric('errors')}`, '', 'Unavailable is distinct from zero and means this execution did not retain that metric.'].join('\n')
}

async function sendExecutionReport(commandId, selected, startedAt, finishedAt, state, summary) {
  const from = process.env.EMAIL_FROM
  if (!process.env.RESEND_API_KEY || !from) return { state: 'failed', error: 'email_not_configured' }
  const { Resend } = require('resend')
  const { data, error } = await new Resend(process.env.RESEND_API_KEY).emails.send({ from, to: REPORT_TO, subject: `Twuanis scraper ${state}: ${selected.join(', ')}`, text: reportText(commandId, selected, startedAt, finishedAt, state, summary) }, { idempotencyKey: `scraper-execution-report-${commandId}` })
  return error || !data?.id ? { state: 'failed', error: error?.message || 'Email delivery not confirmed' } : { state: 'sent', id: data.id }
}

async function execute(command) {
  let selected
  try {
    selected = selection(command.scrapers)
  } catch (error) {
    await report(command.id, 'rejected', { error: error.message })
    return
  }
  busy = true
  const startedAt = new Date().toISOString()
  let terminalState = 'failed'
  let terminalSummary = {}
  let wasiResult = null
  let encuentraResult = null
  const logs = []
  let stopTimer = null
  const addLog = (stream, value) => {
    const line = String(value || '').trim()
    if (!line) return
    logs.push({ at: new Date().toISOString(), stream, line: line.slice(0, 1000) })
    if (logs.length > 24) logs.splice(0, logs.length - 24)
    if (stream === 'stdout') {
      for (const candidate of line.split(/\r?\n/)) {
        try {
          const payload = JSON.parse(candidate)
          if (payload?.wasi_result?.counts) wasiResult = payload.wasi_result
          if (payload?.scraper_execution_summary) encuentraResult = payload.scraper_execution_summary
        } catch { /* non-JSON controller output is retained as a log */ }
      }
    }
  }
  try {
    await report(command.id, 'running', { selected, startedAt, logs: [{ at: startedAt, stream: 'listener', line: 'Command accepted by local listener.' }] })
    try {
      const notification = await notifyLaunch(command.id, selected)
      await report(command.id, 'running', { selected, notification }, notification.state)
    } catch (error) {
      await report(command.id, 'running', { selected, notification: { state: 'failed', error: error.message } }, 'failed')
    }
    if (selected.every(item => item.startsWith('encuentra24-'))) child = spawn(process.execPath, ['scripts/scrapers/weekly-encuentra24-controller.js'], {
      cwd: root,
      env: {
        ...process.env,
        ENCUENTRA24_WEEKLY_SCHEDULE_ENABLED: '0',
        ENCUENTRA24_WEEKLY_OPERATOR_RUN: '1',
        ENCUENTRA24_SELECTED_SCRAPERS: selected.join(','),
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    else child = spawn(process.execPath, ['scripts/scrapers/wasi-command-runner.cjs', selected[0], path.join(process.env.ENCUENTRA24_RUN_ROOT || path.join(root, 'var'), 'wasi-manual-runs')], {
      cwd: root, env: process.env, stdio: ['ignore', 'pipe', 'pipe']
    })
    child.stdout.on('data', value => addLog('stdout', value))
    child.stderr.on('data', value => addLog('stderr', value))
    stopTimer = setInterval(() => {
      void stopRequested(command.id).then(requested => {
        if (requested && child && !child.killed) {
          stopping = true
          addLog('listener', 'Owner requested stop; sending SIGTERM to controller.')
          child.kill('SIGTERM')
        }
      }).catch(error => addLog('listener', `Stop check unavailable: ${error.message}`))
    }, 2000)
    const result = await new Promise((resolve, reject) => {
      child.once('error', reject)
      child.once('exit', (code, signal) => resolve({ code, signal }))
    })
    terminalState = stopping ? 'failed' : result.code === 0 ? 'completed' : 'failed'
    const counts = wasiResult?.counts
    terminalSummary = counts ? {
      selected, exitCode: result.code, signal: result.signal, stopRequested: stopping, logs,
      saleListingsExtracted: selected[0].endsWith('-sale') ? counts.extracted : 0,
      rentListingsExtracted: selected[0].endsWith('-rent') ? counts.extracted : 0,
      pagesRetrieved: counts.pagesRetrieved, paginationStatus: counts.paginationStatus,
      created: counts.created, updated: counts.updated, published: counts.published,
      rejected: counts.rejected, archived: 'unavailable', activeInventoryTotal: 'unavailable',
      agencyLogos: counts.agencyLogos, agentPhotos: counts.agentPhotos,
      errors: counts.errors?.length ?? 0, wasiOutputDirectory: wasiResult.directory,
    } : encuentraResult ? (() => {
      const sale=encuentraResult.sale?.ingestion||{}, rent=encuentraResult.rent?.ingestion||{}
      return { selected, exitCode: result.code, signal: result.signal, stopRequested: stopping, logs,
        saleListingsExtracted:sale.captured, rentListingsExtracted:rent.captured,
        pagesRetrieved:'unavailable', paginationStatus:encuentraResult.status,
        created:'unavailable', updated:'unavailable', published:(sale.published||0)+(rent.published||0),
        rejected:(sale.rejected||0)+(rent.rejected||0), archived:(sale.reconciliation?.archived||0)+(rent.reconciliation?.archived||0),
        activeInventoryTotal:'unavailable', agencyLogos:'unavailable', agentPhotos:'unavailable',
        errors:[...(sale.errors||[]),...(rent.errors||[])].length, reconciliation:{sale:sale.reconciliation,rent:rent.reconciliation},
      }
    })() : { selected, exitCode: result.code, signal: result.signal, stopRequested: stopping, logs }
    await report(command.id, terminalState, terminalSummary)
  } catch (error) {
    terminalSummary = { selected, error: error.message, stopRequested: stopping, logs }
    try { await report(command.id, 'failed', terminalSummary) } catch { /* the next heartbeat exposes connectivity loss */ }
  } finally {
    if (stopTimer) clearInterval(stopTimer)
    const finishedAt = new Date().toISOString()
    const delivery = await sendExecutionReport(command.id, selected || [], startedAt, finishedAt, terminalState, terminalSummary).catch(error => ({ state: 'failed', error: error.message }))
    try { await report(command.id, terminalState, { ...terminalSummary, emailReport: delivery, finishedAt }, delivery.state) } catch { /* persisted command is still the durable report */ }
    child = null
    busy = false
    stopping = false
  }
}

async function tick() {
  await rpc('heartbeat', { state: busy ? 'running' : 'idle' })
  if (busy || stopping) return
  const claimed = await rpc('claim')
  const command = claimed?.command
  if (!command) return
  await execute(command)
}

async function stop(signal) {
  stopping = true
  if (child) child.kill('SIGTERM')
  try { await rpc('heartbeat', { state: 'offline', signal }) } catch { /* process is stopping */ }
  process.exitCode = 0
}

function start() {
  process.once('SIGTERM', () => { void stop('SIGTERM') })
  process.once('SIGINT', () => { void stop('SIGINT') })
  void tick().catch(error => console.error(`scraper command listener: ${error.message}`))
  setInterval(() => { void tick().catch(error => console.error(`scraper command listener: ${error.message}`)) }, intervalMs)
}

if (require.main === module) start()
module.exports = { selection, notifyLaunch, sendExecutionReport, reportText, start, stopRequested }
