
import EntityPage from '@/app/components/Entity-Page'

export default async function DistrictPage({
  params
}: {
  params: Promise<{ district: string }>
}) {
  const { district } = await params

  return (
    <EntityPage
      entityType="district"
      slug={district}
    />
  )
}