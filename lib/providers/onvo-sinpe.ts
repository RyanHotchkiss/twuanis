import 'server-only'
import { createHash, timingSafeEqual } from 'node:crypto'

export type OnvoMode = 'test' | 'live'
export type OnvoContext = { mode: OnvoMode; accountId: string; secretKey: string; webhookSecret: string }
export type OnvoOrder = { id: string; currency: 'CRC'; amount: string; createdAt: string; deadline: string }
type ObjectValue = Record<string, unknown>
export class OnvoUnavailable extends Error {
  constructor() { super('ONVO verification unavailable'); this.name = 'OnvoUnavailable' }
}
const object = (value: unknown): ObjectValue => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new OnvoUnavailable()
  return value as ObjectValue
}
const identifier = (value: unknown): string => {
  if (typeof value !== 'string' || !/^[A-Za-z0-9_-]{1,150}$/.test(value)) throw new OnvoUnavailable()
  return value
}
const reference = (value: unknown): string => {
  if (typeof value !== 'string' || !value || value.length > 128 || value !== value.trim()) throw new OnvoUnavailable()
  return value
}
const timestamp = (value: unknown): string => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:\d{2})$/.test(value) || !Number.isFinite(Date.parse(value))) throw new OnvoUnavailable()
  return value
}
export function onvoMinorUnits(value: string): number {
  if (!/^\d{1,12}(?:\.\d{1,2})?$/.test(value)) throw new OnvoUnavailable()
  const [whole, fraction = ''] = value.split('.')
  const amount = BigInt(whole) * BigInt(100) + BigInt(fraction.padEnd(2, '0'))
  if (amount <= BigInt(0) || amount > BigInt(Number.MAX_SAFE_INTEGER)) throw new OnvoUnavailable()
  return Number(amount)
}
export function authenticateOnvoWebhook(received: string | null, expected: string): boolean {
  if (!expected.startsWith('webhook_secret_') || expected.length > 512 || !received || received.length > 512) return false
  return timingSafeEqual(createHash('sha256').update(received).digest(), createHash('sha256').update(expected).digest())
}
export function onvoEvent(value: unknown): { type: string; intentId: string | null; reference: string | null } {
  const event = object(value), data = object(event.data)
  if (!['payment-intent.succeeded', 'payment-intent.failed', 'payment-intent.deferred', 'mobile-transfer.received'].includes(String(event.type))) throw new OnvoUnavailable()
  return { type: String(event.type), intentId: event.type === 'mobile-transfer.received' ? null : identifier(data.id), reference: event.type === 'mobile-transfer.received' ? reference(data.SINPERefNumber) : null }
}
// Only authenticated readback can enter this validator. Never pass browser or webhook
// snapshots as authoritative intent/transfer objects.
export function verifyOnvoReceipt(context: OnvoContext, order: OnvoOrder, boundIntent: string, intentValue: unknown, transferValue: unknown) {
  const intent = object(intentValue), transfer = object(transferValue), amount = onvoMinorUnits(order.amount)
  if (intent.id !== boundIntent || intent.accountId !== context.accountId || intent.mode !== context.mode || transfer.mode !== context.mode || transfer.paymentIntentId !== boundIntent) throw new OnvoUnavailable()
  if (intent.status !== 'succeeded' || transfer.status !== 'received') return { disposition: 'PENDING' as const }
  const externalReference = reference(transfer.SINPERefNumber), transaction = identifier(transfer.id)
  // ONVO documents createdAt as payment-received time. authorizationDate is bank
  // authorization time and is deliberately not substituted for receipt time.
  let receivedAt: string
  try { receivedAt = timestamp(transfer.createdAt) } catch { return { disposition: 'NEEDS_RESOLUTION' as const, reason: 'missing_receipt_time', transaction, externalReference } }
  const created = Date.parse(timestamp(order.createdAt)), deadline = Date.parse(timestamp(order.deadline)), received = Date.parse(receivedAt)
  if (!Number.isSafeInteger(transfer.amount) || Number(transfer.amount) <= 0) throw new OnvoUnavailable()
  if (intent.currency !== 'CRC' || transfer.currency !== 'CRC' || intent.amount !== amount || transfer.amount !== amount || intent.receivedAmount !== amount) return { disposition: 'RECEIVED_UNMATCHED' as const, reason: 'amount_or_currency_mismatch', transaction, externalReference, receivedAt }
  if (received < created || received > deadline) return { disposition: 'RECEIVED_UNMATCHED' as const, reason: 'outside_order_window', transaction, externalReference, receivedAt }
  return { disposition: 'APPROVABLE' as const, transaction, externalReference, receivedAt, amountMinor: amount, currency: 'CRC' as const }
}
export class OnvoSinpeAdapter {
  constructor(private readonly context: OnvoContext, private readonly request: typeof fetch = fetch) {
    if (!context.secretKey.startsWith(`onvo_${context.mode}_secret_key_`) || !context.accountId || !['test', 'live'].includes(context.mode)) throw new OnvoUnavailable()
  }
  private async call(path: string, method = 'GET', payload?: unknown): Promise<unknown> {
    try {
      const response = await this.request(`https://api.onvopay.com/v1/${path}`, {
        method, cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(10000),
        headers: { Authorization: `Bearer ${this.context.secretKey}`, 'Content-Type': 'application/json' },
        ...(payload === undefined ? {} : { body: JSON.stringify(payload) }),
      })
      if (!response.ok || !response.body) throw new OnvoUnavailable()
      const reader = response.body.getReader(), decoder = new TextDecoder(); let text = '', size = 0
      try { for (;;) { const { done, value } = await reader.read(); if (done) break; size += value.length; if (size > 262144) { await reader.cancel(); throw new OnvoUnavailable() } text += decoder.decode(value, { stream: true }) } text += decoder.decode() } finally { reader.releaseLock() }
      return JSON.parse(text)
    } catch { throw new OnvoUnavailable() }
  }
  async createIntent(order: OnvoOrder) {
    identifier(order.id)
    if (order.currency !== 'CRC') throw new OnvoUnavailable()
    // No undocumented Idempotency-Key. Caller must durably reserve creation and
    // reconcile uncertain outcomes; this adapter never automatically retries POST.
    return this.call('payment-intents', 'POST', { amount: onvoMinorUnits(order.amount), currency: 'CRC', metadata: { orderId: order.id } })
  }
  async createMethod(payer: { identification: string; identificationType: number; number: string }) {
    if (!payer || ![0, 1, 2, 3, 4, 5, 9].includes(payer.identificationType) || typeof payer.identification !== 'string' || payer.identification.length > 30 || !/^[A-Za-z0-9-]+$/.test(payer.identification) || !/^\+506\d{8}$/.test(payer.number)) throw new OnvoUnavailable()
    return this.call('payment-methods', 'POST', { type: 'mobile_number', mobileNumber: { identification: payer.identification, identificationType: payer.identificationType, number: payer.number } })
  }
  async confirm(intent: string, method: string) { return this.call(`payment-intents/${identifier(intent)}/confirm`, 'POST', { paymentMethodId: identifier(method) }) }
  async readIntent(intent: string) { return this.call(`payment-intents/${identifier(intent)}`) }
  async readTransfer(externalReference: string) {
    const params = new URLSearchParams({ SINPERefNumber: reference(externalReference), limit: '100' })
    const page = object(await this.call(`mobile-transfers/list?${params}`)), meta = object(page.meta)
    if (!Array.isArray(page.data) || meta.hasMore !== false || page.data.length !== 1) throw new OnvoUnavailable()
    return page.data[0]
  }
  async transferPage(start: string, end: string, cursor?: string) {
    timestamp(start); timestamp(end)
    if (Date.parse(start) >= Date.parse(end)) throw new OnvoUnavailable()
    const params = new URLSearchParams({ 'createdAt[gte]': start, 'createdAt[lt]': end, sortOrder: 'asc', limit: '100' })
    if (cursor) params.set('startingAfter', identifier(cursor))
    const page = object(await this.call(`mobile-transfers/list?${params}`)), meta = object(page.meta)
    if (!Array.isArray(page.data) || page.data.length > 100 || typeof meta.hasMore !== 'boolean') throw new OnvoUnavailable()
    return { data: page.data, hasMore: meta.hasMore, cursor: page.data.length ? identifier(object(page.data.at(-1)).id) : null }
  }
}
// Deliberately sandbox-only until separate production authorization and acceptance.
export function sandboxOnvoContext(): OnvoContext {
  if (process.env.ONVO_MODE !== 'test') throw new OnvoUnavailable()
  const context: OnvoContext = { mode: 'test', accountId: process.env.ONVO_ACCOUNT_ID ?? '', secretKey: process.env.ONVO_SECRET_KEY ?? '', webhookSecret: process.env.ONVO_WEBHOOK_SECRET ?? '' }
  if (!context.webhookSecret.startsWith('webhook_secret_')) throw new OnvoUnavailable()
  return context
}
