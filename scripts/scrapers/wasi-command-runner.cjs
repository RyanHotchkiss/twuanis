'use strict'
const { spawn } = require('node:child_process'), crypto = require('node:crypto')
const fs = require('node:fs/promises'), path = require('node:path')
const { createClient, qualifying, ingestWasiObservation, completeSourceRun } = require('./wasi-canonical-ingestion-adapter.cjs')
const { projectAttribution } = require('./refresh-wasi-listing-attribution.js')
const root = path.resolve(__dirname, '../..')
const configurations = {
  'helcor-sale':'scripts/scrapers/wasi-sites/helcor-sales.json', 'helcor-rent':'scripts/scrapers/wasi-sites/helcor-rent.json',
  'remax-central-sale':'scripts/scrapers/wasi-sites/remax-central-sales.json', 'remax-central-rent':'scripts/scrapers/wasi-sites/remax-central-rent.json',
  'devop-sale':'scripts/scrapers/wasi-sites/devop-sales.json'
}
function execute(file, outputRoot) { return new Promise((resolve,reject) => { let text=''; const child=spawn(process.execPath,['scripts/scrapers/wasi-sales-scraper.js',file,outputRoot],{cwd:root,env:process.env,stdio:['ignore','pipe','pipe']}); child.stdout.on('data',d=>text+=d); child.stderr.on('data',d=>text+=d); child.once('error',reject); child.once('exit',(code,signal)=>{ if(code===0)resolve({text,signal});else reject(Error(`WASI scraper exited ${code}: ${text.slice(-1000)}`)) }) }) }
async function run(selection, outputRoot, onProgress=()=>{}) {
  const config = configurations[selection]; if (!config) throw Error(`Unsupported Wasi selection ${selection}`)
  const site=JSON.parse(await fs.readFile(path.join(root,config),'utf8')), runId=crypto.randomUUID(), startedAt=new Date().toISOString(), client=createClient()
  let directory, records=[], payload, executionError
  const counts={extracted:0,qualified:0,published:0,heldForReview:0,rejected:0,failed:0,created:0,updated:0,agencyLogos:0,agentPhotos:0,pagesRetrieved:'unavailable',paginationStatus:'failed',errors:[],attribution:{observed:0,matched:0,updated:0,unmatched:0,failed:0}}
  try {
    onProgress({event:'extracting',selection}); const result=await execute(config,outputRoot); payload=JSON.parse(result.text.trim()); directory=payload.directory; records=JSON.parse(await fs.readFile(path.join(directory,'devop-wasi-sales.json'),'utf8'))
    counts.extracted=records.length; counts.pagesRetrieved=payload.summary?.listing_pages_discovered ?? 'unavailable'; counts.paginationStatus=payload.summary?.failed_or_inaccessible_listing_pages ? 'failed' : 'completed'; counts.errors.push(...(payload.summary?.failures||[]))
    for (const row of records) { const reason=qualifying(row); if (reason) { counts.rejected++; continue }; counts.qualified++; if (row.agency?.logo_url) counts.agencyLogos++; if (row.listing_agent?.photo_url) counts.agentPhotos++; try { const accepted=await ingestWasiObservation(client,row,{runId,startedAt}); const outcome=String(accepted.result?.outcome || 'unknown'); if (outcome==='accepted'||outcome==='succeeded') { counts.published++; counts.created++ } else if (/duplicate|review/i.test(outcome)) counts.heldForReview++; else counts.rejected++ } catch (error) { counts.failed++; counts.errors.push(String(error.message||error)) } }
  } catch (error) { executionError=error; counts.failed++; counts.errors.push(String(error.message||error)) }
  if(records.length){
    try{
      const attribution=await projectAttribution(records,site.source_name)
      counts.attribution={
        observed:attribution.observed_attribution,
        matched:attribution.matched,
        updated:attribution.updated_with_agency_logo+attribution.updated_with_agency_name+attribution.updated_with_agent_photo+attribution.updated_with_agent_name,
        unmatched:attribution.unmatched.length,
        failed:attribution.failed.length,
        updated_with_agency_logo:attribution.updated_with_agency_logo,
        updated_with_agency_name:attribution.updated_with_agency_name,
        updated_with_agent_photo:attribution.updated_with_agent_photo,
        updated_with_agent_name:attribution.updated_with_agent_name
      }
      if(attribution.failed.length)counts.errors.push(`Attribution projection failed for ${attribution.failed.length} listing(s)`)
    }catch(error){
      counts.attribution.failed=records.length
      counts.errors.push(`Attribution projection unavailable: ${String(error.message||error)}`)
    }
  }
  const observedIds=[...new Set(records.filter(row=>row.source_transaction===site.transaction).map(row=>String(row.source_listing_id)).filter(Boolean))]
  const reconciliation=await completeSourceRun(client,{sourceName:site.source_name,transaction:site.transaction,runId,startedAt,completion:{status:executionError?'failed':'completed',pagination_status:counts.paginationStatus,errors:counts.errors},observedIds})
  counts.archived=Number(reconciliation?.archived ?? 'unavailable'); counts.activeInventoryTotal=reconciliation?.remaining_published ?? 'unavailable'; counts.captured=observedIds.length
  const output={directory,counts,reconciliation}; onProgress({event:'completed',selection,...output}); if(executionError) throw executionError; return output
}
module.exports = { configurations, run }
if (require.main === module) {
  const [selection, outputRoot] = process.argv.slice(2)
  run(selection, outputRoot || path.join(root, 'var', 'wasi-runs'), event => console.log(JSON.stringify({ wasi_progress:event })))
    .then(result => console.log(JSON.stringify({ wasi_result:result })))
    .catch(error => { console.error(error.message); process.exitCode = 1 })
}
