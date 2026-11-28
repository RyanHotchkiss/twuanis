'use strict'

// One shared, append-only journal per identity class. Events are persisted
// before work advances so a stopped cycle can resume without losing evidence.
const fs = require('fs')
const path = require('path')
const { append } = require('./run-ledger.cjs')

function openInventories(directory, cycleId) {
  if (!cycleId) throw new Error('A scraping cycle ID is required')
  fs.mkdirSync(directory, { recursive: true, mode: 0o700 })
  const states = {}
  const files = {}
  for (const kind of ['agencies', 'agents', 'properties']) {
    const file = path.join(directory, `${kind}.ndjson`)
    const state = new Map()
    if (fs.existsSync(file)) {
      for (const line of fs.readFileSync(file, 'utf8').split('\n').filter(Boolean)) {
        const event = JSON.parse(line)
        if (event.cycle_id === cycleId && event.id) state.set(event.id, { ...state.get(event.id), ...event.data })
      }
    }
    states[kind] = state
    files[kind] = file
  }
  return {
    get(kind, id) { return states[kind].get(String(id)) },
    has(kind, id) { return Boolean(states[kind] && states[kind].has(String(id))) },
    entries(kind) {
      if (!states[kind]) throw new Error('Invalid inventory kind')
      return [...states[kind].entries()]
    },
    record(kind, id, data) {
      if (!states[kind] || !id) throw new Error('A valid inventory kind and source identity are required')
      const key = String(id)
      const event = { cycle_id: cycleId, id: key, recorded_at: new Date().toISOString(), data }
      append(files[kind], event)
      const value = { ...states[kind].get(key), ...data }
      states[kind].set(key, value)
      return value
    }
  }
}

function reserveBoundedSale(inventory, id, limit) {
  if (!Number.isSafeInteger(limit) || limit < 1) throw new Error('Invalid bounded Sale limit')
  const property = inventory.get('properties', id) || {}
  if (property.transaction_type && property.transaction_type !== 'sale') return false
  if (property.bounded_sale_reserved === true) return true
  if (inventory.entries('properties').filter(([, value]) => value.bounded_sale_reserved === true).length >= limit) return false
  inventory.record('properties', id, { transaction_type: 'sale', bounded_sale_reserved: true })
  return true
}

module.exports = { openInventories, reserveBoundedSale }
