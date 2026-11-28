'use strict'
const { sale, rent } = require('./config.cjs')
const { run } = require('./run.cjs')
const { ingest } = require('./ingestion.cjs')
const path = require('path')
const { initializeCycle, executeCycle } = require('./cycle.cjs')
const option = name => { const index = process.argv.indexOf(name); return index >= 0 ? process.argv[index + 1] : '' }
const selections = (process.env.ENCUENTRA24_CYCLE_SELECTIONS || 'sale').split(',').map(value => value.trim()).filter(Boolean)
const cycle = initializeCycle({ root: path.resolve(process.env.ENCUENTRA24_CYCLE_ROOT || path.join(process.cwd(), 'var', 'encuentra24-index-cycles')), cycleId: process.env.ENCUENTRA24_CYCLE_ID || undefined, selections })
executeCycle(cycle, { run, ingest, configs: { sale, rent }, limit: Number(option('--limit') || 0), resumeDirectories: option('--resume') ? { sale: option('--resume') } : {} }).then(result => { console.log(JSON.stringify(result)); if (!result.complete) process.exitCode = 1 }).catch(error => { console.error(error.stack || error); process.exitCode = 1 })
