import EntityPage from '@/app/components/Entity-Page'

export default async function EnvironmentPage({
  params
}: {
  params: Promise<{ environment: string }>
}) {
  const { environment } = await params

  return (
    <EntityPage
      entityType="environment"
      slug={environment}
    />
  )
}