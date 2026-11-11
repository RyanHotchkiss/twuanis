import {productAction} from '@/lib/measurement/journey-client'
import {normalizedSavedUniverse} from './saved-universe-contract'
import {analysisSavedReceipt} from './measurement/acknowledged'
import { supabase } from '@/lib/supabase'

import {
  getCurrentUser,
  requireCurrentUser
} from '@/lib/auth/current-user'

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
    filters: unknown
    result: unknown
    schemaVersion?: number
  }

export async function saveAnalysis({
  engineType,
  language,
  name,
  filters,
  result,
  schemaVersion = 1
}: SaveAnalysisInput) {
  filters=normalizedSavedUniverse(engineType,filters,result)
  const measurement=analysisSavedReceipt(language)
  const user =
  await requireCurrentUser()

  // The database remains authoritative for every direct REST/RPC read and write.
  // Unknown legacy identities must not acquire a guessed capability.
  const access = await supabase.rpc('can_access_saved_analysis', {
    p_engine: engineType,
    p_filters: filters
  })
  if (access.error || access.data !== true) {
    throw new Error('Current analytical capability is required to save this analysis.')
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
      result,
      schema_version: schemaVersion ?? 1
    })
    .select()
    .single()

  if (error) {
    throw error
  }

  try{if(data?.user_id===user.id&&data?.engine_type===engineType&&typeof data?.id==='string'){const question=data?.filters?.analysis_question;const alias=typeof question==='string'?question:['matching','comparison','scarcity'].includes(engineType)?engineType:'';await measurement(data.id,alias)}}catch{/* Save acknowledgement remains authoritative and unchanged. */}
  productAction('analysis_save','report','acknowledged')
  return data
}

export async function saveScarcityAnalysis({
    language,
    name,
    filters,
    result
  }: {
    language: SavedAnalysisLanguage
    name: string
    filters: unknown
    result: unknown
  }) {
    return saveAnalysis({
      engineType: 'scarcity',
      language,
      name,
      filters,
      result
    })
  }

export async function getSavedAnalyses() {
  const user =
  await getCurrentUser()

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

export async function getSavedScarcityAnalyses() {
  return getSavedAnalysesByEngine(
    'scarcity'
  )
}

export async function getSavedAnalysesByEngine(
  engineType: SavedAnalysisEngine
) {
  const user =
  await getCurrentUser()

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
    .eq('engine_type', engineType)
    .order('updated_at', {
      ascending: false
    })

  if (error) {
    throw error
  }

  return data
}

export async function getRecentSavedAnalyses(
  limit = 5
) {
  const user =
  await getCurrentUser()

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
    .limit(limit)

  if (error) {
    throw error
  }

  return data
}

export async function renameSavedAnalysis(
  id: string,
  name: string
) {
  const user =
  await requireCurrentUser()

  const {
    data,
    error
  } = await supabase
    .from('saved_analyses')
    .update({
      name,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) {
    throw error
  }

  productAction('analysis_rename','report','acknowledged')
  return data
}

export async function updateSavedAnalysis(
  id: string,
  updates: {
    name?: string
  }
) {
const user =
  await requireCurrentUser()

  const {
    data,
    error
  } = await supabase
    .from('saved_analyses')
    .update({
      ...(updates.name !== undefined && {
        name: updates.name
      }),
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) {
    throw error
  }

  productAction('analysis_update','report','acknowledged')
  return data
}

export async function duplicateSavedAnalysis(
  id: string
) {
const user =
  await requireCurrentUser()

  const {
    data: analysis,
    error: fetchError
  } = await supabase
    .from('saved_analyses')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (fetchError) {
    throw fetchError
  }

  const {
    data,
    error
  } = await supabase
    .from('saved_analyses')
    .insert({
      user_id: user.id,
      engine_type: analysis.engine_type,
      language: analysis.language,
      name: `${analysis.name} (Copy)`,
      filters: analysis.filters,
      result: analysis.result,
      schema_version: analysis.schema_version
    })
    .select()
    .single()

  if (error) {
    throw error
  }

  productAction('analysis_duplicate','report','acknowledged')
  return data
}

export async function deleteSavedAnalysis(
  id: string
) {
  const user =
  await requireCurrentUser()

  const {
    data,
    error
  } = await supabase
    .from('saved_analyses')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) {
    throw error
  }

  productAction('analysis_delete','report','acknowledged')
  return data
}
