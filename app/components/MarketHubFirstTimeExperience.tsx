'use client'

import {
  useEffect,
  useState
} from 'react'

import Link from 'next/link'

import {
  MARKET_HUB_WELCOME_DISMISSED_KEY
} from '@/lib/onboarding'

import type {
  MarketHubExploreAction,
  MarketHubExploreActionId,
  MarketHubOnboardingProgress
} from '@/lib/onboarding'

import {
  ArrowRight,
  BarChart3,
  Check,
  Circle,
  Compass,
  Heart,
  HousePlus,
  LayoutDashboard,
  Package,
  Search,
  Sparkles
} from 'lucide-react'

type SupportedLanguage =
  | 'en'
  | 'es'

type FirstActionProgress = {
  savedFirstProperty: boolean
  publishedFirstListing: boolean
  createdFirstSavedSearch: boolean
}

type MarketHubFirstTimeExperienceProps = {
  language: SupportedLanguage
  userName?: string | null
  progress?: Partial<FirstActionProgress>
  exploreActions?: MarketHubExploreAction[]
  onboardingProgress?: MarketHubOnboardingProgress
}

export default function MarketHubFirstTimeExperience({
        language,
        userName,
        progress,
        exploreActions = [],
        onboardingProgress
        }: MarketHubFirstTimeExperienceProps) {

            const [
            welcomeHidden,
            setWelcomeHidden
        ] = useState(false)

        useEffect(() => {
            const storedValue =
            window.localStorage.getItem(
                MARKET_HUB_WELCOME_DISMISSED_KEY
            )

            setWelcomeHidden(
            storedValue === 'true'
            )
        }, [])

        function hideWelcome() {
            window.localStorage.setItem(
            MARKET_HUB_WELCOME_DISMISSED_KEY,
            'true'
            )

            setWelcomeHidden(true)
        }

  const checklistProgress: FirstActionProgress = {
    savedFirstProperty:
      progress?.savedFirstProperty ?? false,
    publishedFirstListing:
      progress?.publishedFirstListing ?? false,
    createdFirstSavedSearch:
      progress?.createdFirstSavedSearch ?? false
  }

    const completedCount = [
    checklistProgress.savedFirstProperty,
    checklistProgress.publishedFirstListing,
    checklistProgress.createdFirstSavedSearch
  ].filter(Boolean).length

  const resolvedProgress: MarketHubOnboardingProgress =
    onboardingProgress ?? {
      completed: completedCount,
      remaining: 3 - completedCount,
      total: 3,
      percentage: Math.round(
        (completedCount / 3) * 100
      )
    }

  const labels =
    language === 'es'
      ? {
          phaseOne: 'Fase 1',
          phaseTwo: 'Fase 2',
          stepOne: 'Paso 1',
          heading: userName
            ? `Bienvenido a MarketHub, ${userName}`
            : 'Bienvenido a MarketHub',
          purpose:
            'Este es el lugar donde Twuanis recuerda sus propiedades, búsquedas, publicaciones e inteligencia de mercado.',
          welcome: 'Bienvenida',
          quickOverview: 'Resumen Rápido',
          quickOverviewDescription:
            'MarketHub organiza toda su actividad inmobiliaria en un solo lugar.',
          listings: 'Administre sus publicaciones',
          favorites:
            'Recuerde propiedades y búsquedas importantes',
          intelligence:
            'Explore y guarde inteligencia de mercado',
          getStarted: 'Comenzar',
          getStartedDescription:
            'Comience explorando propiedades o publique su primera propiedad.',
          exploreProperties: 'Explorar Propiedades',
          publishProperty: 'Publicar una Propiedad',
          firstActions: 'Primeras Acciones',
          checklist: 'Lista de Primeros Pasos',
          checklistDescription:
            'Complete estas primeras acciones para comenzar a construir su MarketHub.',
          saveFirstProperty: 'Guardar Primera Propiedad',
          saveFirstPropertyDescription:
            'Guarde una propiedad que quiera recordar o comparar.',
          publishFirstListing:
            'Publicar Primera Propiedad',
          publishFirstListingDescription:
            'Publique una propiedad para venta o alquiler.',
          createFirstSavedSearch:
            'Crear Primera Búsqueda Guardada',
          createFirstSavedSearchDescription:
            'Guarde sus criterios para encontrar nuevas propiedades rápidamente.',
          completed: 'Completado',
          start: 'Comenzar',
          stepTwo: 'Paso 2',
          explore: 'Explorar',
          exploreDescription:
            'Descubra las herramientas principales disponibles dentro de MarketHub.',
          open: 'Explorar',
          phaseThree: 'Fase 3',
          progressStep: 'Paso 1',
          progress: 'Progreso',
          progressDescription:
            'Vea cuánto ha avanzado en sus primeros pasos dentro de MarketHub.',
          completion: 'Finalización',
          completedCount: 'Completado',
          remainingCount: 'Restante',
          dismissStep: 'Paso 2',
          dismiss: 'Ocultar',
          dismissDescription:
            'Continúe explorando MarketHub o elimine esta guía de bienvenida.',
          continueExploring:
            'Continuar Explorando',
          hideWelcome:
            'Ocultar Bienvenida'
        }
      : {
          phaseOne: 'Phase 1',
          phaseTwo: 'Phase 2',
          stepOne: 'Step 1',
          heading: userName
            ? `Welcome to MarketHub, ${userName}`
            : 'Welcome to MarketHub',
          purpose:
            'This is where Twuanis remembers your properties, searches, listings, and market intelligence.',
          welcome: 'Welcome',
          quickOverview: 'Quick Overview',
          quickOverviewDescription:
            'MarketHub organizes all your real estate activity in one place.',
          listings: 'Manage your property listings',
          favorites:
            'Remember important properties and searches',
          intelligence:
            'Explore and save market intelligence',
          getStarted: 'Get Started',
          getStartedDescription:
            'Begin by exploring properties or publishing your first listing.',
          exploreProperties: 'Explore Properties',
          publishProperty: 'Publish a Property',
          firstActions: 'First Actions',
          checklist: 'Getting Started Checklist',
          checklistDescription:
            'Complete these first actions to begin building your MarketHub.',
          saveFirstProperty: 'Save First Property',
          saveFirstPropertyDescription:
            'Save a property you want to remember or compare.',
          publishFirstListing:
            'Publish First Listing',
          publishFirstListingDescription:
            'Publish a property for sale or rent.',
          createFirstSavedSearch:
            'Create First Saved Search',
          createFirstSavedSearchDescription:
            'Save your criteria to quickly find new properties.',
          completed: 'Completed',
          start: 'Get Started',
          stepTwo: 'Step 2',
          explore: 'Explore',
          exploreDescription:
            'Discover the primary tools available throughout MarketHub.',
          open: 'Explore',
          phaseThree: 'Phase 3',
          progressStep: 'Step 1',
          progress: 'Progress',
          progressDescription:
            'See how far you have progressed through your first MarketHub milestones.',
          completion: 'Completion',
          completedCount: 'Completed',
          remainingCount: 'Remaining',
          dismissStep: 'Step 2',
          dismiss: 'Dismiss',
          dismissDescription:
            'Continue exploring MarketHub or remove this welcome guide.',
          continueExploring:
            'Continue Exploring',
          hideWelcome:
            'Hide Welcome'
        }

          const continueExploringHref =
            language === 'es'
            ? '/es/inteligencia-de-mercado?tab=explorer'
            : '/en/market-intelligence?tab=explorer'

  const exploreHref =
    language === 'es'
      ? '/es/comprar'
      : '/en/buy'

  const publishHref =
    language === 'es'
      ? '/es/centro-de-mercado?publish=true'
      : '/en/market-hub?publish=true'

  const savedSearchHref =
    language === 'es'
      ? '/es/comprar?save-search=true'
      : '/en/buy?save-search=true'

          if (welcomeHidden) {
                return null
            }

  return (
    <section style={section}>
      <header>
        <div style={phaseLabel}>
          {labels.phaseOne}
        </div>

        <div style={titleRow}>
          <div style={titleIcon}>
            <Sparkles
              size={28}
              strokeWidth={0.9}
            />
          </div>

          <div>
            <h2 style={heading}>
              {labels.heading}
            </h2>

            <p style={purpose}>
              {labels.purpose}
            </p>
          </div>
        </div>
      </header>

      <div style={divider} />

      <div style={stepHeader}>
        <div>
          <div style={stepLabel}>
            {labels.stepOne}
          </div>

          <h3 style={stepHeading}>
            {labels.welcome}
          </h3>
        </div>
      </div>

      <div style={contentGrid}>
        <article style={card}>
          <div style={widgetHeader}>
            <div style={widgetIcon}>
              <LayoutDashboard
                size={24}
                strokeWidth={1}
              />
            </div>

            <div>
              <h4 style={widgetHeading}>
                {labels.quickOverview}
              </h4>

              <p style={widgetDescription}>
                {labels.quickOverviewDescription}
              </p>
            </div>
          </div>

          <div style={overviewList}>
            <OverviewItem
              icon={
                <HousePlus
                  size={19}
                  strokeWidth={1}
                />
              }
              label={labels.listings}
            />

            <OverviewItem
              icon={
                <Heart
                  size={19}
                  strokeWidth={1}
                />
              }
              label={labels.favorites}
            />

            <OverviewItem
              icon={
                <Compass
                  size={19}
                  strokeWidth={1}
                />
              }
              label={labels.intelligence}
            />
          </div>
        </article>

        <article style={getStartedCard}>
          <div style={widgetHeader}>
            <div style={widgetIcon}>
              <ArrowRight
                size={24}
                strokeWidth={1}
              />
            </div>

            <div>
              <h4 style={widgetHeading}>
                {labels.getStarted}
              </h4>

              <p style={widgetDescription}>
                {labels.getStartedDescription}
              </p>
            </div>
          </div>

          <div style={buttonGroup}>
            <Link
              href={exploreHref}
              style={primaryButton}
            >
              {labels.exploreProperties}

              <ArrowRight
                size={17}
                strokeWidth={1}
              />
            </Link>

            <Link
              href={publishHref}
              style={secondaryButton}
            >
              <HousePlus
                size={17}
                strokeWidth={1}
              />

              {labels.publishProperty}
            </Link>
          </div>
        </article>
      </div>

      <div style={phaseDivider} />

      <div>
        <div style={phaseLabel}>
          {labels.phaseTwo}
        </div>

        <div style={stepLabel}>
          {labels.stepOne}
        </div>

        <h3 style={stepHeading}>
          {labels.firstActions}
        </h3>
      </div>

      <article style={checklistCard}>
        <div style={widgetHeader}>
          <div style={widgetIcon}>
            <Check
              size={24}
              strokeWidth={1}
            />
          </div>

          <div>
            <h4 style={widgetHeading}>
              {labels.checklist}
            </h4>

            <p style={widgetDescription}>
              {labels.checklistDescription}
            </p>
          </div>
        </div>

        <div style={checklist}>
          <ChecklistItem
            completed={
              checklistProgress.savedFirstProperty
            }
            icon={
              <Heart
                size={20}
                strokeWidth={1}
              />
            }
            title={labels.saveFirstProperty}
            description={
              labels.saveFirstPropertyDescription
            }
            href={exploreHref}
            actionLabel={labels.start}
            completedLabel={labels.completed}
          />

          <ChecklistItem
            completed={
              checklistProgress.publishedFirstListing
            }
            icon={
              <HousePlus
                size={20}
                strokeWidth={1}
              />
            }
            title={labels.publishFirstListing}
            description={
              labels.publishFirstListingDescription
            }
            href={publishHref}
            actionLabel={labels.start}
            completedLabel={labels.completed}
          />

          <ChecklistItem
            completed={
              checklistProgress.createdFirstSavedSearch
            }
            icon={
              <Search
                size={20}
                strokeWidth={1}
              />
            }
            title={labels.createFirstSavedSearch}
            description={
              labels.createFirstSavedSearchDescription
            }
            href={savedSearchHref}
            actionLabel={labels.start}
            completedLabel={labels.completed}
          />
        </div>
    </article>

    <div style={stepDivider} />
        <div>
            <div style={stepLabel}>
            {labels.stepTwo}
            </div>

            <h3 style={stepHeading}>
            {labels.explore}
            </h3>

            <p style={stepDescription}>
            {labels.exploreDescription}
            </p>
        </div>

              <div style={exploreGrid}>
        {exploreActions.map(action => (
          <ExploreItem
            key={action.id}
            id={action.id}
            title={action.title[language]}
            description={
              action.description[language]
            }
            href={action.href[language]}
            actionLabel={labels.open}
          />
        ))}
      </div>

      <div style={phaseDivider} />

      <div>
        <div style={phaseLabel}>
          {labels.phaseThree}
        </div>

        <div style={stepLabel}>
          {labels.progressStep}
        </div>

        <h3 style={stepHeading}>
          {labels.progress}
        </h3>

        <p style={stepDescription}>
          {labels.progressDescription}
        </p>
      </div>

      <article style={progressCard}>
        <div style={progressHeader}>
          <div>
            <h4 style={widgetHeading}>
              {labels.completion}
            </h4>

            <p style={progressPercentage}>
              {resolvedProgress.percentage}%
            </p>
          </div>

          <div style={progressSummary}>
            <ProgressMetric
              value={resolvedProgress.completed}
              label={labels.completedCount}
            />

            <ProgressMetric
              value={resolvedProgress.remaining}
              label={labels.remainingCount}
            />
          </div>
        </div>

        <div style={progressTrack}>
          <div
            style={{
              ...progressBar,
              width:
                `${resolvedProgress.percentage}%`
            }}
          />
        </div>

                <p style={progressTotal}>
          {resolvedProgress.completed}
          {' / '}
          {resolvedProgress.total}
        </p>
      </article>

      <div style={stepDivider} />

      <div>
        <div style={stepLabel}>
          {labels.dismissStep}
        </div>

        <h3 style={stepHeading}>
          {labels.dismiss}
        </h3>

        <p style={stepDescription}>
          {labels.dismissDescription}
        </p>
      </div>

      <article style={dismissCard}>
        <div style={dismissContent}>
          <div>
            <h4 style={widgetHeading}>
              {labels.continueExploring}
            </h4>

            <p style={widgetDescription}>
              {labels.dismissDescription}
            </p>
          </div>

          <div style={dismissActions}>
            <Link
              href={continueExploringHref}
              style={primaryButton}
            >
              {labels.continueExploring}

              <ArrowRight
                size={17}
                strokeWidth={1}
              />
            </Link>

            <button
              type="button"
              onClick={hideWelcome}
              style={hideWelcomeButton}
            >
              {labels.hideWelcome}
            </button>
          </div>
        </div>
      </article>
    </section>
  )
}

