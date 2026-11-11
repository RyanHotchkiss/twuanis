import EntityPage from '@/app/components/Entity-Page'

export default async function UtilityPage({
  params
}: {
  params: Promise<{ utility: string }>
}) {
  const { utility } = await params

  return (
    <EntityPage
      entityType="utility"
      slug={utility}
    />
  )
}