import {
  isAuthenticated
} from '@/lib/storage/storage'

import {
  STORAGE_KEYS
} from '@/lib/storage/keys'

import {
  loadLocal,
  saveLocal
} from '@/lib/storage/local-storage'

import {
  saveAnalysis,
  getSavedAnalyses
} from '@/lib/saved-analyses'

import type {
  SavedAnalysisEngine,
  SavedAnalysisLanguage
} from '@/lib/saved-analyses'

type TemporaryAnalysis = {
  engineType:
    SavedAnalysisEngine

  language:
    SavedAnalysisLanguage

  name:
    string

  filters:
    unknown

  result:
    unknown

  schemaVersion?:
    number
}

export async function saveAnalysisState(
  analysis: TemporaryAnalysis
) {
  if (await isAuthenticated()) {
    return saveAnalysis(analysis)
  }

  const analyses =
    loadLocal<TemporaryAnalysis[]>(
      STORAGE_KEYS.savedAnalyses,
      []
    )

  analyses.unshift(analysis)

  saveLocal(
    STORAGE_KEYS.savedAnalyses,
    analyses
  )

  return analysis
}

export async function loadAnalysisState() {
  if (await isAuthenticated()) {
    return getSavedAnalyses()
  }

  return loadLocal<TemporaryAnalysis[]>(
    STORAGE_KEYS.savedAnalyses,
    []
  )
}