function OverviewItem({
  icon,
  label
}: {
  icon: React.ReactNode
  label: string
}) {
  return (
    <div style={overviewItem}>
      <div style={overviewItemIcon}>
        {icon}
      </div>

      <span style={overviewItemText}>
        {label}
      </span>
    </div>
  )
}

function ChecklistItem({
  completed,
  icon,
  title,
  description,
  href,
  actionLabel,
  completedLabel
}: {
  completed: boolean
  icon: React.ReactNode
  title: string
  description: string
  href: string
  actionLabel: string
  completedLabel: string
}) {
  return (
    <div
      style={{
        ...checklistItem,
        ...(completed
          ? completedChecklistItem
          : {})
      }}
    >
      <div
        style={{
          ...checklistStatus,
          ...(completed
            ? completedChecklistStatus
            : {})
        }}
      >
        {completed
          ? (
              <Check
                size={18}
                strokeWidth={1.5}
              />
            )
          : (
              <Circle
                size={18}
                strokeWidth={1}
              />
            )}
      </div>

      <div style={checklistContent}>
        <div style={checklistTitleRow}>
          <div style={checklistItemIcon}>
            {icon}
          </div>

          <h5 style={checklistItemTitle}>
            {title}
          </h5>
        </div>

        <p style={checklistItemDescription}>
          {description}
        </p>
      </div>

      {completed
        ? (
            <span style={completedText}>
              {completedLabel}
            </span>
          )
        : (
            <Link
              href={href}
              style={checklistButton}
            >
              {actionLabel}

              <ArrowRight
                size={16}
                strokeWidth={1}
              />
            </Link>
          )}
    </div>
  )
}

