import { loadAnalysis } from '@/lib/load-analysis'
import ExploreResults from '@/app/explore/ExploreResults'

export default async function SavedAnalysisPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const analysis = await loadAnalysis(id)

  return (
    <ExploreResults
      result={analysis.result}
    />
  )
}