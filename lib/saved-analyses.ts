import { supabase } from '@/lib/supabase'

export type SavedAnalysisLanguage =
  | 'en'
  | 'es'

export type SavedAnalysisEngine =
  | 'explorer'
  | 'valuation'
  | 'pricing'
  | 'matching'
  | 'comparison'
  | 'scarcity'
  | 'price-meter'
  | 'buyer-demand'

type SaveAnalysisInput = {
  engineType: SavedAnalysisEngine
  language: SavedAnalysisLanguage
  name: string
  filters: Record<string, unknown>
  result: unknown
}

export async function saveAnalysis({
  engineType,
  language,
  name,
  filters,
  result
}: SaveAnalysisInput) {
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser()

  if (userError) {
    throw userError
  }

  if (!user) {
    throw new Error(
      language === 'es'
        ? 'Debes iniciar sesión para guardar un análisis.'
        : 'You must sign in to save an analysis.'
    )
  }

  const {
    data,
    error
  } = await supabase
    .from('saved_analyses')
    .insert({
      user_id: user.id,
      engine_type: engineType,
      language,
      name,
      filters,
      result
    })
    .select()
    .single()

  if (error) {
    throw error
  }

  return data
}
export async function getSavedAnalyses() {
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser()

  if (userError) {
    throw userError
  }

  if (!user) {
    return []
  }

  const {
    data,
    error
  } = await supabase
    .from('saved_analyses')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', {
      ascending: false
    })

  if (error) {
    throw error
  }

  return data
}