function ExploreItem({
        id,
        title,
        description,
        href,
        actionLabel
        }: {
        id: MarketHubExploreActionId
        title: string
        description: string
        href: string
        actionLabel: string
        }) {
        const icon =
            id === 'market-explorer'
            ? (
                <Compass
                    size={24}
                    strokeWidth={1}
                />
                )
            : id === 'market-intelligence'
                ? (
                    <BarChart3
                    size={24}
                    strokeWidth={1}
                    />
                )
                : (
                    <Package
                    size={24}
                    strokeWidth={1}
                    />
                )

        return (
            <article style={exploreCard}>
            <div style={exploreCardHeader}>
                <div style={widgetIcon}>
                {icon}
                </div>

                <div>
                <h4 style={widgetHeading}>
                    {title}
                </h4>

                <p style={widgetDescription}>
                    {description}
                </p>
                </div>
            </div>

            <Link
                href={href}
                style={exploreButton}
            >
                {actionLabel}

                <ArrowRight
                size={16}
                strokeWidth={1}
                />
            </Link>
            </article>
        )
        }

function ProgressMetric({
  value,
  label
}: {
  value: number
  label: string
}) {
  return (
    <div style={progressMetric}>
      <strong style={progressMetricValue}>
        {value}
      </strong>

      <span style={progressMetricLabel}>
        {label}
      </span>
    </div>
  )
}

