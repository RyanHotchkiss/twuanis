import EntityPage from '@/app/components/Entity-Page'

export default async function TerrainPage({
  params
}: {
  params: Promise<{ terrain: string }>
}) {
  const { terrain } = await params

  return (
    <EntityPage
      entityType="terrain"
      slug={terrain}
    />
  )
}