
import EntityPage from '@/app/components/Entity-Page'

export default async function ProvincePage({
  params
}: {
  params: Promise<{ province: string }>
}) {
  const { province } = await params

  return (
    <EntityPage
      entityType="province"
      slug={province}
    />
  )
}
