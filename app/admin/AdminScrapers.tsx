'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { scraperRead, scraperRequest } from './scraper-actions'
import type { AdminLanguage } from './admin-contract'

type Command = {
  id: string
  requestedAt: string
  expiresAt: string
  state: 'requested' | 'accepted' | 'running' | 'completed' | 'failed' | 'rejected' | 'expired'
  scrapers: string[]
  launchedAt?: string | null
  finishedAt?: string | null
  notificationState?: string
}
type ReadState = { worker?: { lastSeenAt: string; state: 'idle' | 'running' | 'offline' } | null; commands: Command[] }
const labels = {
  en: { title: 'Scraper Management', sale: 'Encuentra24 Sale', rent: 'Encuentra24 Rent', run: 'Run Scraper', activity: 'Recent activity', unavailable: 'Status unavailable', offline: 'Offline', running: 'Running', available: 'Available', requestError: 'The command was not accepted.', noActivity: 'No scraper commands have been recorded.' },
  es: { title: 'Gestión de scrapers', sale: 'Encuentra24 Venta', rent: 'Encuentra24 Alquiler', run: 'Ejecutar scraper', activity: 'Actividad reciente', unavailable: 'Estado no disponible', offline: 'Sin conexión', running: 'En ejecución', available: 'Disponible', requestError: 'No se aceptó la solicitud.', noActivity: 'No hay comandos de scraper registrados.' },
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
  return <section className="admin-scrapers">
    <p><strong>{status}</strong></p>
    <fieldset><legend>{text.title}</legend>
      <label><input type="checkbox" checked={selected.includes('encuentra24-sale')} onChange={() => toggle('encuentra24-sale')} />{text.sale}</label>
      <label><input type="checkbox" checked={selected.includes('encuentra24-rent')} onChange={() => toggle('encuentra24-rent')} />{text.rent}</label>
      <button disabled={!selected.length || busy} onClick={() => { void submit() }}>{text.run}</button>
    </fieldset>
    {error && <p role="alert">{error}</p>}
    <h3>{text.activity}</h3>
    {data?.commands?.length ? data.commands.map(command => <article key={command.id}><strong>{command.state.toUpperCase()}</strong> · {command.scrapers.join(', ')}<br /><code>{command.id}</code></article>) : <p>{text.noActivity}</p>}
  </section>
}
