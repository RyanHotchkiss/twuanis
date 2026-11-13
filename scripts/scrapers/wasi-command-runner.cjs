'use strict'
const { spawn } = require('node:child_process')
const fs = require('node:fs/promises'), path = require('node:path')
const { createClient, qualifying, ingestWasiObservation } = require('./wasi-canonical-ingestion-adapter.cjs')
const root = path.resolve(__dirname, '../..')
const configurations = {
  'helcor-sale':'scripts/scrapers/wasi-sites/helcor-sales.json', 'helcor-rent':'scripts/scrapers/wasi-sites/helcor-rent.json',
  'remax-central-sale':'scripts/scrapers/wasi-sites/remax-central-sales.json', 'remax-central-rent':'scripts/scrapers/wasi-sites/remax-central-rent.json',
  'devop-sale':'scripts/scrapers/wasi-sites/devop-sales.json'
}
function execute(file, outputRoot) { return new Promise((resolve,reject) => { let text=''; const child=spawn(process.execPath,['scripts/scrapers/wasi-sales-scraper.js',file,outputRoot],{cwd:root,env:process.env,stdio:['ignore','pipe','pipe']}); child.stdout.on('data',d=>text+=d); child.stderr.on('data',d=>text+=d); child.once('error',reject); child.once('exit',(code,signal)=>{ if(code===0)resolve({text,signal});else reject(Error(`WASI scraper exited ${code}: ${text.slice(-1000)}`)) }) }) }
async function run(selection, outputRoot, onProgress=()=>{}) {
  const config = configurations[selection]; if (!config) throw Error(`Unsupported Wasi selection ${selection}`)
  onProgress({event:'extracting',selection}); const {text}=await execute(config,outputRoot)
  const payload=JSON.parse(text.trim()); const directory=payload.directory; const records=JSON.parse(await fs.readFile(path.join(directory,'devop-wasi-sales.json'),'utf8'))
  const counts={extracted:records.length,qualified:0,published:0,heldForReview:0,rejected:0,failed:0,created:0,updated:0,agencyLogos:0,agentPhotos:0,pagesRetrieved:payload.summary?.listing_pages_discovered ?? 'unavailable',paginationStatus:payload.summary?.failed_or_inaccessible_listing_pages ? 'failed' : 'completed',errors:payload.summary?.failures || []}
  const client=createClient()
  for (const row of records) { const reason=qualifying(row); if (reason) { counts.rejected++; continue }; counts.qualified++; if (row.agency?.logo_url) counts.agencyLogos++; if (row.listing_agent?.photo_url) counts.agentPhotos++; try { const accepted=await ingestWasiObservation(client,row); const outcome=String(accepted.result?.outcome || 'unknown'); if (outcome==='accepted'||outcome==='succeeded') { counts.published++; counts.created++ } else if (/duplicate|review/i.test(outcome)) counts.heldForReview++; else counts.rejected++ } catch (error) { counts.failed++; counts.errors.push(String(error.message||error)) } }
  onProgress({event:'completed',selection,directory,counts}); return {directory,counts}
}
module.exports = { configurations, run }
if (require.main === module) {
  const [selection, outputRoot] = process.argv.slice(2)
  run(selection, outputRoot || path.join(root, 'var', 'wasi-runs'), event => console.log(JSON.stringify({ wasi_progress:event })))
    .then(result => console.log(JSON.stringify({ wasi_result:result })))
    .catch(error => { console.error(error.message); process.exitCode = 1 })
}
