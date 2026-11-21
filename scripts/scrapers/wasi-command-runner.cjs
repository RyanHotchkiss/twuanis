'use strict'
const { spawn } = require('node:child_process'), crypto = require('node:crypto')
const fs = require('node:fs/promises'), path = require('node:path')
const { createClient, qualifying, ingestWasiObservation, completeSourceRun } = require('./wasi-canonical-ingestion-adapter.cjs')
const { projectAttribution } = require('./refresh-wasi-listing-attribution.js')
const { createRunArchive } = require('./scraper-run-archive.cjs')
const root = path.resolve(__dirname, '../..')
const configurations = {
  'helcor-sale':'scripts/scrapers/wasi-sites/helcor-sales.json', 'helcor-rent':'scripts/scrapers/wasi-sites/helcor-rent.json',
  'remax-central-sale':'scripts/scrapers/wasi-sites/remax-central-sales.json', 'remax-central-rent':'scripts/scrapers/wasi-sites/remax-central-rent.json',
  'inmobiliaria-cdj-sale':'scripts/scrapers/wasi-sites/inmobiliaria-cdj-sales.json', 'inmobiliaria-cdj-rent':'scripts/scrapers/wasi-sites/inmobiliaria-cdj-rent.json',
  'montero-realty-group-sale':'scripts/scrapers/wasi-sites/montero-realty-group-sales.json', 'montero-realty-group-rent':'scripts/scrapers/wasi-sites/montero-realty-group-rent.json',
  'devop-sale':'scripts/scrapers/wasi-sites/devop-sales.json'
}
function execute(file, outputRoot, { deadlineMs, onProgress=()=>{} }={}) { return new Promise((resolve,reject) => {
  let text='', timedOut=false, terminated=false
  const child=spawn(process.execPath,['scripts/scrapers/wasi-sales-scraper.js',file,outputRoot],{cwd:root,env:{...process.env,WASI_PROGRESS_STREAM:'1'},stdio:['ignore','pipe','pipe']})
  const emit = chunk => {
    text += chunk
    for (const line of String(chunk).split(/\r?\n/)) {
      try { const event=JSON.parse(line); if(event?.wasi_progress) onProgress(event.wasi_progress) } catch { /* final evidence is parsed after exit */ }
    }
  }
  child.stdout.on('data',emit); child.stderr.on('data',d=>text+=d)
  const stop = () => { if(terminated) return; terminated=true; child.kill('SIGTERM'); setTimeout(()=>{if(!child.killed)child.kill('SIGKILL')},10000).unref() }
  const timer=setTimeout(()=>{timedOut=true;onProgress({event:'deadline_exceeded',deadline_ms:deadlineMs});stop()},Math.max(1,Number(deadlineMs)||45*60*1000))
  child.once('error',error=>{clearTimeout(timer);reject(error)})
  child.once('exit',(code,signal)=>{clearTimeout(timer);if(timedOut)return reject(Error('WASI_EXECUTION_DEADLINE_EXCEEDED'));const payload=String(text).split(/\r?\n/).reverse().map(line=>{try{return JSON.parse(line)}catch{return null}}).find(value=>value?.summary);if(!payload)return reject(Error('WASI_RESULT_MISSING'));resolve({payload,signal,error:code===0?null:Error(`WASI scraper exited ${code}: ${text.slice(-1000)}`)})})
}) }
async function run(selection, outputRoot, onProgress=()=>{}) {
  const config = configurations[selection]; if (!config) throw Error(`Unsupported Wasi selection ${selection}`)
  const site=JSON.parse(await fs.readFile(path.join(root,config),'utf8')), runId=process.env.TWUANIS_SCRAPER_COMMAND_ID||crypto.randomUUID(), startedAt=process.env.TWUANIS_SCRAPER_STARTED_AT||new Date().toISOString(), client=createClient()
  let directory, records=[], payload, executionError
  const counts={extracted:0,qualified:0,published:0,heldForReview:0,rejected:0,failed:0,created:0,updated:0,agencyLogos:0,agentPhotos:0,pagesRetrieved:'unavailable',paginationStatus:'failed',errors:[],attribution:{observed:0,matched:0,updated:0,unmatched:0,failed:0}}
  try {
    // Collection ends at the site cap; this outer allowance is only for
    // durable artifact finalization and canonical handoff.
    const collectionMs=Math.min(69*60*1000,Number(site.max_runtime_ms)||69*60*1000)
    onProgress({event:'extracting',selection}); const result=await execute(config,outputRoot,{deadlineMs:collectionMs+15*60*1000,onProgress:event=>onProgress({event:'extracting_progress',selection,...event})}); payload=result.payload; directory=payload.directory; records=JSON.parse(await fs.readFile(path.join(directory,'devop-wasi-sales.json'),'utf8')); if(result.error){executionError=result.error;counts.errors.push(result.error.message)}
    const archive=createRunArchive(directory,{commandId:runId,sourceName:site.source_name,transaction:site.transaction,extractedAt:startedAt})
    counts.extracted=records.length; counts.pagesRetrieved=payload.summary?.listing_pages_discovered ?? 'unavailable'; counts.paginationStatus=payload.summary?.failed_or_inaccessible_listing_pages ? 'failed' : 'completed'; counts.errors.push(...(payload.summary?.failures||[]))
    for (const row of records) { const reason=qualifying(row); if (reason) { counts.rejected++; archive.outcome(row,{outcome:'rejected',reason}); continue }; counts.qualified++; if (row.agency?.logo_url) counts.agencyLogos++; if (row.listing_agent?.photo_url) counts.agentPhotos++; try { const accepted=await ingestWasiObservation(client,row,{runId,startedAt}); const outcome=String(accepted.result?.outcome || 'unknown'); archive.outcome(row,{outcome,reason:accepted.result?.reason||null}); if (outcome==='accepted'||outcome==='succeeded') { counts.published++; counts.created++ } else if (/duplicate|review/i.test(outcome)) counts.heldForReview++; else counts.rejected++ } catch (error) { counts.failed++; const reason=String(error.message||error); archive.outcome(row,{outcome:'failed',reason}); counts.errors.push(reason) } }
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
  const reconciliation=!executionError&&payload?.summary?.extraction_complete===true
    ?await completeSourceRun(client,{sourceName:site.source_name,transaction:site.transaction,runId,startedAt,completion:{status:executionError?'failed':'completed',pagination_status:counts.paginationStatus,errors:counts.errors},observedIds})
    :{absence_applied:false,status:'skipped',reason:'LISTING_DISCOVERY_UNVERIFIED'}
  counts.archived=Number(reconciliation?.archived ?? 'unavailable'); counts.activeInventoryTotal=reconciliation?.remaining_published ?? 'unavailable'; counts.captured=observedIds.length
  // Re-upload the final CSV/JSON projection after canonical outcomes have been
  // recorded.  The run's immutable checkpoint batches were already persisted
  // during collection.
  if (directory) {
    const archive = createRunArchive(directory,{commandId:runId,sourceName:site.source_name,transaction:site.transaction,extractedAt:startedAt})
    counts.remoteArchive = await archive.finalize()
  }
  const output={directory,counts,reconciliation}; onProgress({event:'completed',selection,...output}); if(executionError) throw executionError; return output
}
module.exports = { configurations, run }
if (require.main === module) {
  const [selection, outputRoot] = process.argv.slice(2)
  run(selection, outputRoot || path.join(root, 'var', 'wasi-runs'), event => console.log(JSON.stringify({ wasi_progress:event })))
    .then(result => console.log(JSON.stringify({ wasi_result:result })))
    .catch(error => { console.error(error.message); process.exitCode = 1 })
}