const section = {
  padding: '1.5rem',
  background: '#151515',
  border: '1px solid #303030',
  borderRadius: '18px'
}

const phaseLabel = {
  marginBottom: '.65rem',
  color: '#ff3b00',
  fontSize: '.75rem',
  fontWeight: 700,
  letterSpacing: '.08em',
  textTransform: 'uppercase' as const
}

const titleRow = {
  display: 'grid',
  gridTemplateColumns:
    'auto minmax(0, 1fr)',
  alignItems: 'center',
  gap: '.9rem'
}

const titleIcon = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '3.5rem',
  height: '3.5rem',
  color: '#C7A44B',
  background: '#1b1b1b',
  border: '1px solid #303030',
  borderRadius: '999px'
}

const heading = {
  margin: 0,
  color: '#fff',
  fontSize: '1.75rem',
  lineHeight: 1.2
}

const purpose = {
  maxWidth: '750px',
  margin: '.55rem 0 0',
  color: '#aaa',
  fontSize: '.92rem',
  lineHeight: 1.5
}

const divider = {
  height: '1px',
  margin: '1.5rem 0',
  background: '#303030'
}

const phaseDivider = {
  height: '1px',
  margin: '2rem 0 1.5rem',
  background: '#303030'
}

const stepHeader = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '1rem'
}

