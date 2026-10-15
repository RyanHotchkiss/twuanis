import type { Metadata } from 'next'
import OrchestratorStatus from '@/app/components/OrchestratorStatus'
export const metadata: Metadata = { title: "Estado de ingeniería de los orquestadores", robots: { index: false, follow: false } }
export default function Page() { return <OrchestratorStatus language="es" /> }
