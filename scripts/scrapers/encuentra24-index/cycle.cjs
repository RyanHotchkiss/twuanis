'use strict'
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

function initializeCycle({ root, cycleId = crypto.randomUUID(), selections }) {
  if (!path.isAbsolute(root || '')) throw new Error('An absolute cycle root is required')
  if (!/^[0-9a-f-]{36}$/i.test(cycleId)) throw new Error('Cycle ID must be a UUID')
  const selected = [...new Set(selections || [])].sort()
  if (!selected.length || selected.some(value => !['sale', 'rent'].includes(value))) throw new Error('Select sale, rent, or both')
  const directory = path.join(root, cycleId)
  fs.mkdirSync(directory, { recursive: true, mode: 0o700 })
  const manifestFile = path.join(directory, 'cycle.json')
  let manifest
  try { manifest = JSON.parse(fs.readFileSync(manifestFile, 'utf8')) } catch (error) {
    if (error.code !== 'ENOENT') throw error
    manifest = { cycle_id: cycleId, selections: selected, created_at: new Date().toISOString() }
    fs.writeFileSync(manifestFile, JSON.stringify(manifest, null, 2), { flag: 'wx', mode: 0o600 })
  }
  if (manifest.cycle_id !== cycleId || JSON.stringify(manifest.selections) !== JSON.stringify(selected)) throw new Error('Existing cycle selection does not match')
  return { cycleId, inventoryDirectory: directory, selections: selected, manifestFile, startedAt: manifest.created_at }
}

async function executeCycle(cycle, { run, ingest, configs, limit = 0, resumeDirectories = {}, notify = null, maxRuntimeMs = 69 * 60 * 1000, extendedSaleTest = false }) {
  const results = {}
  const startedAt = new Date().toISOString()
  let interrupted = false
  const onStop = () => { interrupted = true }
  if (extendedSaleTest && (!((limit === 1000 && maxRuntimeMs === 4 * 60 * 60 * 1000) || (limit === 10000 && maxRuntimeMs === 24 * 60 * 60 * 1000)) || cycle.selections.length !== 1 || cycle.selections[0] !== 'sale')) throw new Error('Invalid extended Sale test configuration')
  const deadline = Date.now() + Math.min(extendedSaleTest ? maxRuntimeMs : 69 * 60 * 1000, maxRuntimeMs)
  const control = { deadline, stopped: () => interrupted, expired: () => Date.now() >= deadline }
  process.on('SIGTERM', onStop)
  process.on('SIGINT', onStop)
  try {
  for (const transaction of cycle.selections) {
    if (interrupted || control.expired()) break
    const runDirectory = resumeDirectories[transaction] || path.join(cycle.inventoryDirectory, transaction)
    try {
      const acquisition = await run(configs[transaction], { limit, resumeDir: runDirectory, cycle, control })
      if (interrupted || acquisition.status === 'INTERRUPTED') {
        results[transaction] = { complete: false, status: 'INTERRUPTED', reason: 'stopped', inventory_complete: false }
        break
      }
      const processed = await ingest({ ...acquisition, transaction, boundedSaleLimit: limit || 0, canonicalRunId: cycle.cycleId, canonicalStartedAt: cycle.startedAt }, { control })
      const finished = acquisition.complete === true && !interrupted && !control.expired()
      results[transaction] = { complete: finished, status: interrupted ? 'INTERRUPTED' : finished ? 'COMPLETE' : 'INCOMPLETE', inventory_complete: finished, reason: interrupted ? 'stopped' : control.expired() ? 'runtime_cap' : acquisition.reason || '', outcomes: processed.outcomes }
    } catch (error) {
      results[transaction] = { complete: false, status: 'FAILED', inventory_complete: false, reason: 'failed', error: error.message }
    }
    // A partial cycle is never a complete inventory and cannot authorize
    // absence-based review or archival.
    const state = { cycle_id: cycle.cycleId, selections: cycle.selections, results, complete: cycle.selections.every(value => results[value]?.complete === true) }
    fs.writeFileSync(path.join(cycle.inventoryDirectory, 'cycle-status.json'), JSON.stringify(state, null, 2), { mode: 0o600 })
  }
  const complete = !interrupted && cycle.selections.every(value => results[value]?.complete === true)
  const status = interrupted ? 'INTERRUPTED' : Object.values(results).some(value => value.status === 'FAILED') ? 'FAILED' : complete ? 'COMPLETE' : 'INCOMPLETE'
  const finishedAt = new Date().toISOString()
  const final = { cycleId: cycle.cycleId, selections: cycle.selections, inventoryDirectory: cycle.inventoryDirectory, results, complete, status, inventory_complete: complete }
  const { openInventories } = require('./cycle-inventories.cjs')
  const { cycleNotificationSummary, sendEncuentra24Notification } = require('../weekly-encuentra24-controller.js')
  const notificationInventory = openInventories(cycle.inventoryDirectory, cycle.cycleId)
  const summary = cycleNotificationSummary(final, notificationInventory, startedAt, finishedAt)
  summary.notifications = {}
  for (const transaction of cycle.selections) summary.notifications[transaction] = await (notify || sendEncuentra24Notification)(summary, transaction, { inventory: notificationInventory })
  fs.writeFileSync(path.join(cycle.inventoryDirectory, 'cycle-status.json'), JSON.stringify({ cycle_id: cycle.cycleId, selections: cycle.selections, results, complete, status, inventory_complete: complete, notification_summary: summary }, null, 2), { mode: 0o600 })
  return { ...final, notification_summary: summary }
  } finally { process.removeListener('SIGTERM', onStop); process.removeListener('SIGINT', onStop) }
}

module.exports = { initializeCycle, executeCycle }
