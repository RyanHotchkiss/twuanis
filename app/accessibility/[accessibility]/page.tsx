import EntityPage from '@/app/components/Entity-Page'

export default async function AccessibilityPage({
  params
}: {
  params: Promise<{ accessibility: string }>
}) {
  const { accessibility } = await params

  return (
    <EntityPage
      entityType="accessibility"
      slug={accessibility}
    />
  )
}