const stepLabel = {
  color: '#777',
  fontSize: '.72rem',
  fontWeight: 700,
  letterSpacing: '.08em',
  textTransform: 'uppercase' as const
}

const stepHeading = {
  margin: '.3rem 0 0',
  color: '#ff3b00',
  fontSize: '1.2rem'
}

const contentGrid = {
  display: 'grid',
  gridTemplateColumns:
    'repeat(auto-fit, minmax(280px, 1fr))',
  gap: '1rem',
  marginTop: '1.25rem'
}

const card = {
  padding: '1.25rem',
  background: '#191919',
  border: '1px solid #303030',
  borderRadius: '14px'
}

const getStartedCard = {
  ...card,
  display: 'flex',
  flexDirection: 'column' as const,
  justifyContent: 'space-between'
}

const checklistCard = {
  ...card,
  marginTop: '1.25rem'
}

const widgetHeader = {
  display: 'grid',
  gridTemplateColumns:
    'auto minmax(0, 1fr)',
  alignItems: 'flex-start',
  gap: '.8rem'
}

const widgetIcon = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '2.75rem',
  height: '2.75rem',
  color: '#C7A44B',
  background: '#202020',
  border: '1px solid #343434',
  borderRadius: '10px'
}

const widgetHeading = {
  margin: 0,
  color: '#fff',
  fontSize: '1rem'
}

