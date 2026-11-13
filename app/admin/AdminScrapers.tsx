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
  function toggle(id: string) { setSelected(current => current.includes(id) ? current.filter(value => value !== id) : [...current, id]) }
  async function submit() { if (!selected.length) return; setBusy(true); const result = await scraperRequest(crypto.randomUUID(), selected); setBusy(false); if (!result.ok) setError(text.requestError); await refresh() }
  async function stop(commandId: string) { setBusy(true); const result = await scraperStop(commandId); setBusy(false); if (!result.ok) setError(text.stopError); await refresh() }
  return <section className="admin-scrapers">
    <p><strong>{status}</strong></p>
    <fieldset><legend>{text.title}</legend>
      {scraperSources.map(source => <div key={source.id} style={{marginBlock:'.75rem'}}><strong>{source.label[language]}</strong>{source.operational ? source.selections.map(selection => <label key={selection.id} style={{display:'block'}}><input type="checkbox" checked={selected.includes(selection.id)} onChange={() => toggle(selection.id)} />{selection.label[language]}</label>) : <p><em>{text.unavailableSource}</em> — {source.unavailableReason?.[language]}</p>}</div>)}
      <button disabled={!selected.length || busy} onClick={() => { void submit() }}>{text.run}</button>
    </fieldset>
    {error && <p role="alert">{error}</p>}
    <h3>{text.activity}</h3>
    {data?.commands?.length ? data.commands.map(command => { const stopped = command.summary?.stopRequested === true; const logs = Array.isArray(command.summary?.logs) ? command.summary?.logs as Array<{at?:unknown;stream?:unknown;line?:unknown}> : []; return <article key={command.id}><strong>{stopped ? text.stopped : command.state.toUpperCase()}</strong> · {command.scrapers.join(', ')}<br /><code>{command.id}</code>{['accepted','running'].includes(command.state) ? <><br /><button disabled={busy} onClick={() => { void stop(command.id) }}>{text.stop}</button></> : null}{Boolean(command.summary?.emailReport) ? <><br />{text.email}: {String((command.summary?.emailReport as {state?:unknown}).state ?? 'unavailable')}</> : null}{command.summary?.error ? <p role="alert">{String(command.summary.error)}</p> : null}{logs.length ? <details><summary>{text.logs}</summary><pre>{logs.map(log => `[${String(log.at ?? '')}] ${String(log.stream ?? '')}: ${String(log.line ?? '')}`).join('\n')}</pre></details> : null}</article> }) : <p>{text.noActivity}</p>}
  </section>
}
