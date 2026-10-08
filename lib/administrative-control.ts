import 'server-only'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export const ADMINISTRATIVE_PERMISSIONS = [
  'listings.read', 'listings.manage', 'packages.read', 'packages.manage',
  'addons.read', 'addons.manage', 'offers.read', 'offers.manage',
  'promotions.read', 'promotions.manage', 'orders.read', 'payments.read',
  'payments.review', 'entitlements.read', 'entitlements.manage',
  'administrators.read', 'administrators.manage', 'configuration.read',
  'configuration.manage', 'imports.read', 'imports.manage',
] as const
export type AdministrativePermission = typeof ADMINISTRATIVE_PERMISSIONS[number]
export type AdministrativeAuthority = Readonly<{
  actorId: string; owner: boolean; topAdministrator: boolean;
  permissions: readonly AdministrativePermission[];
}>
export class AdministrativeAccessError extends Error {
  constructor() { super('Administrative request could not be authorized or completed.'); this.name = 'AdministrativeAccessError' }
}
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const permissions = new Set<string>(ADMINISTRATIVE_PERMISSIONS)

// Authentication is provider-verified. Never substitute a service client or a supplied actor UUID.
async function authenticatedClient() {
  const client = await createServerSupabaseClient()
  const { data, error } = await client.auth.getUser()
  if (error || !data.user || !uuid.test(data.user.id)) throw new AdministrativeAccessError()
  return { client, actorId: data.user.id }
}
async function authority() {
  const session = await authenticatedClient()
  const { data, error } = await session.client.rpc('current_administrative_authority')
  if (error || !data || data.actorId !== session.actorId || typeof data.owner !== 'boolean' ||
    typeof data.topAdministrator !== 'boolean' || !Array.isArray(data.permissions) ||
    data.permissions.some((p: unknown) => typeof p !== 'string' || !permissions.has(p)) ||
    new Set(data.permissions).size !== data.permissions.length) throw new AdministrativeAccessError()
  const result: AdministrativeAuthority = Object.freeze({ actorId: session.actorId,
    owner: data.owner, topAdministrator: data.topAdministrator,
    permissions: Object.freeze([...data.permissions]) as readonly AdministrativePermission[] })
  return { ...session, result }
}
export async function resolveAdministrativeAuthority(): Promise<AdministrativeAuthority> {
  return (await authority()).result
}
// These assertions are fresh request checks, not persistent bearer capabilities.
// A domain mutation must ALSO assert permission inside its DB transaction using the private
// assert_administrative_permission helper and append its safe event in that same transaction.
export async function assertAdministrativePermission(permission: AdministrativePermission): Promise<AdministrativeAuthority> {
  const { result } = await authority()
  if (!permissions.has(permission) || !result.permissions.includes(permission)) throw new AdministrativeAccessError()
  return result
}
export async function assertOwner(): Promise<AdministrativeAuthority> {
  const { result } = await authority()
  if (!result.owner) throw new AdministrativeAccessError()
  return result
}

export type AdministrativeCommand = Readonly<{
  requestId: string; targetId: string; reason?: string;
} & (
  | { operation: 'administrator.activate' | 'administrator.deactivate' | 'owner.grant' | 'owner.revoke' | 'top.assign'; permission?: never }
  | { operation: 'permission.grant' | 'permission.revoke'; permission: AdministrativePermission }
)>
const operations = new Set(['administrator.activate', 'administrator.deactivate', 'owner.grant', 'owner.revoke', 'top.assign', 'permission.grant', 'permission.revoke'])
const ownerOperations = new Set(['owner.grant', 'owner.revoke', 'top.assign'])
export type AdministrativeResult = Readonly<{ ok: true; eventId: string; replayed: boolean }>
function projectResult(data: unknown): AdministrativeResult {
  if (!data || typeof data !== 'object') throw new AdministrativeAccessError()
  const value = data as Record<string, unknown>
  if (value.ok !== true || typeof value.eventId !== 'string' || !/^\d+$/.test(value.eventId) || typeof value.replayed !== 'boolean') throw new AdministrativeAccessError()
  return Object.freeze({ ok: true, eventId: value.eventId, replayed: value.replayed })
}
function validateReason(reason: unknown, required: boolean): void {
  if ((reason !== undefined && (typeof reason !== 'string' || reason.length > 2000)) ||
    (required && (typeof reason !== 'string' || reason.trim().length === 0))) throw new AdministrativeAccessError()
}
export async function changeAdministrativeAuthority(command: AdministrativeCommand): Promise<AdministrativeResult> {
  if (!command || typeof command !== 'object' || Object.keys(command).some(k => !['requestId', 'targetId', 'reason', 'operation', 'permission'].includes(k)) ||
    !uuid.test(command.requestId) || !uuid.test(command.targetId) || !operations.has(command.operation)) throw new AdministrativeAccessError()
  const isOwnerOperation = ownerOperations.has(command.operation)
  validateReason(command.reason, isOwnerOperation)
  if (command.operation.startsWith('permission.')) {
    if (!command.permission || !permissions.has(command.permission) || command.permission === 'administrators.manage') throw new AdministrativeAccessError()
  } else if (command.permission !== undefined) throw new AdministrativeAccessError()
  const { client, result } = await authority()
  if (!result.permissions.includes('administrators.manage') || (isOwnerOperation && !result.owner)) throw new AdministrativeAccessError()
  const { data, error } = await client.rpc('change_administrative_authority', {
    p_request: command.requestId, p_operation: command.operation, p_target: command.targetId,
    p_permission: command.permission ?? null, p_reason: command.reason ?? null,
  })
  // DB rechecks current authority and fresh MFA for Owner-only commands, under its authority lock.
  if (error) throw new AdministrativeAccessError()
  return projectResult(data)
}
export async function recoverOwnerAdministrativeAccess(requestId: string, reason: string): Promise<AdministrativeResult> {
  if (!uuid.test(requestId)) throw new AdministrativeAccessError()
  validateReason(reason, true)
  const { client } = await authenticatedClient()
  // Do not preempt the DB's auditable authenticated denial path with a browser Owner claim.
  const { data, error } = await client.rpc('recover_owner_administrative_access', { p_request: requestId, p_reason: reason })
  if (error) throw new AdministrativeAccessError()
  return projectResult(data)
}
