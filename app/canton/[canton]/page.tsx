
import EntityPage from '@/app/components/Entity-Page'

export default async function CantonPage({
  params
}: {
  params: Promise<{ canton: string }>
}) {
  const { canton } = await params

  return (
    <EntityPage
      entityType="canton"
      slug={canton}
    />
  )
}
