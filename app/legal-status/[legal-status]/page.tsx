import EntityPage from '@/app/components/Entity-Page'

export default async function LegalStatusPage({
  params
}: {
  params: Promise<{ 'legal-status': string }>
}) {
  const { 'legal-status': legalStatus } = await params

  return (
    <EntityPage
      entityType="legal_status"
      slug={legalStatus}
    />
  )
}