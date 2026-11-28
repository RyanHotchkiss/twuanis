'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { scraperRead, scraperRequest, scraperStop } from './scraper-actions'
import type { AdminLanguage } from './admin-contract'
import { scraperSources } from '@/lib/scraper-registry'

type Command = {
  id: string
  requestedAt: string
  expiresAt: string
  state: 'requested' | 'accepted' | 'running' | 'completed' | 'failed' | 'rejected' | 'expired'
  scrapers: string[]
  launchedAt?: string | null
  finishedAt?: string | null
  notificationState?: string
  summary?: Record<string, unknown>
}
type ReadState = { worker?: { lastSeenAt: string; state: 'idle' | 'running' | 'offline' } | null; commands: Command[] }
function executionLabel(command: Command, language: AdminLanguage) {
  const es = language === 'es', summary = command.summary || {}
  if (['requested', 'accepted', 'running'].includes(command.state)) return es ? 'Extracción en curso' : 'Scraping in progress'
  if (command.state === 'rejected' || command.state === 'expired') return es ? 'Solicitud no ejecutada' : 'Request not executed'
  const number = (value: unknown) => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 ? value : undefined
  const published = number(summary.published)
  const single = command.scrapers.length === 1 ? command.scrapers[0] : ''
  const processed = number(summary.uniqueProcessedProperties) ?? number(summary.unique_processed_properties) ?? (single.endsWith('-sale') ? number(summary.saleListingsExtracted) : single.endsWith('-rent') ? number(summary.rentListingsExtracted) : undefined)
  const percent = published !== undefined && processed !== undefined && processed > 0 && published <= processed ? `${(published / processed * 100).toFixed(2)}%` : undefined
  const reason = String(summary.reason || summary.paginationStatus || '').toLowerCase()
  const stopped = summary.stopRequested === true
  const timedOut = ['runtime_cap', 'deadline', 'deadline_reached', 'time_limit_reached', 'timed_out'].includes(reason)
  const interrupted = !stopped && !timedOut && (Boolean(summary.signal) || Boolean(summary.error) || reason === 'interrupted')
  if (stopped || timedOut || interrupted) {
    const prefix = stopped ? (es ? 'Detenido por el propietario' : 'Stopped by Owner') : timedOut ? (es ? 'Límite de tiempo alcanzado' : 'Time limit reached') : (es ? 'Ejecución interrumpida' : 'Execution interrupted')
    return percent ? `${prefix} · ${percent} ${es ? 'publicado' : 'published'}` : prefix
  }
  if (published === 0 && processed !== undefined) return es ? 'Ejecución finalizada · 0 propiedades publicadas' : 'Execution ended · 0 properties published'
  if (percent && processed !== undefined) return es ? `Se publicó correctamente el ${percent} de ${processed} anuncios procesados` : `Successfully published ${percent} of ${processed} listings processed`
  return es ? 'Ejecución finalizada · resultado de publicación no disponible' : 'Execution ended · publication outcome unavailable'
}
function ScraperProgress({ progress, language }: { progress: unknown; language: AdminLanguage }) {
  if (!progress || typeof progress !== 'object' || Array.isArray(progress)) return null
  const value = progress as Record<string, unknown>
  const counts = value.counts && typeof value.counts === 'object' && !Array.isArray(value.counts) ? value.counts as Record<string, unknown> : {}
  const names: Record<string, [string, string]> = {
    unique_agencies: ['Agencies', 'Agencias'], unique_agents: ['Agents', 'Agentes'], discovered_properties: ['Discovered', 'Descubiertas'], extracted_properties: ['Extracted', 'Extraídas'], normalized_properties: ['Normalized', 'Normalizadas'], admitted: ['Admitted', 'Admitidas'], published: ['Published', 'Publicadas'], review_required: ['For review', 'Para revisión'], rejected: ['Rejected', 'Rechazadas'], failures: ['Failures', 'Errores'], agencies_reused: ['Agencies reused', 'Agencias reutilizadas'], agents_reused: ['Agents reused', 'Agentes reutilizados'], properties_reused: ['Properties reused', 'Propiedades reutilizadas']
  }
  const labels = Object.entries(counts).filter(([key, count]) => names[key] && typeof count === 'number').map(([key, count]) => `${names[key][language === 'es' ? 1 : 0]}: ${count}`)
  return <p role="status">{language === 'es' ? 'Etapa' : 'Stage'}: {String(value.event || '—')}{typeof value.transaction === 'string' ? ` · ${value.transaction}` : ''}{labels.length ? ` · ${labels.join(' · ')}` : ''}</p>
}
const labels = {
  en: { title: 'Scraper Management', run: 'Run Scraper', stop: 'Stop', activity: 'Recent activity', unavailable: 'Status unavailable', offline: 'Offline', running: 'Running', available: 'Available', requestError: 'The command was not accepted.', stopError: 'The stop request was not accepted.', noActivity: 'No scraper commands have been recorded.', unavailableSource: 'Not operational', email: 'Email delivery', logs: 'Live logs', stopped: 'Stopped by Owner' },
  es: { title: 'Gestión de scrapers', run: 'Ejecutar scraper', stop: 'Detener', activity: 'Actividad reciente', unavailable: 'Estado no disponible', offline: 'Sin conexión', running: 'En ejecución', available: 'Disponible', requestError: 'No se aceptó la solicitud.', stopError: 'No se aceptó la solicitud de detención.', noActivity: 'No hay comandos de scraper registrados.', unavailableSource: 'No operativo', email: 'Entrega por correo', logs: 'Registros en vivo', stopped: 'Detenido por Owner' },
} as const

