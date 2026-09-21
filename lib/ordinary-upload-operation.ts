import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'

export function attachmentUnconfirmed(operationId: string, path?: string) {
  return { success: false, status: 'ATTACHMENT_UNCONFIRMED', operationId, path,
    warning: 'Attachment is unconfirmed. Retry this operation ID without uploading another file.' }
}
export async function retryOrdinaryUpload(admin: SupabaseClient, owner: string, operationId: string, listingId?: string) {
  const unknown = () => attachmentUnconfirmed(operationId)
  try {
    const found = await admin.rpc('get_ordinary_upload', { p_owner: owner, p_operation: operationId })
    if (found.error) {
      if (found.error.code === '42501') return { success: false, status: 'ATTACHMENT_REJECTED', operationId, error: 'Upload is not available to this user.' }
      return unknown()
    }
    const op = found.data
    if (!op || op.id !== operationId || op.owner_id !== owner || typeof op.storage_path !== 'string' ||
        op.storage_path !== `${owner}/${op.listing_id}/upload-${operationId}.jpg` ||
        (listingId !== undefined && listingId !== op.listing_id)) {
      return { success: false, status: 'ATTACHMENT_REJECTED', operationId, error: 'Upload identity mismatch.' }
    }
    if (!op.completed) {
      const object = await admin.storage.from('listings-images').info(op.storage_path)
      if (object.error || !object.data || object.data.size !== op.byte_size) return attachmentUnconfirmed(operationId, op.storage_path)
    }
    const attached = await admin.rpc('attach_ordinary_upload', { p_owner: owner, p_operation: operationId })
    if (attached.error) {
      const code = attached.error.code || ''
      if (/^(22[0-9A-Z]{3}|23[0-9A-Z]{3}|42501|40001|40P01)$/.test(code)) {
        return { success: false, status: 'ATTACHMENT_REJECTED', operationId, path: op.storage_path,
          error: 'Attachment was rejected. The same file is retained for a later authorized retry.' }
      }
      return attachmentUnconfirmed(operationId, op.storage_path)
    }
    return attached.data?.status === 'ATTACHMENT_CONFIRMED' ? attached.data : attachmentUnconfirmed(operationId, op.storage_path)
  } catch { return unknown() }
}
