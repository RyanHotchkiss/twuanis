
import EntityPage from '@/app/components/Entity-Page'

export default async function PropertyTypePage({
  params
}: {
  params: Promise<{ 'property-type': string }>
}) {
  const { 'property-type': propertyType } = await params

  return (
    <EntityPage
      entityType="property_type"
      slug={propertyType}
    />
  )
}