const widgetDescription = {
  margin: '.4rem 0 0',
  color: '#929292',
  fontSize: '.82rem',
  lineHeight: 1.5
}

const overviewList = {
  display: 'grid',
  gap: '.75rem',
  marginTop: '1.25rem'
}

const overviewItem = {
  display: 'flex',
  alignItems: 'center',
  gap: '.7rem',
  padding: '.8rem',
  background: '#1d1d1d',
  border: '1px solid #303030',
  borderRadius: '10px'
}

const overviewItemIcon = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  color: '#C7A44B'
}

const overviewItemText = {
  color: '#bbb',
  fontSize: '.84rem',
  lineHeight: 1.4
}

const buttonGroup = {
  display: 'flex',
  flexWrap: 'wrap' as const,
  gap: '.75rem',
  marginTop: '1.5rem'
}

const primaryButton = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '.5rem',
  padding: '.75rem 1rem',
  color: '#111',
  background: '#C7A44B',
  border: '1px solid #C7A44B',
  borderRadius: '10px',
  textDecoration: 'none',
  fontSize: '.85rem',
  fontWeight: 700
}

const secondaryButton = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '.5rem',
  padding: '.75rem 1rem',
  color: '#C7A44B',
  background: '#1d1d1d',
  border: '1px solid #C7A44B',
  borderRadius: '10px',
  textDecoration: 'none',
  fontSize: '.85rem',
  fontWeight: 600
}

const checklist = {
  display: 'grid',
  gap: '.75rem',
  marginTop: '1.25rem'
}

const checklistItem = {
  display: 'grid',
  gridTemplateColumns:
    'auto minmax(0, 1fr) auto',
  alignItems: 'center',
  gap: '.9rem',
  padding: '1rem',
  background: '#1d1d1d',
  border: '1px solid #303030',
  borderRadius: '12px'
}

const completedChecklistItem = {
  opacity: 0.72,
  background: '#191919'
}

const checklistStatus = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '2rem',
  height: '2rem',
  color: '#777',
  border: '1px solid #444',
  borderRadius: '999px'
}

const completedChecklistStatus = {
  color: '#111',
  background: '#C7A44B',
  borderColor: '#C7A44B'
}

const checklistContent = {
  minWidth: 0
}

const checklistTitleRow = {
  display: 'flex',
  alignItems: 'center',
  gap: '.55rem'
}

const checklistItemIcon = {
  display: 'flex',
  color: '#C7A44B'
}

const checklistItemTitle = {
  margin: 0,
  color: '#fff',
  fontSize: '.9rem'
}

const checklistItemDescription = {
  margin: '.35rem 0 0',
  color: '#8e8e8e',
  fontSize: '.78rem',
  lineHeight: 1.45
}

