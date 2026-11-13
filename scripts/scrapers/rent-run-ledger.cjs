'use strict'

// Durable, host-volume backed run ledger for the existing Rent scraper.  This
// records operational progress only; canonical evidence and admission remain
// exclusively in the existing service-only ingestion RPCs.
const fs = require('node:fs')
const path = require('node:path')

function readLedger(file) {
  try {
    const parsed = JSON.parse(fs.readFileSync(file, 'utf8'))
    if (!parsed || parsed.version !== 1 || typeof parsed.entries !== 'object' || Array.isArray(parsed.entries)) throw new Error('Invalid Rent run ledger')
    return parsed
  } catch (error) {
    if (error.code === 'ENOENT') return { version: 1, entries: {} }
    throw error
  }
}

function writeLedger(file, ledger) {
  fs.mkdirSync(path.dirname(file), { recursive: true, mode: 0o700 })
  const temporary = `${file}.${process.pid}.tmp`
  fs.writeFileSync(temporary, JSON.stringify(ledger, null, 2), { mode: 0o600 })
  fs.renameSync(temporary, file)
}

function recordLedger(file, { sourceListingId, sourceUrl, status, terminal, detail = {}, at = new Date().toISOString() }) {
  if (!file || !/^\d+$/.test(String(sourceListingId || '')) || !status) throw new Error('Invalid Rent run ledger entry')
  const ledger = readLedger(file)
  const previous = ledger.entries[sourceListingId]
  const event = { at, status, terminal: Boolean(terminal), source_url: String(sourceUrl || previous?.source_url || ''), detail }
  ledger.entries[sourceListingId] = {
    source_listing_id: String(sourceListingId),
    source_url: event.source_url,
    terminal: event.terminal,
    status,
    updated_at: at,
    history: [...(previous?.history || []), event]
  }
  writeLedger(file, ledger)
  return ledger.entries[sourceListingId]
}

function terminalSourceIds(file) {
  const ledger = readLedger(file)
  return new Set(Object.values(ledger.entries).filter(entry => entry.terminal).map(entry => entry.source_listing_id))
}

function interruptedSourceIds(file) {
  const ledger = readLedger(file)
  return Object.values(ledger.entries).filter(entry => !entry.terminal).map(entry => entry.source_listing_id)
}

module.exports = { readLedger, recordLedger, terminalSourceIds, interruptedSourceIds }