export default function AdminScrapers({ language }: { language: AdminLanguage }) {
  const text = labels[language]
  const [data, setData] = useState<ReadState>()
  const [selected, setSelected] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string>()
  const [checkedAt, setCheckedAt] = useState(0)
  const refresh = useCallback(async () => {
    const result = await scraperRead()
    if (result.ok) { setData(result.data as ReadState); setError(undefined); setCheckedAt(Date.now()) } else setError(text.requestError)
  }, [text.requestError])
  useEffect(() => { const initial = window.setTimeout(() => { void refresh() }, 0); const timer = window.setInterval(() => { void refresh() }, 30000); return () => { window.clearTimeout(initial); window.clearInterval(timer) } }, [refresh])
  const status = useMemo(() => {
    const worker = data?.worker
    if (!worker) return text.unavailable
    if (!checkedAt || checkedAt - new Date(worker.lastSeenAt).getTime() >= 120000) return text.offline
    return worker.state === 'running' ? text.running : worker.state === 'offline' ? text.offline : text.available
  }, [checkedAt, data?.worker, text])
  // Command state is the durable authority: it is returned by the existing
  // Admin read RPC and therefore survives refreshes and navigation.
  const commandActive = Boolean(data?.commands.some(command => ['requested','accepted','running'].includes(command.state)))
  function toggle(id: string) { setSelected(current => current.includes(id) ? current.filter(value => value !== id) : [...current, id]) }
  async function submit() { if (!selected.length) return; setBusy(true); const result = await scraperRequest(crypto.randomUUID(), selected); setBusy(false); await refresh(); if (!result.ok) setError(result.error || text.requestError) }
  async function stop(commandId: string) { setBusy(true); const result = await scraperStop(commandId); setBusy(false); if (!result.ok) setError(text.stopError); await refresh() }
  return <section className="admin-scrapers">
    <p><strong>{status}</strong></p>
    <fieldset><legend>{text.title}</legend>
      {scraperSources.map(source => <div key={source.id} style={{marginBlock:'.75rem'}}><strong>{source.label[language]}</strong>{source.operational ? source.selections.map(selection => <label key={selection.id} style={{display:'block'}}><input type="checkbox" checked={selected.includes(selection.id)} onChange={() => toggle(selection.id)} />{selection.label[language]}</label>) : <p><em>{text.unavailableSource}</em> — {source.unavailableReason?.[language]}</p>}</div>)}
      <button disabled={!selected.length || busy || commandActive} style={commandActive ? { backgroundColor:'#ff3b00', color:'#fff' } : undefined} onClick={() => { void submit() }}>{text.run}</button>
    </fieldset>
    {error && <p role="alert">{error}</p>}
    <h3>{text.activity}</h3>
    {data?.commands?.length ? data.commands.map(command => { const logs = Array.isArray(command.summary?.logs) ? command.summary?.logs as Array<{at?:unknown;stream?:unknown;line?:unknown}> : []; return <article key={command.id}><strong>{executionLabel(command, language)}</strong> · {command.scrapers.join(', ')}<br /><small>{language === 'es' ? 'Estado técnico' : 'Technical status'}: {command.state.toUpperCase()}</small><br /><code>{command.id}</code>{['accepted','running'].includes(command.state) ? <><br /><button disabled={busy} onClick={() => { void stop(command.id) }}>{text.stop}</button></> : null}<ScraperProgress progress={command.summary?.progress} language={language} />{Boolean(command.summary?.emailReport) ? <><br />{text.email}: {String((command.summary?.emailReport as {state?:unknown}).state ?? 'unavailable')}</> : null}{command.summary?.error ? <p role="alert">{String(command.summary.error)}</p> : null}{logs.length ? <details><summary>{text.logs}</summary><pre>{logs.map(log => `[${String(log.at ?? '')}] ${String(log.stream ?? '')}: ${String(log.line ?? '')}`).join('\n')}</pre></details> : null}</article> }) : <p>{text.noActivity}</p>}
  </section>
}