const checklistButton = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '.4rem',
  padding: '.6rem .8rem',
  color: '#C7A44B',
  background: '#202020',
  border: '1px solid #C7A44B',
  borderRadius: '8px',
  textDecoration: 'none',
  fontSize: '.76rem',
  fontWeight: 600,
  whiteSpace: 'nowrap' as const
}

const completedText = {
  color: '#C7A44B',
  fontSize: '.76rem',
  fontWeight: 700,
  whiteSpace: 'nowrap' as const
}

const stepDivider = {
  height: '1px',
  margin: '1.5rem 0',
  background: '#292929'
}

const stepDescription = {
  maxWidth: '700px',
  margin: '.5rem 0 0',
  color: '#929292',
  fontSize: '.82rem',
  lineHeight: 1.5
}

const exploreGrid = {
  display: 'grid',
  gridTemplateColumns:
    'repeat(auto-fit, minmax(240px, 1fr))',
  gap: '1rem',
  marginTop: '1.25rem'
}

const exploreCard = {
  display: 'flex',
  flexDirection: 'column' as const,
  justifyContent: 'space-between',
  minHeight: '190px',
  padding: '1.25rem',
  background: '#191919',
  border: '1px solid #303030',
  borderRadius: '14px'
}

const exploreCardHeader = {
  display: 'grid',
  gridTemplateColumns:
    'auto minmax(0, 1fr)',
  alignItems: 'flex-start',
  gap: '.8rem'
}

const exploreButton = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  alignSelf: 'flex-start',
  gap: '.4rem',
  marginTop: '1.25rem',
  padding: '.65rem .85rem',
  color: '#C7A44B',
  background: '#202020',
  border: '1px solid #C7A44B',
  borderRadius: '8px',
  textDecoration: 'none',
  fontSize: '.78rem',
  fontWeight: 600
}

const progressCard = {
  marginTop: '1.25rem',
  padding: '1.25rem',
  background: '#191919',
  border: '1px solid #303030',
  borderRadius: '14px'
}

const progressHeader = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  flexWrap: 'wrap' as const,
  gap: '1.25rem'
}

const progressPercentage = {
  margin: '.35rem 0 0',
  color: '#C7A44B',
  fontSize: '2.25rem',
  fontWeight: 700,
  lineHeight: 1
}

const progressSummary = {
  display: 'flex',
  alignItems: 'center',
  gap: '.75rem'
}

const progressMetric = {
  minWidth: '105px',
  padding: '.8rem 1rem',
  background: '#1d1d1d',
  border: '1px solid #303030',
  borderRadius: '10px',
  textAlign: 'center' as const
}

const progressMetricValue = {
  display: 'block',
  color: '#fff',
  fontSize: '1.2rem'
}

const progressMetricLabel = {
  display: 'block',
  marginTop: '.25rem',
  color: '#888',
  fontSize: '.72rem'
}

const progressTrack = {
  width: '100%',
  height: '.65rem',
  marginTop: '1.25rem',
  overflow: 'hidden',
  background: '#292929',
  borderRadius: '999px'
}

const progressBar = {
  height: '100%',
  minWidth: 0,
  background: '#C7A44B',
  borderRadius: '999px',
  transition: 'width 250ms ease'
}

const progressTotal = {
  margin: '.65rem 0 0',
  color: '#777',
  fontSize: '.75rem',
  textAlign: 'right' as const
}

const dismissCard = {
  marginTop: '1.25rem',
  padding: '1.25rem',
  background: '#191919',
  border: '1px solid #303030',
  borderRadius: '14px'
}

const dismissContent = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  flexWrap: 'wrap' as const,
  gap: '1.25rem'
}

const dismissActions = {
  display: 'flex',
  alignItems: 'center',
  flexWrap: 'wrap' as const,
  gap: '.75rem'
}

const hideWelcomeButton = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '.75rem 1rem',
  color: '#aaa',
  background: '#1d1d1d',
  border: '1px solid #444',
  borderRadius: '10px',
  cursor: 'pointer',
  fontFamily: 'inherit',
  fontSize: '.85rem',
  fontWeight: 600
}