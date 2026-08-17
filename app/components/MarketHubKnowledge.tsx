'use client'

import {
  useState
} from 'react'

import {
  BarChart3,
  Columns3,
  FolderHeart,
  Heart,
  LayoutDashboard,
  NotebookPen,
  Search
} from 'lucide-react'

import MarketHubFavorites
  from '@/app/components/MarketHubFavorites'

import MarketHubPropertyNotes
  from '@/app/components/MarketHubPropertyNotes'

import MarketHubSavedAnalyses
  from '@/app/components/MarketHubSavedAnalyses'

import MarketHubComparisons
  from '@/app/components/MarketHubComparisons'


type SupportedLanguage =
  | 'en'
  | 'es'


type KnowledgeWorkspace =
  | 'overview'
  | 'properties'
  | 'searches'
  | 'collections'
  | 'notes'
  | 'analyses'
  | 'comparisons'


type MarketHubKnowledgeProps = {
  language:
    SupportedLanguage
}


export default function MarketHubKnowledge({
  language
}: MarketHubKnowledgeProps) {

  const [
    activeWorkspace,
    setActiveWorkspace
  ] =
    useState<KnowledgeWorkspace>(
      'overview'
    )


  const labels =
    language === 'es'
      ? {
          overview:
            'Resumen',

          properties:
            'Propiedades',

          searches:
            'Búsquedas',

          collections:
            'Colecciones',

          notes:
            'Notas',

          analyses:
            'Análisis',

          comparisons:
            'Comparaciones',

          overviewDescription:
            'Su conocimiento guardado y actividad reciente.',

          propertiesDescription:
            'Propiedades que ha guardado para revisar, organizar y comparar.',

          searchesDescription:
            'Búsquedas de mercado guardadas para continuar su investigación.',

          collectionsDescription:
            'Organice propiedades guardadas en grupos que tengan sentido para usted.',

          notesDescription:
            'Notas privadas vinculadas a propiedades específicas.',

          analysesDescription:
            'Análisis de mercado guardados que puede reabrir y continuar.',

          comparisonsDescription:
            'Herramientas especializadas para comparar propiedades, mercados y entidades.'
        }
      : {
          overview:
            'Overview',

          properties:
            'Properties',

          searches:
            'Searches',

          collections:
            'Collections',

          notes:
            'Notes',

          analyses:
            'Analyses',

          comparisons:
            'Comparisons',

          overviewDescription:
            'Your saved knowledge and recent activity.',

          propertiesDescription:
            'Properties you saved to review, organize, and compare.',

          searchesDescription:
            'Saved market searches you can return to and continue investigating.',

          collectionsDescription:
            'Organize saved properties into groups that matter to you.',

          notesDescription:
            'Private notes connected to individual properties.',

          analysesDescription:
            'Saved market analyses you can reopen and continue.',

          comparisonsDescription:
            'Specialized systems for comparing properties, markets, and entities.'
        }


  const navigationItems = [
    {
      id:
        'overview' as const,

      label:
        labels.overview,

      icon:
        LayoutDashboard
    },

    {
      id:
        'properties' as const,

      label:
        labels.properties,

      icon:
        Heart
    },

    {
      id:
        'searches' as const,

      label:
        labels.searches,

      icon:
        Search
    },

    {
      id:
        'collections' as const,

      label:
        labels.collections,

      icon:
        FolderHeart
    },

    {
      id:
        'notes' as const,

      label:
        labels.notes,

      icon:
        NotebookPen
    },

    {
      id:
        'analyses' as const,

      label:
        labels.analyses,

      icon:
        BarChart3
    },

    {
      id:
        'comparisons' as const,

      label:
        labels.comparisons,

      icon:
        Columns3
    }
  ]


  const descriptions:
    Record<
      KnowledgeWorkspace,
      string
    > = {
      overview:
        labels.overviewDescription,

      properties:
        labels.propertiesDescription,

      searches:
        labels.searchesDescription,

      collections:
        labels.collectionsDescription,

      notes:
        labels.notesDescription,

      analyses:
        labels.analysesDescription,

      comparisons:
        labels.comparisonsDescription
    }


  return (
    <section style={workspace}>

      <nav style={workspaceTabs}>
        {navigationItems.map(
          item => {

            const Icon =
              item.icon

            const selected =
              activeWorkspace ===
              item.id

            return (
              <button
                key={item.id}
                type="button"
                onClick={() =>
                  setActiveWorkspace(
                    item.id
                  )
                }
                style={{
                  ...workspaceTab,

                  color:
                    selected
                      ? '#fff'
                      : '#777',

                  borderBottomColor:
                    selected
                      ? '#C7A44B'
                      : 'transparent'
                }}
              >
                <Icon
                  size={16}
                  strokeWidth={
                    selected
                      ? 1.5
                      : 1
                  }
                />

                <span>
                  {item.label}
                </span>
              </button>
            )
          }
        )}
      </nav>


      <div style={workspaceContext}>
        {
          descriptions[
            activeWorkspace
          ]
        }
      </div>


      <div style={workspaceCanvas}>
        {activeWorkspace ===
          'overview' && (
          <MarketHubFavorites
            language={language}
            workspaceView="overview"
          />
        )}


        {activeWorkspace ===
          'properties' && (
          <MarketHubFavorites
            language={language}
            workspaceView="properties"
          />
        )}


        {activeWorkspace ===
          'searches' && (
          <MarketHubFavorites
            language={language}
            workspaceView="searches"
          />
        )}


        {activeWorkspace ===
          'collections' && (
          <MarketHubFavorites
            language={language}
            workspaceView="collections"
          />
        )}


        {activeWorkspace ===
          'notes' && (
          <MarketHubPropertyNotes
            language={language}
          />
        )}


        {activeWorkspace ===
          'analyses' && (
          <MarketHubSavedAnalyses
            language={language}
          />
        )}


        {activeWorkspace ===
          'comparisons' && (
          <MarketHubComparisons
            language={language}
          />
        )}
      </div>

    </section>
  )
}


const workspace = {
  minWidth: 0
}


const workspaceTabs = {
  display: 'flex',
  alignItems: 'center',
  gap: '1.6rem',
  overflowX: 'auto' as const,
  borderBottom: '1px solid #292929'
}


const workspaceTab = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '.45rem',
  flexShrink: 0,
  padding: '0 0 .85rem',
  color: '#777',
  background: 'transparent',
  border: 0,
  borderBottom: '2px solid transparent',
  fontFamily: 'inherit',
  fontSize: '.82rem',
  fontWeight: 600,
  cursor: 'pointer'
}


const workspaceContext = {
  marginTop: '1rem',
  color: '#666',
  fontSize: '.78rem',
  lineHeight: 1.5
}


const workspaceCanvas = {
  marginTop: '1.5rem'
}