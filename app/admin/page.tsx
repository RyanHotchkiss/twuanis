import { resolveAdministrativeAuthority } from '@/lib/administrative-control'
import AdminHub from './AdminHub'
export const dynamic = 'force-dynamic'
export default async function AdminPage() {
 let authority = null
 try {
  const current = await resolveAdministrativeAuthority()
  if (current.owner || current.topAdministrator || current.permissions.length) authority = current
 } catch { /* Fail closed without serializing provider or database errors. */ }
 return <AdminHub authority={authority} />
}
